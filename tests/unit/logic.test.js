import test from 'node:test';
import assert from 'node:assert/strict';
import { clean, validateCase, validateSide, validateVote, status, tally, verdict, bestRuling, headline, timeLeft } from '../../src/logic.js';

test('clean trims, collapses whitespace, strips control chars, cuts by code points', () => {
  assert.equal(clean('  a\n\tb  ', 10), 'a b');
  assert.equal(clean('😀😀😀', 2), '😀😀');
  assert.equal(clean(42, 5), '');
});

test('validateCase: dispute defaults and errors', () => {
  const r = validateCase({ q: 'Pan soaking', a: { label: 'Maya', text: 'Three days is storage' } });
  assert.ok(r.ok);
  assert.equal(r.value.mode, 'dispute');
  assert.equal(r.value.hours, 2);
  assert.equal(r.value.blind, true);
  assert.equal(r.value.b, null);
  assert.equal(validateCase({ q: 'x', a: { label: 'M', text: 'yy' } }).ok, false);
  assert.equal(validateCase({ q: 'Pan', a: { label: '', text: 'yy' } }).ok, false);
  assert.equal(validateCase({ q: 'Pan', hours: 99, a: { label: 'M', text: 'yy' } }).value.hours, 2);
  assert.equal(validateCase({ q: 'Pan', blind: false, a: { label: 'M', text: 'yy' } }).value.blind, false);
});

test('validateCase: debate needs two distinct sides and is never blind', () => {
  const base = { mode: 'debate', q: 'Hot dog sandwich?', a: { label: 'Yes', text: 'Meat in bread' }, b: { label: 'No', text: 'Own thing' } };
  const r = validateCase({ ...base, blind: true });
  assert.ok(r.ok);
  assert.equal(r.value.blind, false);
  assert.equal(validateCase({ ...base, b: { label: 'yes', text: 'dup' } }).ok, false);
  assert.equal(validateCase({ ...base, b: null }).ok, false);
});

test('validateSide rejects the other side name; validateVote needs choice and nickname', () => {
  assert.equal(validateSide({ label: 'maya', text: 'mine' }, 'Maya').ok, false);
  assert.ok(validateSide({ label: 'Tom', text: 'mine' }, 'Maya').ok);
  assert.equal(validateVote({ choice: 'z', name: 'A' }).ok, false);
  assert.equal(validateVote({ choice: 'a', name: ' ' }).ok, false);
  assert.deepEqual(validateVote({ choice: 'x', name: 'Ann', ruling: '  ok ' }).value, { choice: 'x', name: 'Ann', ruling: 'ok' });
});

test('status: pending until side B, open until deadline or call', () => {
  assert.equal(status({ b_label: null }, 0), 'pending');
  assert.equal(status({ b_label: 'T', deadline: 100 }, 50), 'open');
  assert.equal(status({ b_label: 'T', deadline: 100 }, 100), 'ruled');
  assert.equal(status({ b_label: 'T', deadline: 100, called: 60 }, 70), 'ruled');
});

const V = (s) => s.split('').map((choice, i) => ({ id: i + 1, choice, created: i }));

test('verdict outcomes and stamps', () => {
  assert.deepEqual(verdict(tally([])).outcome, 'dismissed');
  assert.equal(verdict(tally(V('aaa'))).stamp, 'UNANIMOUS');
  assert.equal(verdict(tally(V('aa'))).stamp, 'MAJORITY');      // 2 votes is not "unanimous"
  assert.equal(verdict(tally(V('aab'))).stamp, 'SPLIT DECISION');
  assert.equal(verdict(tally(V('aaaab'))).stamp, 'MAJORITY');
  assert.equal(verdict(tally(V('ab'))).outcome, 'hung');
  assert.equal(verdict(tally(V('abx'))).outcome, 'hung');
  assert.equal(verdict(tally(V('xxa'))).outcome, 'x');
  assert.equal(verdict(tally(V('bbbaa'))).outcome, 'b');
});

test('bestRuling: upvotes, then winning side, then earliest', () => {
  const votes = [
    { id: 1, choice: 'b', ruling: 'early loser', created: 1, ups: 0 },
    { id: 2, choice: 'a', ruling: 'winner side', created: 2, ups: 0 },
    { id: 3, choice: 'a', ruling: '', created: 3, ups: 5 },
  ];
  assert.equal(bestRuling(votes, 'a').id, 2);
  votes[0].ups = 1;
  assert.equal(bestRuling(votes, 'a').id, 1);
  assert.equal(bestRuling([{ id: 1, choice: 'a', ruling: '' }], 'a'), null);
});

test('headline wording', () => {
  const c = { mode: 'dispute', a_label: 'Maya', b_label: 'Tom' };
  const t = tally(V('aaaaaaabb'));
  assert.equal(headline(c, verdict(t), t), 'Maya is right (7–2)');
  const t2 = tally(V('xxa'));
  assert.equal(headline(c, verdict(t2), t2), 'You’re both wrong (2–1)');
  const d = { mode: 'debate', a_label: 'Yes', b_label: 'No' };
  const t3 = tally(V('bba'));
  assert.equal(headline(d, verdict(t3), t3), '“No” wins 2–1');
  const t4 = tally(V('ab'));
  assert.equal(headline(c, verdict(t4), t4), 'Hung jury: 1–1');
});

test('timeLeft', () => {
  assert.equal(timeLeft(0), 'now');
  assert.equal(timeLeft(59 * 60000), '59 min');
  assert.equal(timeLeft(120 * 60000), '2 h');
  assert.equal(timeLeft(150 * 60000), '2 h 30 min');
});
