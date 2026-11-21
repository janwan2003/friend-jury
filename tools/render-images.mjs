// Renders public/og.png (1200x630) and the PNG app icons from SVG/HTML sources.
import { launch } from './browser.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`file://${root}tools/og.html`);
await page.screenshot({ path: `${root}public/og.png` });
const svg = readFileSync(`${root}public/icon.svg`, 'utf8');
for (const size of [180, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
  await page.screenshot({ path: `${root}public/icon-${size}.png` });
}
await browser.close();
console.log('rendered og.png, icon-180.png, icon-512.png');
