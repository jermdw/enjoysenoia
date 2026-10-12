#!/usr/bin/env node
/**
 * Regenerates the two micro-site share images (1200x630 PNG):
 *   public/halloween/og-image.png   (senoiahalloween.com)
 *   public/masquerade/og-image.png  (thehalloweenmasquerade.com)
 *
 * Not part of `npm run build`: the PNGs are committed. Run this by hand when the
 * artwork or the event text changes, then commit the PNGs:
 *
 *   node scripts/build-og-images.mjs
 *
 * Needs `rsvg-convert` (librsvg) and ImageMagick's `magick` on PATH; neither is
 * a project dependency. Text is set in system fonts (Didot / DIN Condensed on
 * macOS) and baked into the PNG, so it renders the same wherever it is shown.
 *
 * Halloween: wraps public/halloween/event-card.svg (whose lettering is already
 * outlined paths) in a 1200x630 purple field and adds the domain.
 * Masquerade: hand-authored in the site's own palette (src/masquerade/masquerade.css),
 * with the key cut from the organizer's title card (src/masquerade/assets/key.png).
 * Event text comes from src/masquerade/data/eventDetails.js.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(path.join(tmpdir(), 'og-'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// `quantize` suits flat art (Halloween); the Masquerade has smooth gradients that
// band when palettized, so it stays truecolor.
function render(svg, outFile, quantize) {
  const svgFile = path.join(tmp, path.basename(path.dirname(outFile)) + '.svg');
  writeFileSync(svgFile, svg);
  execFileSync('rsvg-convert', ['-w', '1200', '-h', '630', svgFile, '-o', outFile]);
  const args = [outFile, '-strip'];
  if (quantize) args.push('-colors', '128', 'PNG8:' + outFile);
  else args.push(outFile);
  execFileSync('magick', args);
}

// --- Halloween in Senoia -----------------------------------------------------
{
  const card = readFileSync(path.join(root, 'public/halloween/event-card.svg'), 'utf8');
  const inner = card.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const scale = 0.78; // 1280x720 card -> 998x562, leaving a strip for the domain
  const x = (1200 - 1280 * scale) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 630" width="1200" height="630">
<rect width="1200" height="630" fill="#846589"/>
<g fill="#f9e9d1"><circle cx="40" cy="60" r="5"/><circle cx="1150" cy="120" r="5"/><circle cx="70" cy="560" r="5"/><circle cx="1130" cy="500" r="5"/></g>
<g fill="#e27925"><circle cx="60" cy="300" r="5"/><circle cx="1160" cy="330" r="5"/><circle cx="30" cy="450" r="4"/><circle cx="1170" cy="40" r="4"/></g>
<g transform="translate(${x} 0) scale(${scale})">${inner}</g>
<rect x="350" y="578" width="500" height="42" rx="21" fill="#0e0c0c"/>
<text x="600" y="608" text-anchor="middle" fill="#f9e9d1" font-family="'DIN Condensed', 'Arial Narrow', Impact, sans-serif" font-weight="700" font-size="30" letter-spacing="3">SENOIAHALLOWEEN.COM</text>
</svg>`;
  render(svg, path.join(root, 'public/halloween/og-image.png'), true);
}

// --- The Halloween Masquerade ------------------------------------------------
{
  const { event, seo } = await import(
    pathToFileURL(path.join(root, 'src/masquerade/data/eventDetails.js')).href
  );
  const key = readFileSync(path.join(root, 'src/masquerade/assets/key.png')).toString('base64');
  const host = new URL(seo.url).hostname.toUpperCase();
  const serif = `Didot, 'Bodoni 72', Georgia, 'Times New Roman', serif`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 630" width="1200" height="630">
<defs>
<radialGradient id="bloom" cx="50%" cy="20%" r="70%"><stop offset="0%" stop-color="#8b0e16" stop-opacity="0.6"/><stop offset="60%" stop-color="#8b0e16" stop-opacity="0.1"/><stop offset="100%" stop-color="#0b0a0c" stop-opacity="0"/></radialGradient>
<radialGradient id="vignette" cx="50%" cy="50%" r="75%"><stop offset="50%" stop-color="#0b0a0c" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.8"/></radialGradient>
</defs>
<rect width="1200" height="630" fill="#0b0a0c"/>
<rect width="1200" height="630" fill="url(#bloom)"/>
<g fill="#c2a36b" opacity="0.2">
<path transform="translate(70 70) scale(2.4)" d="M12 21s-7.5-4.7-9.6-9A5.4 5.4 0 0 1 12 6.6 5.4 5.4 0 0 1 21.6 12c-2.1 4.3-9.6 9-9.6 9Z"/>
<path transform="translate(1080 90) scale(2)" d="M12 2 20 12l-8 10-8-10 8-10Z"/>
<path transform="translate(1070 480) scale(2.2)" d="M12 2c2.4 3.6 8 6.4 8 10.4a4.3 4.3 0 0 1-6.9 3.5c.2 2 .9 3.4 2.4 4.6H8.5c1.5-1.2 2.2-2.6 2.4-4.6A4.3 4.3 0 0 1 4 12.4C4 8.4 9.6 5.6 12 2Z"/>
<path transform="translate(70 470) scale(2)" d="M12 2.8a3.7 3.7 0 0 1 3.1 5.7 3.8 3.8 0 1 1 1.5 7.2 3.8 3.8 0 0 1-3-1.5c.1 2.1.8 3.6 2.4 4.9H8c1.6-1.3 2.3-2.8 2.4-4.9a3.8 3.8 0 0 1-3 1.5 3.8 3.8 0 1 1 1.5-7.2A3.7 3.7 0 0 1 12 2.8Z"/>
</g>
<rect width="1200" height="630" fill="url(#vignette)"/>
<rect x="28" y="28" width="1144" height="574" fill="none" stroke="#c2a36b" stroke-opacity="0.55" stroke-width="2"/>
<rect x="40" y="40" width="1120" height="550" fill="none" stroke="#c2a36b" stroke-opacity="0.25"/>
<text x="600" y="128" text-anchor="middle" fill="#f2e7d5" font-family="${serif}" font-size="48">${esc(event.name)}</text>
<text x="600" y="232" text-anchor="middle" fill="#c2a36b" font-family="${serif}" font-weight="700" font-size="70" letter-spacing="3">${esc(event.theme.toUpperCase())}</text>
<image x="450" y="262" width="300" height="123" href="data:image/png;base64,${key}"/>
<text x="600" y="462" text-anchor="middle" fill="#f2e7d5" font-family="${serif}" font-size="38">${esc(event.dateLabel)}</text>
<text x="600" y="512" text-anchor="middle" fill="#cbbda6" font-family="${serif}" font-size="32">${esc(event.venue.label)}</text>
<text x="600" y="568" text-anchor="middle" fill="#c2a36b" font-family="${serif}" font-size="24" letter-spacing="6">${esc(host)}</text>
</svg>`;
  render(svg, path.join(root, 'public/masquerade/og-image.png'));
}

console.log('Wrote public/halloween/og-image.png and public/masquerade/og-image.png');
