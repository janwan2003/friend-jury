// Pure rules for a Jurybox case: validation, status, verdict. No I/O, so it is unit-tested directly.

export const LIMITS = { q: 90, label: 24, stance: 32, text: 160, name: 20, ruling: 90 };
export const HOURS = [1, 2, 6, 24];
export const MIN_VOTES_TO_CALL = 3;
export const MAX_JURORS = 60;
export const KEEP_DAYS = 60;

// Collapse whitespace and control characters, trim, and cut to a maximum length.
export function clean(s, max) {
  if (typeof s !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const t = s.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim();
  return Array.from(t).slice(0, max).join('');
}

// Validate a new case. Returns { ok: true, value } or { ok: false, error }.
export function validateCase(body) {
  const mode = body?.mode === 'debate' ? 'debate' : 'dispute';
  const q = clean(body?.q, LIMITS.q);
  if (q.length < 3) return { ok: false, error: 'Say what the argument is about.' };
  const hours = HOURS.includes(Number(body?.hours)) ? Number(body.hours) : 2;
  const a = { label: clean(body?.a?.label, mode === 'debate' ? LIMITS.stance : LIMITS.label), text: clean(body?.a?.text, LIMITS.text) };
  if (!a.label) return { ok: false, error: mode === 'debate' ? 'Give the first side a short name.' : 'Add your name.' };
  if (a.text.length < 2) return { ok: false, error: mode === 'debate' ? 'Write the first side’s argument.' : 'Write your side.' };
  let b = null;
  if (mode === 'debate') {
    b = { label: clean(body?.b?.label, LIMITS.stance), text: clean(body?.b?.text, LIMITS.text) };
    if (!b.label) return { ok: false, error: 'Give the second side a short name.' };
    if (b.text.length < 2) return { ok: false, error: 'Write the second side’s argument.' };
    if (b.label.toLowerCase() === a.label.toLowerCase()) return { ok: false, error: 'The two sides need different names.' };
  }
  const blind = mode === 'dispute' && body?.blind !== false;
  return { ok: true, value: { mode, q, a, b, hours, blind } };
}

export function validateSide(body, otherLabel) {
  const label = clean(body?.label, LIMITS.label);
  const text = clean(body?.text, LIMITS.text);
  if (!label) return { ok: false, error: 'Add your name.' };
  if (text.length < 2) return { ok: false, error: 'Write your side.' };
  if (otherLabel && label.toLowerCase() === String(otherLabel).toLowerCase()) return { ok: false, error: 'Pick a name that differs from the other side’s.' };
  return { ok: true, value: { label, text } };
}

export function validateVote(body) {
  const choice = ['a', 'b', 'x'].includes(body?.choice) ? body.choice : null;
  if (!choice) return { ok: false, error: 'Pick a side.' };
  const name = clean(body?.name, LIMITS.name);
  if (!name) return { ok: false, error: 'Add a nickname so the court knows who voted.' };
  const ruling = clean(body?.ruling, LIMITS.ruling);
  return { ok: true, value: { choice, name, ruling } };
}

// pending: waiting for the other side (disputes only); open: jury is voting; ruled: verdict is out.
export function status(c, now) {
  if (!c.b_label) return 'pending';
  if (c.called || now >= c.deadline) return 'ruled';
  return 'open';
}

export function tally(votes) {
  const t = { a: 0, b: 0, x: 0, total: 0 };
  for (const v of votes) { t[v.choice] += 1; t.total += 1; }
  return t;
}

// The court's ruling from a tally.
// outcome: 'a' | 'b' (that side wins) | 'x' (both wrong) | 'hung' (tie at the top) | 'dismissed' (no votes)
// stamp: UNANIMOUS (3+ votes, all one way) | SPLIT DECISION (won by one vote) | HUNG JURY | MAJORITY | DISMISSED
export function verdict(t) {
  if (!t.total) return { outcome: 'dismissed', stamp: 'DISMISSED', top: 0, margin: 0 };
  const ranked = ['a', 'b', 'x'].map((k) => [k, t[k]]).sort((p, q) => q[1] - p[1]);
  const [[k1, n1], [, n2]] = ranked;
  if (n1 === n2) return { outcome: 'hung', stamp: 'HUNG JURY', top: n1, margin: 0 };
  const margin = n1 - n2;
  let stamp = 'MAJORITY';
  if (n1 === t.total && t.total >= 3) stamp = 'UNANIMOUS';
  else if (margin === 1) stamp = 'SPLIT DECISION';
  return { outcome: k1, stamp, top: n1, margin };
}

// The quote of the court: most upvoted ruling; ties go to the winning side's juror, then the earliest.
export function bestRuling(votes, outcome) {
  const withText = votes.filter((v) => v.ruling);
  if (!withText.length) return null;
  return withText.slice().sort((p, q) =>
    (q.ups || 0) - (p.ups || 0) ||
    (q.choice === outcome) - (p.choice === outcome) ||
    p.created - q.created || p.id - q.id)[0];
}

// One-line headline used on the verdict page, card and link preview.
export function headline(c, v, t) {
  const A = c.a_label, B = c.b_label;
  const score = (k) => {
    const others = ['a', 'b', 'x'].filter((o) => o !== k).map((o) => t[o]);
    return `${t[k]}–${Math.max(...others)}`;
  };
  switch (v.outcome) {
    case 'a': return c.mode === 'debate' ? `“${A}” wins ${score('a')}` : `${A} is right (${score('a')})`;
    case 'b': return c.mode === 'debate' ? `“${B}” wins ${score('b')}` : `${B} is right (${score('b')})`;
    case 'x': return c.mode === 'debate' ? `Both sides are wrong (${score('x')})` : `You’re both wrong (${score('x')})`;
    case 'hung': return `Hung jury: ${t.a}–${t.b}${t.x ? `–${t.x}` : ''}`;
    default: return 'Case dismissed: no jurors voted';
  }
}

export function timeLeft(ms) {
  if (ms <= 0) return 'now';
  const m = Math.ceil(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
