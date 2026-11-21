// End-to-end test in real Chromium: dispute (create → invite → accept → 3 jurors → call → verdict → upvote → card),
// debate from a classic, decline, delete, link previews, and console errors.
// Usage: BASE=http://127.0.0.1:8953 node tests/e2e/run.mjs   (defaults to the local dev server)
import { launch } from '../../tools/browser.mjs';
import { mkdirSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const BASE = process.env.BASE || 'http://127.0.0.1:8953';
const SHOTS = new URL('./shots/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });
const browser = await launch();
const errors = [];
const expected = [];
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESK = { viewport: { width: 1280, height: 860 } };

async function person(name, opts) {
  const ctx = await browser.newContext({ ...opts, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // Chromium logs every non-2xx fetch; the deliberate validation checks below cause 403/409 responses.
    if (/Failed to load resource: .* (403|409) /.test(m.text())) { expected.push(`${name}: ${m.text()}`); return; }
    errors.push(`${name}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  page.on('dialog', (d) => d.accept());
  return { ctx, page };
}
const step = (s) => console.log(`- ${s}`);
const shot = (page, n) => page.screenshot({ path: `${SHOTS}${n}.png`, fullPage: true });
async function og(path) {
  const html = await (await fetch(`${BASE}${path}`)).text();
  return {
    title: html.match(/property="og:title" content="([^"]*)"/)?.[1] ?? '',
    desc: html.match(/property="og:description" content="([^"]*)"/)?.[1] ?? '',
  };
}

const maya = await person('Maya', DESK);
const tom = await person('Tom', PHONE);
const ann = await person('Ann', PHONE);
const ben = await person('Ben', PHONE);
const cat = await person('Cat', PHONE);

// 1. Maya opens a case
await maya.page.goto(BASE);
await shot(maya.page, '01-landing-desktop');
await maya.page.click('#f-dispute button[type=submit]');
await maya.page.waitForSelector('#d-err:has-text("Say what the argument")');
step('empty form shows a validation message');
await maya.page.fill('#d-q', 'Does soaking a pan for 3 days count as <b>washing</b> it?');
await maya.page.fill('#d-name', 'Maya');
await maya.page.fill('#d-text', 'Three days is not soaking, that’s storage.');
await maya.page.selectOption('#d-hours', '1');
await maya.page.click('#f-dispute button[type=submit]');
await maya.page.waitForURL(/\/c\/[a-z2-9]{8}$/);
const id = maya.page.url().split('/').pop();
await maya.page.waitForSelector('#invite-link');
const inviteLink = await maya.page.inputValue('#invite-link');
assert.match(inviteLink, new RegExp(`/c/${id}#o=[A-Za-z0-9]{20}$`));
assert.ok((await maya.page.textContent('.case-q')).includes('<b>washing</b>'), 'HTML shown as text');
step(`case ${id} created; invite link shown; HTML in the question shown as text`);
let p = await og(`/c/${id}`);
assert.match(p.title, /^Maya is taking you to court/);
step(`preview while pending: "${p.title}"`);

// A juror who opens the plain link before Tom answered sees a waiting page, not Maya's argument
await ann.page.goto(`${BASE}/c/${id}`);
await ann.page.waitForSelector('text=The jury isn’t sitting yet');
assert.ok(!(await ann.page.content()).includes('storage.'), 'side A text hidden from non-invitees while pending');
step('non-invitee sees the waiting page without side A’s text');

// 2. Tom accepts the invite on his phone
await tom.page.goto(inviteLink);
await tom.page.waitForSelector('text=Maya is taking you to court');
assert.ok(!tom.page.url().includes('#o='), 'invite token removed from the address bar');
await shot(tom.page, '02-invite-phone');
await tom.page.fill('#b-name', 'maya');
await tom.page.fill('#b-text', 'It was soaking. Soaking takes as long as it takes.');
await tom.page.click('#accept button[type=submit]');
await tom.page.waitForSelector('#err:has-text("differs")');
await tom.page.fill('#b-name', 'Tom');
await tom.page.click('#accept button[type=submit]');
await tom.page.waitForSelector('#share-jury');
step('Tom accepted (same-name check works); the jury is open');
await maya.page.waitForSelector('#share-jury', { timeout: 15000 });
step('Maya’s page switched to the open jury by itself');
p = await og(`/c/${id}`);
assert.match(p.title, /^You’re on the jury/);
assert.match(p.desc, /Two sides, names hidden · 0 jurors have voted · verdict in (59 min|1 h)/);
step(`preview while open: "${p.desc}"`);

// 3. Jurors vote; names are hidden
async function vote(who, nick, choice, ruling, expectErr, cid = id) {
  await who.page.goto(`${BASE}/c/${cid}`);
  await who.page.waitForSelector('#vote');
  if (choice) await who.page.click(`.choice.${choice}`);
  if (ruling) await who.page.fill('#ruling', ruling);
  await who.page.fill('#name', nick);
  await who.page.click('#vote button[type=submit]');
  if (expectErr) { await who.page.waitForSelector(`#err:has-text("${expectErr}")`); return; }
  await who.page.waitForSelector('text=Your vote is sealed');
}
await ann.page.goto(`${BASE}/c/${id}`);
await ann.page.waitForSelector('#vote');
const annText = await ann.page.textContent('#app');
assert.ok(annText.includes('Orange side') && annText.includes('Blue side'), 'blind labels');
assert.ok(!/\bMaya\b|\bTom\b/.test(annText), 'names hidden from jurors before the verdict');
await shot(ann.page, '03-vote-phone');
step('juror sees Orange/Blue, no names');
await vote(ann, 'Ann', null, null, 'Pick a side first');
await vote(ann, 'Maya', 'a', null, 'names on trial');
await vote(ann, 'Ann', 'a', 'Nobody soaks a pan for three days. That’s storage.');
await shot(ann.page, '04-sealed-phone');
await vote(ben, 'Ben', 'a', 'Pans have rights too.');
await vote(cat, 'ann', 'b', null, 'already uses that nickname');
await vote(cat, 'Cat', 'x', 'Just buy paper plates.');
step('Ann, Ben, Cat voted (empty choice, name-on-trial and duplicate nickname rejected)');
// Cat changes her mind
await cat.page.click('#edit');
await cat.page.click('.choice.b');
await cat.page.click('#vote button[type=submit]');
await cat.page.waitForSelector('text=You voted Blue');
step('Cat changed her vote to Blue');

// Nobody can see the votes yet, and the parties can't vote
const annState = await ann.page.evaluate(async (cid) => (await fetch(`/api/c/${cid}`, { headers: { 'x-token': localStorage.getItem('jb.token') } })).json(), id);
assert.equal(annState.result, undefined);
assert.ok(!JSON.stringify(annState).includes('Pans have rights'), 'no rulings before the verdict');
assert.ok(!JSON.stringify(annState).includes('"choice":"b"'), 'no other choices before the verdict');
assert.equal(annState.a.label, null);
const tomVote = await tom.page.evaluate(async (cid) => (await fetch(`/api/c/${cid}/vote`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-token': localStorage.getItem('jb.token') }, body: JSON.stringify({ choice: 'b', name: 'Sneaky' }) })).status, id);
assert.equal(tomVote, 403);
step('API hides votes, rulings and names before the verdict; a party cannot vote (403)');
p = await og(`/c/${id}`);
assert.match(p.desc, /3 jurors have voted/);

// 4. Maya calls the verdict
await maya.page.reload();
await maya.page.waitForSelector('#call');
await maya.page.click('#call');
await maya.page.waitForSelector('#headline');
const head = await maya.page.textContent('#headline');
assert.equal(head, 'Maya is right (2–1)');
assert.equal(await maya.page.textContent('.stamp'), 'SPLIT DECISION');
assert.ok((await maya.page.textContent('#app')).includes('Orange side was Maya'));
step(`verdict: "${head}" · SPLIT DECISION · names revealed`);
p = await og(`/c/${id}`);
assert.equal(p.title, 'The jury has ruled: Maya is right (2–1)');
step(`preview after verdict: "${p.title}"`);

// 5. Upvotes pick the quote of the court
await ben.page.reload();
await ben.page.waitForSelector('#rulings');
assert.ok((await ben.page.textContent('.quote')).includes('Nobody soaks'), 'earliest winning-side ruling is the default quote');
const annRow = ben.page.locator('#rulings li', { hasText: 'Ann' });
await annRow.locator('.up').click();
await ben.page.waitForSelector('#rulings li:has-text("Ann") .up[aria-pressed="true"]');
await cat.page.reload();
await cat.page.waitForSelector('#rulings');
await cat.page.locator('#rulings li', { hasText: 'Ben' }).locator('.up').click();
await cat.page.waitForSelector('#rulings li:has-text("Ben") .up[aria-pressed="true"]');
await ann.page.reload();
await ann.page.waitForSelector('#rulings');
assert.equal(await ann.page.locator('#rulings li:has-text("Ann") .up').isDisabled(), true, 'cannot upvote own ruling');
await ann.page.locator('#rulings li', { hasText: 'Ben' }).locator('.up').click();
await ann.page.waitForFunction(() => document.querySelector('.quote')?.textContent.includes('Pans have rights'));
step('upvotes work, own ruling cannot be upvoted, the top-voted ruling becomes the quote');
await shot(ann.page, '05-verdict-phone');

// 6. Verdict card download on desktop
await maya.page.reload();
await maya.page.waitForSelector('#share-card');
await shot(maya.page, '06-verdict-desktop');
const [dl] = await Promise.all([maya.page.waitForEvent('download'), maya.page.click('#share-card')]);
const file = `${SHOTS}07-card.png`;
await dl.saveAs(file);
const png = readFileSync(file);
assert.equal(png.readUInt32BE(16), 1080);
assert.equal(png.readUInt32BE(20), 1350);
step('verdict card downloaded: 1080x1350 PNG');

// 7. Debate from a classic: opens straight away, the creator can vote
await ann.page.goto(BASE);
await ann.page.locator('#starters .starter').first().click();
await ann.page.waitForSelector('#f-debate:not([hidden])');
const q = await ann.page.inputValue('#b-q');
assert.ok(q.length > 5);
await ann.page.click('#f-debate button[type=submit]');
await ann.page.waitForSelector('#vote');
const did = ann.page.url().split('/').pop();
await vote(ann, 'Ann', 'b', 'Obviously.', null, did);
await vote(ben, 'Ben', 'b', null, null, did);
await vote(cat, 'Cat', 'a', null, null, did);
await ann.page.reload();
await ann.page.click('#call');
await ann.page.waitForSelector('#headline');
assert.match(await ann.page.textContent('#headline'), /” wins 2–1$/);
step(`debate "${q}" ruled: ${await ann.page.textContent('#headline')}`);
await ann.page.click('#del');
await ann.page.waitForURL(/deleted=1/);
assert.equal((await fetch(`${BASE}/api/c/${did}`)).status, 404);
assert.equal((await fetch(`${BASE}/c/${did}`)).status, 404);
step('creator deleted the debate: API and page 404');

// 8. Decline deletes the case
await maya.page.goto(BASE);
await maya.page.fill('#d-q', 'Who was right about the restaurant?');
await maya.page.fill('#d-text', 'The reviews said 4.8. The reviews were right.');
await maya.page.click('#f-dispute button[type=submit]');
await maya.page.waitForSelector('#invite-link');
const id2 = maya.page.url().split('/').pop();
await tom.page.goto(await maya.page.inputValue('#invite-link'));
await tom.page.click('#decline');
await tom.page.waitForURL(/deleted=1/);
assert.equal((await fetch(`${BASE}/api/c/${id2}`)).status, 404);
step('invitee declined: case deleted');

// 9. Landing on a phone, static pages, 404s
await tom.page.goto(BASE);
await shot(tom.page, '08-landing-phone');
for (const path of ['/privacy', '/about', '/og.png', '/robots.txt', '/sitemap.xml', '/icon.svg']) {
  assert.equal((await fetch(`${BASE}${path}`)).status, 200, path);
}
assert.equal((await fetch(`${BASE}/c/zzzzzzzz`)).status, 404);
assert.equal((await fetch(`${BASE}/nope`)).status, 404);
step('static pages 200; unknown case and page 404');

// Clean up the dispute
await maya.page.goto(`${BASE}/c/${id}`);
await maya.page.click('#del');
await maya.page.waitForURL(/deleted=1/);

assert.deepEqual(errors, [], `console errors:\n${errors.join('\n')}`);
step(`zero unexpected console errors (${expected.length} expected 403/409 logs from the deliberate rejection checks)`);
await browser.close();
console.log(`PASS ${BASE}`);
