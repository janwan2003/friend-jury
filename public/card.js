// Draws the verdict card (1080x1350, sized for stories and chats) on a canvas.
const W = 1080, H = 1350;
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

function wrap(ctx, text, maxW, maxLines) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let l = lines[maxLines - 1];
    while (ctx.measureText(`${l}…`).width > maxW && l.length) l = l.slice(0, -1);
    lines[maxLines - 1] = `${l.trimEnd()}…`;
  }
  return lines;
}

function fitText(ctx, text, maxW, size, minSize, weight, family, maxLines) {
  for (let s = size; s >= minSize; s -= 4) {
    ctx.font = `${weight} ${s}px ${family}`;
    const lines = wrap(ctx, text, maxW, 99);
    if (lines.length <= maxLines) return { lines, size: s };
  }
  ctx.font = `${weight} ${minSize}px ${family}`;
  return { lines: wrap(ctx, text, maxW, maxLines), size: minSize };
}

export function drawCard(s, host) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const r = s.result;
  // Paper
  ctx.fillStyle = '#f8f4ea'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#1c2240'; ctx.lineWidth = 6; ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 2; ctx.strokeRect(56, 56, W - 112, H - 112);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#6a6e80'; ctx.font = `800 30px ${SANS}`;
  ctx.fillText(`JURYBOX · CASE ${s.id.toUpperCase()}`, W / 2, 140);
  ctx.fillStyle = '#1c2240'; ctx.font = `800 52px ${SANS}`;
  ctx.fillText('THE JURY HAS RULED', W / 2, 220);

  let y = 300;
  ctx.fillStyle = '#3a4064';
  const q = fitText(ctx, `“${s.q}”`, W - 220, 46, 34, 'italic 500', SERIF, 3);
  for (const l of q.lines) { ctx.fillText(l, W / 2, y); y += q.size * 1.25; }

  y += 40;
  ctx.fillStyle = '#1c2240';
  const h = fitText(ctx, r.headline, W - 200, 96, 56, '700', SERIF, 3);
  for (const l of h.lines) { y += h.size * 0.95; ctx.fillText(l, W / 2, y); y += h.size * 0.2; }

  // Split bar
  y += 60;
  const t = r.tally, bx = 140, bw = W - 280, bh = 40;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(bx, y, bw, bh, 20); ctx.clip();
  ctx.fillStyle = '#ecebe6'; ctx.fillRect(bx, y, bw, bh);
  let x = bx;
  for (const [k, col] of [['a', '#e25d26'], ['b', '#2b5fd4'], ['x', '#8a8d99']]) {
    const w = t.total ? (t[k] / t.total) * bw : 0;
    ctx.fillStyle = col; ctx.fillRect(x, y, w, bh); x += w;
  }
  ctx.restore();
  y += bh + 50;
  ctx.font = `700 30px ${SANS}`;
  ctx.textAlign = 'left'; ctx.fillStyle = '#e25d26';
  ctx.fillText(`${s.a.label}: ${t.a}`.slice(0, 34), bx, y);
  ctx.textAlign = 'right'; ctx.fillStyle = '#2b5fd4';
  ctx.fillText(`${s.b.label}: ${t.b}`.slice(0, 34), bx + bw, y);
  if (t.x) { ctx.textAlign = 'center'; ctx.fillStyle = '#6a6e80'; ctx.fillText(`Both wrong: ${t.x}`, W / 2, y + 46); }
  ctx.textAlign = 'center';

  // Quote
  if (r.best) {
    y += t.x ? 130 : 100;
    ctx.fillStyle = '#1c2240';
    const qq = fitText(ctx, `“${r.best.ruling}”`, W - 240, 50, 36, 'italic 500', SERIF, 3);
    for (const l of qq.lines) { ctx.fillText(l, W / 2, y); y += qq.size * 1.25; }
    ctx.fillStyle = '#6a6e80'; ctx.font = `600 30px ${SANS}`;
    ctx.fillText(`juror ${r.best.name}`, W / 2, y + 6);
  }

  // Stamp
  ctx.save();
  ctx.font = `900 46px ${SANS}`;
  const sw = ctx.measureText(r.stamp).width + 60;
  ctx.translate(W - 120 - sw / 2, H - 240); ctx.rotate(-0.12);
  ctx.strokeStyle = '#c3312a'; ctx.fillStyle = '#c3312a'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.roundRect(-sw / 2, -50, sw, 96, 14); ctx.stroke();
  ctx.fillText(r.stamp, 0, 18);
  ctx.restore();

  ctx.textAlign = 'left'; ctx.fillStyle = '#6a6e80'; ctx.font = `600 28px ${SANS}`;
  ctx.fillText(`${t.total} ${t.total === 1 ? 'juror' : 'jurors'} · settle yours at`, 110, H - 150);
  ctx.fillStyle = '#1c2240'; ctx.font = `800 32px ${SANS}`;
  ctx.fillText(host, 110, H - 105);
  return c;
}

export async function shareCard(s) {
  const canvas = drawCard(s, location.host);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  const file = new File([blob], `jurybox-verdict-${s.id}.png`, { type: 'image/png' });
  const text = `The jury has ruled: ${s.result.headline}. ${location.origin}/c/${s.id}`;
  if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ files: [file], text }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return 'downloaded';
}
