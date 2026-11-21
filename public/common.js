// Shared helpers: browser identity token, API calls, sharing, small DOM utilities.

export const GAVEL = `<svg viewBox="0 0 64 64" aria-hidden="true"><g transform="rotate(-38 32 30)"><rect x="26.5" y="22" width="7" height="34" rx="3.5" fill="#1c2240"/><rect x="13" y="8" width="34" height="16" rx="3.5" fill="#1c2240"/><rect x="9" y="5.5" width="8" height="21" rx="2.5" fill="#e25d26"/><rect x="43" y="5.5" width="8" height="21" rx="2.5" fill="#2b5fd4"/></g><rect x="4" y="53" width="30" height="7" rx="3" fill="#b4862c"/></svg>`;

export const $ = (sel, root = document) => root.querySelector(sel);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function randomToken() {
  const a = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// One random token per browser identifies you to every case (stored hashed on the server). No account.
export function myToken() {
  try {
    let t = localStorage.getItem('jb.token');
    if (!t) { t = randomToken(); localStorage.setItem('jb.token', t); }
    return t;
  } catch {
    window.__jbToken ||= randomToken();
    return window.__jbToken;
  }
}

export function remember(key, value) { try { localStorage.setItem(`jb.${key}`, value); } catch { /* storage blocked */ } }
export function recall(key) { try { return localStorage.getItem(`jb.${key}`) || ''; } catch { return ''; } }

export async function api(path, { method = 'GET', body, invite } = {}) {
  const headers = { 'x-token': myToken() };
  if (invite) headers['x-invite'] = invite;
  if (body) headers['content-type'] = 'application/json';
  let res;
  try {
    res = await fetch(`/api/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw Object.assign(new Error('No connection. Check your internet and try again.'), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong.'), { status: res.status });
  return data;
}

export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.append(el);
  setTimeout(() => el.remove(), 2200);
}

const isPhone = () => matchMedia('(pointer: coarse)').matches;

// Share sheet on phones, clipboard on desktop.
export async function shareLink({ title, text, url }) {
  if (navigator.share && isPhone()) {
    try { await navigator.share({ title, text, url }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    toast('Link copied. Paste it in the chat.');
    return 'copied';
  } catch {
    prompt('Copy this link:', url);
    return 'prompted';
  }
}

export function counter(input, out) {
  const max = Number(input.getAttribute('maxlength'));
  const upd = () => { out.textContent = `${Array.from(input.value).length}/${max}`; };
  input.addEventListener('input', upd);
  upd();
}
