#!/usr/bin/env node
/**
 * Regenerates the three micro-site share images (1200x630 PNG):
 *   public/halloween/og-image.png   (senoiahalloween.com)
 *   public/masquerade/og-image.png  (thehalloweenmasquerade.com)
 *   public/christmas/og-image.png   (christmas.enjoysenoia.com)
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
 * Christmas: the site's evergreen, gold and cream (src/christmas/christmas.css), with
 * the sponsor's logo (src/christmas/assets/bmw-of-south-atlanta.png) on a white card
 * because its wordmark is black. Set in Merriweather and Roboto from @fontsource,
 * the same files the site serves. Pango can't shape WOFF and on macOS ignores
 * fontconfig unless told to, so those files are unpacked to TTF and the render runs
 * with PANGOCAIRO_BACKEND=fc and a fontconfig that sees only them.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inflateSync } from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(path.join(tmpdir(), 'og-'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// `quantize` suits flat art (Halloween); the Masquerade has smooth gradients that
// band when palettized, so it stays truecolor.
function render(svg, outFile, quantize, env) {
  const svgFile = path.join(tmp, path.basename(path.dirname(outFile)) + '.svg');
  writeFileSync(svgFile, svg);
  execFileSync('rsvg-convert', ['-w', '1200', '-h', '630', svgFile, '-o', outFile], { env });
  const args = [outFile, '-strip'];
  if (quantize) args.push('-colors', '128', 'PNG8:' + outFile);
  else args.push(outFile);
  execFileSync('magick', args);
}

// WOFF 1.0 is an sfnt whose tables are each zlib-compressed; rebuild the sfnt.
function woffToSfnt(woff) {
  const count = woff.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < count; i++) {
    const d = 44 + i * 20;
    const offset = woff.readUInt32BE(d + 4);
    const compLength = woff.readUInt32BE(d + 8);
    const origLength = woff.readUInt32BE(d + 12);
    const raw = woff.subarray(offset, offset + compLength);
    tables.push({
      tag: woff.subarray(d, d + 4),
      checksum: woff.readUInt32BE(d + 16),
      data: compLength < origLength ? inflateSync(raw) : raw,
    });
  }
  const pow = 2 ** Math.floor(Math.log2(count));
  const head = Buffer.alloc(12 + count * 16);
  head.writeUInt32BE(woff.readUInt32BE(4), 0); // flavor
  head.writeUInt16BE(count, 4);
  head.writeUInt16BE(pow * 16, 6);
  head.writeUInt16BE(Math.log2(pow), 8);
  head.writeUInt16BE((count - pow) * 16, 10);
  const body = [];
  let at = head.length;
  tables.forEach((t, i) => {
    const r = 12 + i * 16;
    t.tag.copy(head, r);
    head.writeUInt32BE(t.checksum, r + 4);
    head.writeUInt32BE(at, r + 8);
    head.writeUInt32BE(t.data.length, r + 12);
    const pad = (4 - (t.data.length % 4)) % 4;
    body.push(t.data, Buffer.alloc(pad));
    at += t.data.length + pad;
  });
  return Buffer.concat([head, ...body]);
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

// --- Christmas in Senoia -----------------------------------------------------
{
  const { seo } = await import(
    pathToFileURL(path.join(root, 'src/christmas/data/christmasDetails.js')).href
  );
  const logo = readFileSync(path.join(root, 'src/christmas/assets/bmw-of-south-atlanta.png')).toString('base64');
  const host = new URL(seo.url).hostname.toUpperCase();
  const fontDir = path.join(tmp, 'christmas-fonts');
  mkdirSync(fontDir);
  for (const [pkg, file] of [
    ['merriweather', 'merriweather-latin-900-normal'],
    ['merriweather', 'merriweather-latin-900-italic'],
    ['roboto', 'roboto-latin-500-normal'],
    ['roboto', 'roboto-latin-700-normal'],
  ]) {
    const woff = readFileSync(path.join(root, `node_modules/@fontsource/${pkg}/files/${file}.woff`));
    writeFileSync(path.join(fontDir, `${file}.ttf`), woffToSfnt(woff));
  }
  const fontsConf = path.join(tmp, 'christmas-fonts.conf');
  writeFileSync(fontsConf, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig><dir>${fontDir}</dir><cachedir>${path.join(tmp, 'fc-cache')}</cachedir></fontconfig>`);
  // fontconfig names the 900 faces "Merriweather Black"; asking for Merriweather at
  // weight 900 gets nothing of that family and falls back.
  const display = `'Merriweather Black'`;
  // The sponsor flyer's line-up, shortened to fit one line.
  const lineup = 'Christkindl Market · Light Up Senoia Parade 12/5 · Candlelight Tour of Homes 12/13';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 630" width="1200" height="630">
<defs>
<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#142a1d"/><stop offset="100%" stop-color="#1f3d2b"/></linearGradient>
</defs>
<rect width="1200" height="630" fill="url(#ground)"/>
<g fill="#c9a24a" opacity="0.45"><circle cx="96" cy="118" r="3"/><circle cx="1104" cy="96" r="3"/><circle cx="160" cy="520" r="2.5"/><circle cx="1050" cy="540" r="3"/><circle cx="250" cy="300" r="2"/><circle cx="960" cy="330" r="2"/></g>
<g fill="#fbf6ec" opacity="0.25"><circle cx="190" cy="196" r="2"/><circle cx="1010" cy="214" r="2"/><circle cx="84" cy="404" r="2"/><circle cx="1124" cy="430" r="2"/></g>
<rect x="28" y="28" width="1144" height="574" fill="none" stroke="#c9a24a" stroke-opacity="0.6" stroke-width="2"/>
<rect x="40" y="40" width="1120" height="550" fill="none" stroke="#c9a24a" stroke-opacity="0.25"/>
<text x="600" y="168" text-anchor="middle" fill="#fbf6ec" font-family="${display}" font-size="84">Christmas <tspan fill="#c9a24a" font-style="italic">in</tspan> Senoia</text>
<g stroke="#c9a24a" stroke-width="2"><line x1="440" y1="214" x2="580" y2="214"/><line x1="620" y1="214" x2="760" y2="214"/></g>
<path transform="translate(600 214)" fill="#c9a24a" d="M0-11 3-3 11 0 3 3 0 11-3 3-11 0-3-3Z"/>
<text x="600" y="270" text-anchor="middle" fill="#c9a24a" font-family="Roboto" font-weight="700" font-size="20" letter-spacing="5">PRESENTED BY</text>
<rect x="370" y="290" width="460" height="148" rx="18" fill="#fff"/>
<image x="410" y="315" width="380" height="${Math.round((380 * 217) / 889)}" href="data:image/png;base64,${logo}"/>
<text x="600" y="502" text-anchor="middle" fill="#fbf6ec" font-family="'Roboto Medium'" font-size="25">${esc(lineup)}</text>
<text x="600" y="558" text-anchor="middle" fill="#c9a24a" font-family="Roboto" font-weight="700" font-size="20" letter-spacing="5">${esc(host)}</text>
</svg>`;
  render(svg, path.join(root, 'public/christmas/og-image.png'), false, {
    ...process.env,
    PANGOCAIRO_BACKEND: 'fc',
    FONTCONFIG_FILE: fontsConf,
  });
}

console.log('Wrote public/{halloween,masquerade,christmas}/og-image.png');
