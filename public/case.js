import { $, api, esc, toast, shareLink, recall, remember, GAVEL, counter } from '/common.js';
import { shareCard } from '/card.js';
import { STARTERS } from '/starters.js';

$('#logo').innerHTML = GAVEL;
const app = $('#app');
const id = location.pathname.split('/').filter(Boolean)[1] || '';

// The opponent's invite token arrives in the URL fragment (never sent to the server in a request URL).
const hash = new URLSearchParams(location.hash.slice(1));
if (hash.get('o')) { sessionStorage.setItem(`jb.o.${id}`, hash.get('o')); history.replaceState(null, '', location.pathname); }
const invite = () => sessionStorage.getItem(`jb.o.${id}`) || '';

let s = null;          // last case state from the server
let key = '';          // what the page currently shows; a change means a full re-render
let editing = false;   // juror chose "Change my vote"
let draft = null;      // juror's pick before sealing
let timer = null;
let revealed = false; // play the gavel and stamp animation once per page load

const caseUrl = () => `${location.origin}/c/${id}`;
const sideName = (k) => (s[k].label ?? (k === 'a' ? 'Orange' : 'Blue'));
const sideTag = (k) => (k === 'a' ? 'Orange' : 'Blue');
const clock = (ms) => {
  if (ms <= 0) return 'any moment';
  const m = Math.ceil(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
};
const at = (ts) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const offset = () => (s ? s.now - Date.now() : 0);
const left = () => s.deadline - (Date.now() + offset());

function sideCard(k, { reveal = false } = {}) {
  const side = s[k];
  if (!side) return `<div class="side wait"><div class="who">Blue side</div><div class="arg">Waiting for the other side to write their case…</div></div>`;
  const name = side.label;
  let who;
  if (s.mode === 'debate') who = esc(name);
  else if (name == null) who = `${sideTag(k)} side`;
  else who = reveal && s.blind ? `${sideTag(k)} side was ${esc(name)}` : esc(name);
  const text = side.text == null ? '<span class="muted">Their side is shown to the person they invited.</span>' : esc(side.text);
  return `<div class="side ${k}"><div class="who">${who}</div><div class="arg">${text}</div></div>`;
}

function liveLine() {
  const n = s.count;
  const votes = `${n} ${n === 1 ? 'juror has' : 'jurors have'} voted`;
  return `<span class="dot"></span><span>${votes}</span><span class="muted">·</span><span>verdict in ${clock(left())}</span>`;
}
function jurorList() {
  return s.jurors.length ? s.jurors.map((n) => `<li>${esc(n)}</li>`).join('') : '';
}

function juryShareText() {
  return s.mode === 'debate'
    ? `Settle this for us: “${s.q}”. Vote in secret on Jurybox, verdict in ${clock(left())}.`
    : `You’re on the jury: “${s.q}”. Read both sides and vote in secret, verdict in ${clock(left())}.`;
}

function manageButtons() {
  if (!s.canManage) return '';
  const call = s.status === 'open'
    ? (s.canCall ? '<button class="btn ghost small" id="call">Call the verdict now</button>'
      : `<span class="muted small">You can call the verdict early once ${s.minToCall} jurors have voted.</span>`)
    : '';
  return `<div class="actions">${call}<button class="btn danger small" id="del">Delete case</button></div>`;
}

function renderPending() {
  if (s.role === 'a') {
    const link = `${caseUrl()}#o=${s.invite}`;
    return `
      <div class="case-head"><div class="docket">Case ${esc(id.toUpperCase())} · waiting for the other side</div>
      <div class="case-q">“${esc(s.q)}”</div></div>
      <div class="sides">${sideCard('a')}<div class="vs">vs</div>${sideCard('b')}</div>
      <div class="panel">
        <h3>Send this to the person you’re arguing with</h3>
        <p class="muted small">They write their side. Then the jury opens for ${s.hours} ${s.hours === 1 ? 'hour' : 'hours'} and you both send the case to the group chat.</p>
        <button class="btn block" id="share-invite" style="margin-top:4px">Send the invite</button>
        <div class="share-row"><input type="text" readonly value="${esc(link)}" id="invite-link" aria-label="Invite link"><button class="btn ghost small" id="copy-invite">Copy</button></div>
      </div>
      <p class="center muted small" style="margin-top:14px">This page updates by itself when they answer.</p>
      ${manageButtons()}`;
  }
  if (s.role === 'invitee') {
    return `
      <div class="case-head"><div class="docket">Case ${esc(id.toUpperCase())} · you’ve been summoned</div>
      <h1 style="font-size:1.6rem;margin:6px 0">${esc(s.a.label)} is taking you to court</h1>
      <div class="case-q">“${esc(s.q)}”</div></div>
      <div class="sides">${sideCard('a')}</div>
      <form class="panel" id="accept" novalidate>
        <h3>Your side</h3>
        <label for="b-name">Your name</label>
        <input type="text" id="b-name" maxlength="24" autocomplete="given-name" value="${esc(recall('name'))}">
        <label for="b-text">Your side of the story <span class="count" id="b-text-c"></span></label>
        <textarea id="b-text" maxlength="160" placeholder="Two lines. Make them count."></textarea>
        <button class="btn block" type="submit">Accept and open the jury</button>
        <p class="err" id="err" role="alert"></p>
        <p class="muted small center" style="margin:6px 0 0">${s.blind ? 'Your names stay hidden from the jury until the verdict.' : 'The jury will see both names.'} The jury has ${s.hours} ${s.hours === 1 ? 'hour' : 'hours'}.</p>
      </form>
      <div class="actions"><button class="linkbtn" id="decline">Decline and delete this case</button></div>`;
  }
  return `
    <div class="case-head"><div class="docket">Case ${esc(id.toUpperCase())}</div>
    <div class="case-q">“${esc(s.q)}”</div></div>
    <div class="panel center"><h3>The jury isn’t sitting yet</h3>
    <p class="muted">${esc(s.a.label)} is waiting for the other side to write their case. Come back to this link soon.</p></div>
    ${ctaBlock()}`;
}

function voteForm() {
  const me = s.me;
  const pick = draft ?? me?.choice ?? null;
  const btn = (k, label) => `<button type="button" class="choice ${k}" data-c="${k}" aria-pressed="${pick === k}">${label}</button>`;
  const bothWrong = s.mode === 'debate' ? 'Both sides are wrong' : 'You’re both wrong';
  return `
    <form class="panel" id="vote" novalidate>
      <h3 style="text-align:center">Your verdict</h3>
      <div class="choices">${btn('a', `${esc(sideName('a'))}`)}${btn('b', `${esc(sideName('b'))}`)}${btn('x', bothWrong)}</div>
      <label for="ruling">Your one-line ruling <span class="hint">(optional, revealed with the verdict)</span> <span class="count" id="ruling-c"></span></label>
      <input type="text" id="ruling" maxlength="90" placeholder="Nobody soaks a pan for three days." value="${esc(me?.ruling || '')}">
      <label for="name">Your nickname</label>
      <input type="text" id="name" maxlength="20" autocomplete="nickname" value="${esc(me?.name || recall('juror') || recall('name'))}">
      <button class="btn block" type="submit">${me ? 'Update my sealed vote' : 'Seal my vote'}</button>
      <p class="err" id="err" role="alert"></p>
      <p class="muted small center" style="margin:6px 0 0">Nobody sees how you voted until the verdict.</p>
    </form>`;
}

function renderOpen() {
  const party = s.role === 'a' || s.role === 'b';
  let main;
  if (party) {
    main = `<div class="panel">
      <h3>Send the case to the jury</h3>
      <p class="muted small">Post it in the group chat. ${s.blind ? 'Jurors see Orange and Blue, not your names, until the verdict.' : ''} You can’t vote on your own case.</p>
      <button class="btn block" id="share-jury" style="margin-top:4px">Send to the jury</button>
    </div>`;
  } else if (s.me && !editing) {
    const label = s.me.choice === 'x' ? 'both wrong' : sideName(s.me.choice);
    main = `<div class="panel sealed"><div class="seal">🔒</div><h3>Your vote is sealed</h3>
      <p class="muted">You voted <strong>${esc(label)}</strong>. The verdict comes at ${at(s.deadline)}${s.canManage ? '' : ', or sooner if the sides call it'}.</p>
      <div class="actions" style="margin-top:6px"><button class="btn small" id="share-jury">Get more jurors</button><button class="btn ghost small" id="edit">Change my vote</button></div></div>`;
  } else {
    main = voteForm();
  }
  return `
    <div class="case-head"><div class="docket">Case ${esc(id.toUpperCase())} · the jury is out</div>
    <div class="case-q">“${esc(s.q)}”</div>
    <div class="status" id="live">${liveLine()}</div>
    <ul class="jurors" id="jurors">${jurorList()}</ul></div>
    <div class="sides">${sideCard('a')}<div class="vs">vs</div>${sideCard('b')}</div>
    ${main}
    ${manageButtons()}`;
}

function renderRuled() {
  const r = s.result;
  const t = r.tally;
  if (r.outcome === 'dismissed') {
    return `
      <div class="case-head"><div class="docket">Case ${esc(id.toUpperCase())}</div><div class="case-q">“${esc(s.q)}”</div></div>
      <div class="panel verdict"><div class="gavel">${GAVEL}</div><div class="head">Case dismissed</div>
      <p class="muted">No jurors voted before the deadline.</p>
      ${s.canManage ? '<button class="btn" id="reopen">Reopen for 2 hours</button>' : ''}</div>
      ${manageButtons()}${ctaBlock()}`;
  }
  const pct = (k) => (t.total ? (t[k] / t.total) * 100 : 0);
  const quote = r.best ? `<div class="quote">“${esc(r.best.ruling)}”</div><div class="quote-by">juror ${esc(r.best.name)}${r.best.ups ? ` · ${r.best.ups} 👍` : ''}</div>` : '';
  const rulings = r.votes.map((v) => {
    const tag = v.choice === 'x' ? 'Both wrong' : (s.mode === 'debate' ? s[v.choice].label : s[v.choice].label);
    const up = v.ruling ? `<button class="up" data-up="${v.id}" aria-pressed="${v.upped}" ${v.mine ? 'disabled title="Your ruling"' : ''} aria-label="Upvote ${esc(v.name)}’s ruling">👍 ${v.ups || ''}</button>` : '<span></span>';
    return `<li><span class="tag ${v.choice}">${esc(tag)}</span><div><strong>${esc(v.name)}</strong>${v.ruling ? `<div>“${esc(v.ruling)}”</div>` : ''}</div>${up}</li>`;
  }).join('');
  return `
    <div class="panel verdict${revealed ? '' : ' anim'}">
      <div class="gavel">${GAVEL}</div>
      <div class="ruled" style="margin-top:8px">THE JURY HAS RULED</div>
      <div class="docket" style="margin-top:8px;text-transform:none;letter-spacing:0;font-size:.95rem">“${esc(s.q)}”</div>
      <div class="head" id="headline">${esc(r.headline)}</div>
      <span class="stamp">${esc(r.stamp)}</span>
      <div class="split" role="img" aria-label="${t.a} for ${esc(s.a.label)}, ${t.b} for ${esc(s.b.label)}, ${t.x} both wrong">
        <span class="a" style="width:${pct('a')}%"></span><span class="b" style="width:${pct('b')}%"></span><span class="x" style="width:${pct('x')}%"></span></div>
      <div class="legend"><span class="a">${esc(s.a.label)}: ${t.a}</span>${t.x ? `<span class="x">Both wrong: ${t.x}</span>` : ''}<span class="b">${esc(s.b.label)}: ${t.b}</span></div>
      ${quote}
      <div class="actions"><button class="btn" id="share-card">Share the verdict card</button><button class="btn ghost" id="share-text">Send the verdict</button></div>
    </div>
    <div class="sides">${sideCard('a', { reveal: true })}${sideCard('b', { reveal: true })}</div>
    <div class="panel"><h3>The jury’s rulings</h3><p class="muted small" style="margin-top:-4px">Upvote the best one: it goes on the verdict card.</p><ul class="rulings" id="rulings">${rulings}</ul></div>
    ${manageButtons()}
    ${ctaBlock()}`;
}

function ctaBlock() {
  const month = new Date().getMonth();
  const pool = STARTERS.filter((x) => (month === 10 || month === 11 ? x.tag === 'holiday' : true) && x.q !== s?.q);
  const picks = [];
  const used = new Set();
  while (picks.length < 3 && used.size < pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    if (!used.has(i)) { used.add(i); picks.push(pool[i]); }
  }
  return `<div class="cta">
    <h2>Got a case of your own?</h2>
    <p style="opacity:.85">Take someone to court. It takes 30 seconds, and the group chat decides.</p>
    <a class="btn" href="/">Open a case</a>
    <p style="margin:18px 0 8px;opacity:.85;font-weight:600">Or start a classic debate:</p>
    <div class="starters">${picks.map((p) => `<a class="starter" style="text-decoration:none" href="/?q=${encodeURIComponent(p.q)}">${esc(p.q)}<small>${esc(p.a.label)} vs ${esc(p.b.label)}</small></a>`).join('')}</div>
  </div>`;
}

function render() {
  const k = `${s.status}|${s.role}|${s.me ? s.me.choice + s.me.name + s.me.ruling : ''}|${editing}|${s.canCall}|${s.status === 'ruled' ? JSON.stringify(s.result.votes.map((v) => [v.ups, v.upped])) : ''}`;
  if (k === key) {
    const live = $('#live');
    if (live) { live.innerHTML = liveLine(); $('#jurors').innerHTML = jurorList(); }
    return;
  }
  key = k;
  app.innerHTML = s.status === 'pending' ? renderPending() : s.status === 'open' ? renderOpen() : renderRuled();
  if (s.status === 'ruled') revealed = true;
  wire();
}

function wire() {
  const on = (sel, fn) => { const el = $(sel); if (el) el.addEventListener('click', fn); };
  on('#share-invite', () => shareLink({ title: 'Jurybox', text: `${s.a.label} is taking you to court: “${s.q}”. Write your side, then our friends decide.`, url: `${caseUrl()}#o=${s.invite}` }));
  on('#copy-invite', async () => { try { await navigator.clipboard.writeText($('#invite-link').value); toast('Invite link copied.'); } catch { $('#invite-link').select(); } });
  on('#share-jury', () => shareLink({ title: 'Jurybox', text: juryShareText(), url: caseUrl() }));
  on('#edit', () => { editing = true; draft = null; render(); });
  on('#share-card', async () => { const r = await shareCard(s); if (r === 'downloaded') toast('Verdict card saved.'); });
  on('#share-text', () => shareLink({ title: 'Jurybox verdict', text: `The jury has ruled: ${s.result.headline}${s.result.best ? `. “${s.result.best.ruling}” (juror ${s.result.best.name})` : ''}.`, url: caseUrl() }));
  on('#call', () => act('call', {}, 'Call the verdict now? Votes so far decide it.'));
  on('#reopen', () => act('reopen', {}));
  on('#del', async () => {
    if (!confirm('Delete this case for everyone? This can’t be undone.')) return;
    try { await api(`c/${id}/delete`, { method: 'POST', body: {} }); location.href = '/?deleted=1'; } catch (e) { toast(e.message); }
  });
  on('#decline', async () => {
    if (!confirm('Decline and delete this case?')) return;
    try { await api(`c/${id}/decline`, { method: 'POST', body: {}, invite: invite() }); location.href = '/?deleted=1'; } catch (e) { toast(e.message); }
  });

  const rulings = $('#rulings');
  if (rulings) rulings.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-up]');
    if (!b || b.disabled) return;
    b.disabled = true;
    try { s = await api(`c/${id}/up`, { method: 'POST', body: { id: Number(b.dataset.up) } }); render(); } catch (err) { toast(err.message); b.disabled = false; }
  });

  const accept = $('#accept');
  if (accept) {
    counter($('#b-text'), $('#b-text-c'));
    accept.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = accept.querySelector('button[type=submit]');
      if (!$('#b-name').value.trim()) { $('#err').textContent = 'Add your name.'; return; }
      if ($('#b-text').value.trim().length < 2) { $('#err').textContent = 'Write your side.'; return; }
      if ($('#b-name').value.trim().toLowerCase() === s.a.label.toLowerCase()) { $('#err').textContent = 'Pick a name that differs from the other side’s.'; return; }
      btn.disabled = true; $('#err').textContent = '';
      try {
        remember('name', $('#b-name').value.trim());
        s = await api(`c/${id}/accept`, { method: 'POST', body: { label: $('#b-name').value, text: $('#b-text').value }, invite: invite() });
        sessionStorage.removeItem(`jb.o.${id}`);
        render();
        window.scrollTo({ top: 0 });
      } catch (err) { $('#err').textContent = err.message; btn.disabled = false; }
    });
  }

  const vote = $('#vote');
  if (vote) {
    counter($('#ruling'), $('#ruling-c'));
    vote.addEventListener('click', (e) => {
      const c = e.target.closest('.choice');
      if (!c) return;
      draft = c.dataset.c;
      for (const b of vote.querySelectorAll('.choice')) b.setAttribute('aria-pressed', String(b === c));
    });
    vote.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = vote.querySelector('button[type=submit]');
      const choice = draft ?? s.me?.choice;
      if (!choice) { $('#err').textContent = 'Pick a side first.'; return; }
      if (!$('#name').value.trim()) { $('#err').textContent = 'Add a nickname so the court knows who voted.'; return; }
      btn.disabled = true; $('#err').textContent = '';
      try {
        remember('juror', $('#name').value.trim());
        s = await api(`c/${id}/vote`, { method: 'POST', body: { choice, name: $('#name').value, ruling: $('#ruling').value } });
        editing = false; draft = null;
        render();
        toast('Vote sealed.');
      } catch (err) { $('#err').textContent = err.message; btn.disabled = false; }
    });
  }
}

async function act(action, body, question) {
  if (question && !confirm(question)) return;
  try { s = await api(`c/${id}/${action}`, { method: 'POST', body }); render(); } catch (e) { toast(e.message); }
}

async function load() {
  try {
    s = await api(`c/${id}`, { invite: invite() });
    render();
  } catch (e) {
    if (e.status === 404) {
      app.innerHTML = `<div class="panel center" style="margin-top:20px"><h2>Case not found</h2><p class="muted">This case was closed or deleted, or the link is incomplete.</p><a class="btn" href="/">Open a new case</a></div>`;
      s = null;
      return;
    }
    if (!s) app.innerHTML = `<div class="panel center" style="margin-top:20px"><h2>Couldn’t open the case</h2><p class="muted">${esc(e.message)}</p><a class="btn" href="${esc(location.pathname)}">Try again</a></div>`;
  }
  schedule();
}

function schedule() {
  clearTimeout(timer);
  if (!s || s.status === 'ruled') { timer = setTimeout(() => { if (s && !document.hidden) load(); }, 30000); return; }
  let wait = 8000;
  if (s.status === 'open') wait = Math.min(wait, Math.max(1000, left() + 500));
  timer = setTimeout(() => { if (document.hidden) schedule(); else load(); }, wait);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && s) load(); });
setInterval(() => { const live = $('#live'); if (live && s?.status === 'open') live.innerHTML = liveLine(); }, 20000);

load();
