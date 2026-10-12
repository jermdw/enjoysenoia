#!/usr/bin/env node
/**
 * Self-check for the sitemap. Library use: validateSitemap(xml) -> string[] of
 * problems (empty = valid). CLI: node scripts/check-sitemap.mjs [file]
 * (default public/sitemap.xml, i.e. what the last build generated).
 *
 * Checks: urlset wrapper, every <url><loc> is an https://www.enjoysenoia.com
 * URL with no query/fragment, no duplicates, no admin or micro-site paths,
 * the home page is present, and the count is plausible (the site has ~100+).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://www.enjoysenoia.com';
export const MIN_URLS = 40;
export const MAX_URLS = 50000; // protocol limit

export function validateSitemap(xml) {
  const problems = [];
  const body = xml.replace(/^<\?xml[^>]*\?>\s*/, '');
  const m = body.match(/^<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">([\s\S]*)<\/urlset>\s*$/);
  if (!m) return ['not a <urlset> document in the sitemaps.org namespace'];
  const entries = m[1].trim() ? m[1].trim().split(/\n/) : [];
  const locs = [];
  for (const line of entries) {
    const e = line.trim().match(/^<url><loc>([^<>]+)<\/loc><\/url>$/);
    if (!e) {
      problems.push(`malformed entry: ${line.trim().slice(0, 120)}`);
      continue;
    }
    // A bare & or an unknown entity would make the document ill-formed.
    if (/&(?!(amp|lt|gt|quot|apos);)/.test(e[1])) problems.push(`bad entity in: ${e[1]}`);
    locs.push(e[1]);
  }
  const seen = new Set();
  for (const loc of locs) {
    if (!(loc === ORIGIN || loc.startsWith(ORIGIN + '/'))) problems.push(`wrong host: ${loc}`);
    if (/[?#\s]/.test(loc)) problems.push(`query, fragment or whitespace: ${loc}`);
    if (/\/(admin|masquerade|halloween)(\/|$)/.test(loc)) problems.push(`not a public main-site page: ${loc}`);
    if (seen.has(loc)) problems.push(`duplicate: ${loc}`);
    seen.add(loc);
  }
  if (!seen.has(ORIGIN)) problems.push('home page missing');
  if (locs.length < MIN_URLS) problems.push(`only ${locs.length} URLs (expected at least ${MIN_URLS})`);
  if (locs.length > MAX_URLS) problems.push(`${locs.length} URLs exceeds the ${MAX_URLS} limit`);
  return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const file = path.resolve(process.argv[2] || path.join(root, 'public/sitemap.xml'));
  const xml = readFileSync(file, 'utf8');
  const problems = validateSitemap(xml);
  if (problems.length) {
    console.error(`${path.relative(root, file)} is invalid:\n  ` + problems.join('\n  '));
    process.exit(1);
  }
  console.log(`${path.relative(root, file)} OK: ${(xml.match(/<loc>/g) || []).length} URLs`);
}
