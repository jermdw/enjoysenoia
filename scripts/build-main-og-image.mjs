#!/usr/bin/env node
/**
 * Regenerates the main-site share image: public/og-image.png (1200x630),
 * referenced by the static Open Graph / Twitter tags in index.html.
 *
 * Not part of `npm run build`: the PNG is committed. Run by hand when the logo
 * or wording changes, then commit the PNG:
 *
 *   node scripts/build-main-og-image.mjs
 *
 * Needs `rsvg-convert` (librsvg) and ImageMagick's `magick` on PATH; neither is
 * a project dependency.
 *
 * The art is the site's own header logo (house, water tower and storefronts,
 * with its "The perfect setting. For life." tagline baked in) on the stone-50
 * page background, with the senoia-red / senoia-gold palette from
 * src/styles/index.css. Wording is the hero's: "Historic Senoia, Georgia" and
 * "Senoia Downtown Development Authority" (src/components/home/Hero.jsx).
 *
 * The logo lives in Firebase Storage / Webflow, not in git. The script uses the
 * local copy from `python3 scripts/webflow_pull.py --download-assets` when
 * present, else downloads the original from the URL in data/webflow/assets.json.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(path.join(tmpdir(), 'og-main-'));

const LOGO_FILE = '6362a03acb8c6b389861e276_enjoy_senoia_site_logo.svg';
const LOGO_URL =
  'https://s3.amazonaws.com/webflow-prod-assets/62c89378d6e12946d6cdd965/6362a03acb8c6b389861e276_enjoy%20senoia%20site%20logo.svg';

async function loadLogo() {
  const local = path.join(root, 'public/assets/webflow', LOGO_FILE);
  if (existsSync(local)) return readFileSync(local);
  const res = await fetch(LOGO_URL);
  if (!res.ok) throw new Error(`logo download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const logo = (await loadLogo()).toString('base64');
const serif = `Georgia, 'Times New Roman', serif`;
const sans = `'Helvetica Neue', Arial, sans-serif`;

// Logo is 568.478 x 131.596; drawn 980 wide -> 227 tall.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 630" width="1200" height="630">
<rect width="1200" height="630" fill="#fafaf9"/>
<rect width="1200" height="14" fill="#cfa138"/>
<image x="110" y="92" width="980" height="227" xlink:href="data:image/svg+xml;base64,${logo}"/>
<rect x="540" y="352" width="120" height="4" rx="2" fill="#cfa138"/>
<text x="600" y="412" text-anchor="middle" fill="#232323" font-family="${serif}" font-weight="700" font-size="38">Senoia Downtown Development Authority</text>
<rect y="490" width="1200" height="140" fill="#8f1d1d"/>
<rect y="490" width="1200" height="5" fill="#6e1414"/>
<text x="600" y="548" text-anchor="middle" fill="#ffffff" font-family="${serif}" font-weight="700" font-size="40">Historic Senoia, Georgia</text>
<text x="600" y="592" text-anchor="middle" fill="#e8c874" font-family="${sans}" font-weight="500" font-size="26" letter-spacing="4">WWW.ENJOYSENOIA.COM</text>
</svg>`;

const svgFile = path.join(tmp, 'og-image.svg');
const out = path.join(root, 'public/og-image.png');
writeFileSync(svgFile, svg);
execFileSync('rsvg-convert', ['-w', '1200', '-h', '630', svgFile, '-o', out]);
// Flat colors plus a detailed illustration: a 256-color palette keeps it small.
execFileSync('magick', [out, '-strip', '-colors', '256', 'PNG8:' + out]);
console.log(`wrote ${path.relative(root, out)}`);
