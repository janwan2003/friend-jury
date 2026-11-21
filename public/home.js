import { $, api, counter, recall, remember, GAVEL, esc } from '/common.js';
import { STARTERS } from '/starters.js';

$('#logo').innerHTML = GAVEL;
const forms = { dispute: $('#f-dispute'), debate: $('#f-debate') };

function setTab(mode) {
  for (const [k, f] of Object.entries(forms)) {
    f.hidden = k !== mode;
    $(`#tab-${k}`).setAttribute('aria-selected', String(k === mode));
  }
}
$('#tab-dispute').addEventListener('click', () => setTab('dispute'));
$('#tab-debate').addEventListener('click', () => setTab('debate'));

for (const id of ['d-q', 'd-text', 'b-q']) counter($(`#${id}`), $(`#${id}-c`));
$('#d-name').value = recall('name');

function fill(s) {
  $('#b-q').value = s.q; $('#b-al').value = s.a.label; $('#b-at').value = s.a.text;
  $('#b-bl').value = s.b.label; $('#b-bt').value = s.b.text;
  $('#b-q').dispatchEvent(new Event('input'));
}
let last = -1;
$('#shuffle').addEventListener('click', () => {
  let i;
  do { i = Math.floor(Math.random() * STARTERS.length); } while (i === last && STARTERS.length > 1);
  last = i;
  fill(STARTERS[i]);
});

// Seasonal classics first (Thanksgiving to New Year), then a varied mix.
const month = new Date().getMonth();
const holiday = month === 10 || month === 11;
const picks = [...STARTERS].sort((a, b) => (holiday ? (b.tag === 'holiday') - (a.tag === 'holiday') : 0));
$('#starters').innerHTML = picks.slice(0, 12).map((s) => `<button type="button" class="starter" data-q="${esc(s.q)}">${esc(s.q)}<small>${esc(s.a.label)} vs ${esc(s.b.label)}</small></button>`).join('');
$('#starters').addEventListener('click', (e) => {
  const btn = e.target.closest('.starter');
  if (!btn) return;
  fill(STARTERS.find((s) => s.q === btn.dataset.q));
  setTab('debate');
  $('#create').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Arrive with ?debate=1 (from a verdict page) to land on the debate tab with a classic filled in.
const params = new URLSearchParams(location.search);
if (params.get('q')) {
  const s = STARTERS.find((x) => x.q === params.get('q'));
  if (s) { fill(s); setTab('debate'); }
} else if (params.get('mode') === 'debate') { setTab('debate'); $('#shuffle').click(); }

// Same rules as the server, checked first so a missing field never costs a request.
function missing(body) {
  if (body.q.trim().length < 3) return 'Say what the argument is about.';
  if (body.mode === 'dispute') {
    if (!body.a.label.trim()) return 'Add your name.';
    if (body.a.text.trim().length < 2) return 'Write your side.';
    return '';
  }
  if (!body.a.label.trim() || !body.b.label.trim()) return 'Give both sides a short name.';
  if (body.a.text.trim().length < 2 || body.b.text.trim().length < 2) return 'Write an argument for both sides.';
  if (body.a.label.trim().toLowerCase() === body.b.label.trim().toLowerCase()) return 'The two sides need different names.';
  return '';
}

async function submit(form, errEl, body) {
  const btn = form.querySelector('button[type=submit]');
  errEl.textContent = missing(body);
  if (errEl.textContent) return;
  btn.disabled = true;
  try {
    const r = await api('c', { method: 'POST', body });
    if (r.invite) remember(`invite.${r.id}`, r.invite);
    location.href = `/c/${r.id}`;
  } catch (e) {
    errEl.textContent = e.message;
    btn.disabled = false;
  }
}

forms.dispute.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#d-name').value.trim();
  remember('name', name);
  submit(forms.dispute, $('#d-err'), {
    mode: 'dispute', q: $('#d-q').value, hours: Number($('#d-hours').value), blind: $('#d-blind').checked,
    a: { label: name, text: $('#d-text').value },
  });
});
forms.debate.addEventListener('submit', (e) => {
  e.preventDefault();
  submit(forms.debate, $('#b-err'), {
    mode: 'debate', q: $('#b-q').value, hours: Number($('#b-hours').value),
    a: { label: $('#b-al').value, text: $('#b-at').value }, b: { label: $('#b-bl').value, text: $('#b-bt').value },
  });
});
