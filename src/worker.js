// Jurybox Worker: static site from ./public; every case is its own SQLite-backed Durable Object (Case);
// per-IP write limits live in a tiny Limiter Durable Object.
import { DurableObject } from 'cloudflare:workers';
import {
  validateCase, validateSide, validateVote, status, tally, verdict, bestRuling, headline, timeLeft,
  MIN_VOTES_TO_CALL, MAX_JURORS, KEEP_DAYS,
} from './logic.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS case_row (k INTEGER PRIMARY KEY CHECK (k = 1), id TEXT, mode TEXT, q TEXT,
  a_label TEXT, a_text TEXT, a_tok TEXT, b_label TEXT, b_text TEXT, b_tok TEXT, invite TEXT,
  blind INTEGER, hours INTEGER, created INTEGER, opened INTEGER, deadline INTEGER, called INTEGER);
CREATE TABLE IF NOT EXISTS votes (id INTEGER PRIMARY KEY AUTOINCREMENT, tok TEXT UNIQUE, name TEXT, choice TEXT,
  ruling TEXT, created INTEGER, updated INTEGER);
CREATE TABLE IF NOT EXISTS ups (vote_id INTEGER, tok TEXT, PRIMARY KEY (vote_id, tok))`;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const fail = (error, status = 400) => json({ error }, status);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function sha(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function randomId(n, alphabet = 'abcdefghijkmnpqrstuvwxyz23456789') {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}
const validToken = (t) => typeof t === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(t);

export class Case extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.reads = new Map();
  }

  exists() {
    return this.sql.exec("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'case_row'").toArray().length > 0;
  }
  row() {
    return this.exists() ? this.sql.exec('SELECT * FROM case_row WHERE k = 1').toArray()[0] ?? null : null;
  }
  votes() {
    return this.sql.exec(`SELECT v.*, (SELECT COUNT(*) FROM ups u WHERE u.vote_id = v.id) AS ups
      FROM votes v ORDER BY v.created, v.id`).toArray();
  }
  async wipe() {
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }
  async alarm() { await this.wipe(); }

  role(c, tokHash, inviteOk) {
    if (tokHash && tokHash === c.a_tok) return c.mode === 'debate' ? 'clerk' : 'a';
    if (tokHash && c.b_tok && tokHash === c.b_tok) return 'b';
    if (inviteOk && !c.b_label) return 'invitee';
    return 'juror';
  }

  view(c, role, tokHash, now) {
    const st = status(c, now);
    const votes = this.votes();
    const mine = votes.find((v) => v.tok === tokHash);
    const party = role === 'a' || role === 'b';
    const hide = st === 'open' && c.blind && !party;
    const out = {
      id: c.id, mode: c.mode, q: c.q, status: st, role, blind: !!c.blind, hours: c.hours,
      created: c.created, opened: c.opened, deadline: c.deadline, now,
      a: st === 'pending' && role === 'juror' ? { label: c.a_label, text: null } : { label: hide ? null : c.a_label, text: c.a_text },
      b: c.b_label ? { label: hide ? null : c.b_label, text: c.b_text } : null,
      count: votes.length,
      jurors: votes.map((v) => v.name),
      me: mine ? { name: mine.name, choice: mine.choice, ruling: mine.ruling } : null,
      canManage: party || role === 'clerk',
      canCall: (party || role === 'clerk') && st === 'open' && votes.length >= MIN_VOTES_TO_CALL,
      minToCall: MIN_VOTES_TO_CALL,
    };
    if (role === 'a' && st === 'pending') out.invite = c.invite;
    if (st === 'ruled') {
      const t = tally(votes);
      const v = verdict(t);
      const best = bestRuling(votes, v.outcome);
      const upped = new Set(tokHash ? this.sql.exec('SELECT vote_id FROM ups WHERE tok = ?', tokHash).toArray().map((r) => r.vote_id) : []);
      out.result = {
        tally: t, outcome: v.outcome, stamp: v.stamp, headline: headline(c, v, t),
        best: best ? { id: best.id, name: best.name, ruling: best.ruling, choice: best.choice, ups: best.ups } : null,
        votes: votes.map((x) => ({ id: x.id, name: x.name, choice: x.choice, ruling: x.ruling, ups: x.ups, upped: upped.has(x.id), mine: x.tok === tokHash })),
        closedAt: c.called || c.deadline,
      };
    }
    return out;
  }

  og(c, now) {
    if (!c) return { status: 404, title: 'Case not found · Jurybox', desc: 'This case was closed or deleted. Start your own: let your friends decide who is right.' };
    const st = status(c, now);
    const n = this.sql.exec('SELECT COUNT(*) AS n FROM votes').one().n;
    if (st === 'pending') {
      return { status: 200, title: `${c.a_label} is taking you to court: “${c.q}”`, desc: 'Add your side in 30 seconds, then your friends decide who’s right. No app, no sign-up.' };
    }
    if (st === 'open') {
      const who = c.mode === 'debate' ? `“${c.a_label}” vs “${c.b_label}”` : (c.blind ? 'Two sides, names hidden' : `${c.a_label} vs ${c.b_label}`);
      return { status: 200, title: `You’re on the jury: “${c.q}”`, desc: `${who} · ${n} ${n === 1 ? 'juror has' : 'jurors have'} voted · verdict in ${timeLeft(c.deadline - now)}. Votes stay secret until then.` };
    }
    const t = tally(this.votes());
    const v = verdict(t);
    return { status: 200, title: `The jury has ruled: ${headline(c, v, t)}`, desc: `“${c.q}” · ${v.stamp.toLowerCase()} · ${t.total} ${t.total === 1 ? 'juror' : 'jurors'}. See the verdict and the best ruling.` };
  }

  rateRead(ip) {
    const minute = Math.floor(Date.now() / 60000);
    const key = `${ip}:${minute}`;
    const n = (this.reads.get(key) || 0) + 1;
    if (this.reads.size > 500) this.reads.clear();
    this.reads.set(key, n);
    return n <= 120;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const action = url.pathname.split('/').filter(Boolean)[0] || '';
    const now = Date.now();
    const ip = request.headers.get('x-ip') || '';
    const tok = request.headers.get('x-token');
    const tokHash = validToken(tok) ? await sha(tok) : null;
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};

    if (action === 'create') {
      if (this.exists()) return fail('Try again.', 409);
      if (!tokHash) return fail('Your browser blocked storage; enable it and try again.');
      const r = validateCase(body);
      if (!r.ok) return fail(r.error);
      const v = r.value;
      for (const q of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) this.sql.exec(q);
      const debate = v.mode === 'debate';
      const invite = debate ? null : randomId(20, 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789');
      this.sql.exec(`INSERT INTO case_row (k, id, mode, q, a_label, a_text, a_tok, b_label, b_text, invite, blind, hours, created, opened, deadline)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        body.id, v.mode, v.q, v.a.label, v.a.text, tokHash, debate ? v.b.label : null, debate ? v.b.text : null,
        invite, v.blind ? 1 : 0, v.hours, now, debate ? now : null, debate ? now + v.hours * 3600e3 : null);
      await this.ctx.storage.setAlarm(now + KEEP_DAYS * 86400e3);
      return json({ id: body.id, invite });
    }

    const c = this.row();
    if (action === 'og') return json(this.og(c, now));
    if (!c) return fail('This case was closed or deleted.', 404);
    const inviteOk = typeof request.headers.get('x-invite') === 'string' && request.headers.get('x-invite') === c.invite;
    const role = this.role(c, tokHash, inviteOk);
    const st = status(c, now);

    if (request.method === 'GET' && !action) {
      if (!this.rateRead(ip)) return fail('Too many requests, slow down a little.', 429);
      return json(this.view(c, role, tokHash, now));
    }
    if (!tokHash) return fail('Your browser blocked storage; enable it and try again.');
    const manager = role === 'a' || role === 'b' || role === 'clerk';

    switch (action) {
      case 'accept': {
        if (st !== 'pending') return fail('The other side has already answered.', 409);
        if (!inviteOk) return fail('This invite link is not valid.', 403);
        if (tokHash === c.a_tok) return fail('You opened your own invite. Send it to the other person.', 409);
        const r = validateSide(body, c.a_label);
        if (!r.ok) return fail(r.error);
        this.sql.exec('UPDATE case_row SET b_label = ?, b_text = ?, b_tok = ?, opened = ?, deadline = ? WHERE k = 1',
          r.value.label, r.value.text, tokHash, now, now + c.hours * 3600e3);
        break;
      }
      case 'decline': {
        if (st !== 'pending' || !inviteOk) return fail('This invite link is not valid.', 403);
        await this.wipe();
        return json({ deleted: true });
      }
      case 'vote': {
        if (st !== 'open') return fail(st === 'ruled' ? 'The jury has already ruled.' : 'The case is not open yet.', 409);
        if (role === 'a' || role === 'b') return fail('You are on trial, so you can’t be on the jury.', 403);
        const r = validateVote(body);
        if (!r.ok) return fail(r.error);
        const existing = this.sql.exec('SELECT id FROM votes WHERE tok = ?', tokHash).toArray()[0];
        const clash = this.sql.exec('SELECT 1 FROM votes WHERE lower(name) = lower(?) AND tok != ?', r.value.name, tokHash).toArray().length;
        if (clash) return fail('Another juror already uses that nickname.', 409);
        const lower = r.value.name.toLowerCase();
        if (c.mode === 'dispute' && (lower === c.a_label.toLowerCase() || lower === c.b_label.toLowerCase())) {
          return fail('That is one of the names on trial. Pick another nickname.', 409);
        }
        if (existing) {
          this.sql.exec('UPDATE votes SET name = ?, choice = ?, ruling = ?, updated = ? WHERE id = ?',
            r.value.name, r.value.choice, r.value.ruling, now, existing.id);
        } else {
          if (this.sql.exec('SELECT COUNT(*) AS n FROM votes').one().n >= MAX_JURORS) return fail('This jury is full.', 409);
          this.sql.exec('INSERT INTO votes (tok, name, choice, ruling, created, updated) VALUES (?, ?, ?, ?, ?, ?)',
            tokHash, r.value.name, r.value.choice, r.value.ruling, now, now);
        }
        break;
      }
      case 'call': {
        if (!manager) return fail('Only the people on trial can call the verdict early.', 403);
        if (st !== 'open') return fail('The jury is not sitting.', 409);
        const n = this.sql.exec('SELECT COUNT(*) AS n FROM votes').one().n;
        if (n < MIN_VOTES_TO_CALL) return fail(`Wait for at least ${MIN_VOTES_TO_CALL} jurors.`, 409);
        this.sql.exec('UPDATE case_row SET called = ? WHERE k = 1', now);
        break;
      }
      case 'reopen': {
        if (!manager) return fail('Only the people on trial can reopen the case.', 403);
        const n = this.sql.exec('SELECT COUNT(*) AS n FROM votes').one().n;
        if (st !== 'ruled' || n > 0) return fail('Only a case nobody voted on can be reopened.', 409);
        this.sql.exec('UPDATE case_row SET called = NULL, deadline = ? WHERE k = 1', now + 2 * 3600e3);
        break;
      }
      case 'up': {
        if (st !== 'ruled') return fail('You can upvote rulings once the verdict is out.', 409);
        const id = Number(body.id);
        const v = this.sql.exec('SELECT id, tok FROM votes WHERE id = ? AND ruling != ""', id).toArray()[0];
        if (!v) return fail('That ruling is gone.', 404);
        if (v.tok === tokHash) return fail('You can’t upvote your own ruling.', 403);
        const had = this.sql.exec('SELECT 1 FROM ups WHERE vote_id = ? AND tok = ?', id, tokHash).toArray().length;
        if (had) this.sql.exec('DELETE FROM ups WHERE vote_id = ? AND tok = ?', id, tokHash);
        else this.sql.exec('INSERT INTO ups (vote_id, tok) VALUES (?, ?)', id, tokHash);
        break;
      }
      case 'delete': {
        if (!manager) return fail('Only the people on trial can delete this case.', 403);
        await this.wipe();
        return json({ deleted: true });
      }
      default:
        return fail('Not found.', 404);
    }
    const fresh = this.row();
    return json(this.view(fresh, this.role(fresh, tokHash, inviteOk), tokHash, Date.now()));
  }
}

// Fixed-window per-IP counters: one Limiter object per IP address.
export class Limiter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS hits (k TEXT, hour INTEGER, n INTEGER, PRIMARY KEY (k, hour))');
  }
  async fetch(request) {
    const url = new URL(request.url);
    const k = url.searchParams.get('k');
    const max = Number(url.searchParams.get('max'));
    const hour = Math.floor(Date.now() / 3600e3);
    this.sql.exec('DELETE FROM hits WHERE hour < ?', hour);
    this.sql.exec('INSERT INTO hits (k, hour, n) VALUES (?, ?, 1) ON CONFLICT (k, hour) DO UPDATE SET n = n + 1', k, hour);
    const n = this.sql.exec('SELECT n FROM hits WHERE k = ? AND hour = ?', k, hour).one().n;
    if (n === 1) await this.ctx.storage.setAlarm(Date.now() + 2 * 3600e3);
    return json({ ok: n <= max });
  }
  async alarm() { await this.ctx.storage.deleteAll(); }
}

const LIMITS = { create: 20, accept: 30, vote: 120, write: 300 };

async function allowed(env, ip, kind) {
  try {
    const stub = env.LIMITER.get(env.LIMITER.idFromName(ip || 'unknown'));
    const r = await (await stub.fetch(`https://limiter/?k=${kind}&max=${LIMITS[kind]}`)).json();
    return r.ok;
  } catch (e) {
    console.error(e);
    return true;
  }
}

const caseStub = (env, id) => env.CASE.get(env.CASE.idFromName(id));
const ID = /^[a-z2-9]{8}$/;

async function api(request, env, url) {
  const ip = request.headers.get('cf-connecting-ip') || '';
  const parts = url.pathname.split('/').filter(Boolean); // api, c, id?, action?
  if (parts[1] !== 'c') return fail('Not found.', 404);
  const headers = new Headers({ 'x-ip': ip });
  for (const h of ['x-token', 'x-invite']) if (request.headers.get(h)) headers.set(h, request.headers.get(h));

  if (parts.length === 2 && request.method === 'POST') {
    if (!(await allowed(env, ip, 'create'))) return fail('You’ve opened a lot of cases this hour. Try again later.', 429);
    const body = await request.json().catch(() => ({}));
    const id = randomId(8);
    headers.set('content-type', 'application/json');
    return caseStub(env, id).fetch(new Request(`https://case/create`, { method: 'POST', headers, body: JSON.stringify({ ...body, id }) }));
  }
  const id = parts[2];
  if (!ID.test(id || '')) return fail('This case was closed or deleted.', 404);
  const action = parts[3] || '';
  if (request.method === 'GET' && !action) return caseStub(env, id).fetch(new Request('https://case/', { headers }));
  if (request.method !== 'POST' || !action) return fail('Not found.', 404);
  const kind = action === 'vote' ? 'vote' : action === 'accept' ? 'accept' : 'write';
  if (!(await allowed(env, ip, kind))) return fail('Too many requests this hour. Try again later.', 429);
  headers.set('content-type', 'application/json');
  return caseStub(env, id).fetch(new Request(`https://case/${action}`, { method: 'POST', headers, body: await request.text() }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try { return await api(request, env, url); } catch (e) { console.error(e); return fail('Something went wrong. Try again.', 500); }
    }
    const m = url.pathname.match(/^\/c\/([^/]*)\/?$/);
    if (m && (request.method === 'GET' || request.method === 'HEAD')) {
      let meta = { status: 404, title: 'Case not found · Jurybox', desc: 'This case was closed or deleted.' };
      if (ID.test(m[1])) {
        try { meta = await (await caseStub(env, m[1]).fetch(new Request('https://case/og'))).json(); } catch (e) { console.error(e); }
      }
      const page = await env.ASSETS.fetch(new Request(`${url.origin}/case`));
      const head = `<title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.desc)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Jurybox">
  <meta property="og:title" content="${esc(meta.title)}">
  <meta property="og:description" content="${esc(meta.desc)}">
  <meta property="og:image" content="${url.origin}/og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${esc(url.origin + url.pathname)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="robots" content="noindex">`;
      const html = (await page.text()).replace('<!--META-->', head);
      const headers = new Headers(page.headers);
      headers.set('content-type', 'text/html; charset=utf-8');
      headers.set('cache-control', 'no-store');
      return new Response(html, { status: meta.status, headers });
    }
    return env.ASSETS.fetch(request);
  },
};
