#!/usr/bin/env node
/**
 * Writes dist-halloween/: a copy of dist/ whose index.html carries the
 * Halloween in Senoia head (title, description, canonical, Open Graph, Twitter)
 * as static HTML.
 *
 * Why: every Hosting target serves the same dist/index.html and the SPA sets
 * the title client-side, so crawlers and link unfurlers that do not run
 * JavaScript saw the DDA's title on https://senoiahalloween.com/. Only the
 * `halloween` target's `public` points here (firebase.json); `main` and
 * `masquerade` keep serving dist/ untouched.
 *
 * The values come from `seo` in src/halloween/data/halloweenDetails.js, the
 * same object HalloweenSEO.jsx applies at runtime, so the two cannot drift.
 *
 * Run after `vite build` (the `build` npm script does).
 */
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'dist');
const out = path.join(root, 'dist-halloween');

if (!existsSync(path.join(src, 'index.html'))) {
  console.error('dist/index.html not found. Run `vite build` first.');
  process.exit(1);
}

const { seo } = await import(
  pathToFileURL(path.join(root, 'src/halloween/data/halloweenDetails.js')).href
);

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

rmSync(out, { recursive: true, force: true });
cpSync(src, out, { recursive: true });

const file = path.join(out, 'index.html');
let html = readFileSync(file, 'utf8');

function replaceOnce(re, replacement, what) {
  if (!re.test(html)) {
    console.error(`dist/index.html has no ${what} to replace; update scripts/build-halloween-html.mjs.`);
    process.exit(1);
  }
  html = html.replace(re, () => replacement);
}

replaceOnce(/<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`, '<title>');
replaceOnce(
  /<meta\s+name="description"[^>]*>/,
  `<meta name="description" content="${esc(seo.description)}" />`,
  'meta description',
);

const tags = [
  `<link rel="canonical" href="${esc(seo.url)}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:title" content="${esc(seo.title)}" />`,
  `<meta property="og:description" content="${esc(seo.description)}" />`,
  `<meta property="og:url" content="${esc(seo.url)}" />`,
  seo.ogImage ? `<meta property="og:image" content="${esc(seo.ogImage)}" />` : null,
  `<meta name="twitter:card" content="${seo.ogImage ? 'summary_large_image' : 'summary'}" />`,
  `<meta name="twitter:title" content="${esc(seo.title)}" />`,
  `<meta name="twitter:description" content="${esc(seo.description)}" />`,
  seo.ogImage ? `<meta name="twitter:image" content="${esc(seo.ogImage)}" />` : null,
].filter(Boolean);

html =html.replace(/(<meta\s+name="description"[^>]*>)/, (m) => `${m}\n    ${tags.join('\n    ')}`);

writeFileSync(file, html);
console.log(`dist-halloween/index.html: title "${seo.title}", canonical ${seo.url}`);
