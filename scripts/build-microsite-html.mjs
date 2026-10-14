#!/usr/bin/env node
/**
 * Writes dist-halloween/, dist-masquerade/ and dist-christmas/: copies of dist/
 * whose index.html carries each micro-site's head (title, description,
 * canonical, Open Graph, Twitter) as static HTML.
 *
 * Why: every Hosting target serves the same dist/index.html and the SPA sets
 * the title client-side, so crawlers and link unfurlers that do not run
 * JavaScript saw the DDA's title on https://senoiahalloween.com/ and
 * https://thehalloweenmasquerade.com/. Only the `halloween`, `masquerade` and
 * `christmas` targets' `public` point at these copies (firebase.json); `main`
 * keeps serving dist/ untouched.
 *
 * The values come from the `seo` export of each site's data file, the same
 * object HalloweenSEO.jsx / MasqueradeSEO.jsx / ChristmasSEO.jsx apply at
 * runtime, so the two cannot drift.
 *
 * Run after `vite build` (the `build` npm script does).
 */
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'dist');

// Share images are authored at this size (scripts/build-og-images.mjs).
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

const sites = [
  { out: 'dist-halloween', data: 'src/halloween/data/halloweenDetails.js' },
  { out: 'dist-masquerade', data: 'src/masquerade/data/eventDetails.js' },
  { out: 'dist-christmas', data: 'src/christmas/data/christmasDetails.js' },
];

if (!existsSync(path.join(src, 'index.html'))) {
  console.error('dist/index.html not found. Run `vite build` first.');
  process.exit(1);
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const site of sites) {
  const { seo } = await import(pathToFileURL(path.join(root, site.data)).href);
  const out = path.join(root, site.out);

  rmSync(out, { recursive: true, force: true });
  cpSync(src, out, { recursive: true });

  const file = path.join(out, 'index.html');
  let html = readFileSync(file, 'utf8');

  // index.html carries the main site's share tags between these markers; drop
  // them so only this micro-site's tags (appended below) remain.
  html = html.replace(/[ \t]*<!-- main-site-share:start[\s\S]*?main-site-share:end -->\n?/, '');

  const replaceOnce = (re, replacement, what) => {
    if (!re.test(html)) {
      console.error(`dist/index.html has no ${what} to replace; update scripts/build-microsite-html.mjs.`);
      process.exit(1);
    }
    html = html.replace(re, () => replacement);
  };

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
    seo.ogImage ? `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />` : null,
    seo.ogImage ? `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />` : null,
    `<meta name="twitter:card" content="${seo.ogImage ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(seo.title)}" />`,
    `<meta name="twitter:description" content="${esc(seo.description)}" />`,
    seo.ogImage ? `<meta name="twitter:image" content="${esc(seo.ogImage)}" />` : null,
  ].filter(Boolean);

  html = html.replace(/(<meta\s+name="description"[^>]*>)/, (m) => `${m}\n    ${tags.join('\n    ')}`);

  writeFileSync(file, html);
  console.log(`${site.out}/index.html: title "${seo.title}", canonical ${seo.url}`);
}
