#!/usr/bin/env node
/**
 * Writes public/sitemap.xml (Vite copies it into dist/) so the sitemap lists
 * what the site actually serves, not a hand-maintained snapshot.
 *
 * Runs automatically before `npm run build` (the `prebuild` npm script), and
 * therefore in CI on every deploy, including the scheduled one in deploy.yml.
 * The output is gitignored; there is no committed copy to drift.
 *
 * Sources, merged the same way src/services/dataService.js merges them:
 *   static pages  <Route path> entries in src/App.jsx (no params, no /admin)
 *   events        data/site/events.json, patched by Firestore `events/{slug}`
 *   businesses    data/site/businesses.json, patched by Firestore `businesses/{slug}`
 *   news          Firestore `news` where status == 'published'
 *                 (fallback: published stories in data/site/news.json)
 *
 *   - a Firestore doc with `hidden: true` removes that URL
 *   - a Firestore doc matching no built-in item adds one, provided it has the
 *     fields the site needs to render it (events: title+start, businesses: name)
 *   - URLs that firebase.json redirects on the `main` target are left out
 *
 * Firestore is read through the public REST API with no credentials (these
 * collections are public-read). If it cannot be reached the built-in data is
 * used instead, so the file is always valid; the build fails only if the
 * result is empty or malformed (scripts/check-sitemap.mjs).
 *
 * Env: SITEMAP_PROJECT_ID (default VITE_FIREBASE_PROJECT_ID, then "enjoysenoia"),
 *      SITEMAP_OFFLINE=1 skips Firestore entirely.
 *
 * Usage: node scripts/generate-sitemap.mjs [outfile]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSitemap } from './check-sitemap.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(path.join(root, p), 'utf8'));

export const ORIGIN = 'https://www.enjoysenoia.com';
const PROJECT_ID = process.env.SITEMAP_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'enjoysenoia';
const FETCH_TIMEOUT_MS = 10000;
const DOCS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Served by their own micro-sites, so not part of this host's sitemap.
const EXCLUDED_ROUTES = new Set(['/masquerade', '/halloween']);
// Only meant for people sent the link (sponsor logo upload); noindexed too.
EXCLUDED_ROUTES.add('/sponsor-logo');

/* ---------------------------- built-in routes --------------------------- */

export function staticRoutes(appSource) {
  const out = new Set();
  for (const [, p] of appSource.matchAll(/<Route\s+path="([^"]+)"/g)) {
    if (p.includes(':') || p.includes('*')) continue;
    if (p === '/admin' || p.startsWith('/admin/')) continue;
    if (EXCLUDED_ROUTES.has(p)) continue;
    out.add(p);
  }
  return out;
}

// Same rule as getEventSlug()/slugOf() in dataService.js.
const eventSlug = (e) => {
  if (e.slug) return e.slug;
  if (e.link?.startsWith('/events/')) return e.link.replace('/events/', '');
  return String(e.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

/** Exact (non-glob) redirect sources of the `main` hosting target. */
export function redirectedPaths(firebaseJson) {
  const hosting = [].concat(firebaseJson.hosting || []);
  const main = hosting.find((h) => h.target === 'main') || hosting[0] || {};
  return new Set((main.redirects || []).map((r) => r.source).filter((s) => s && !/[*?[{(]/.test(s)));
}

/* ------------------------------ Firestore ------------------------------- */

async function fetchJson(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url.split('?')[0]}`);
  return res.json();
}

/** Every document in a public-read collection, as { [slug]: plain fields }. */
async function listCollection(name, fields) {
  const out = {};
  let pageToken = '';
  do {
    const qs = new URLSearchParams({ pageSize: '300' });
    fields.forEach((f) => qs.append('mask.fieldPaths', f));
    if (pageToken) qs.set('pageToken', pageToken);
    const body = await fetchJson(`${DOCS}/${name}?${qs}`);
    for (const d of body.documents || []) {
      const f = d.fields || {};
      const plain = {};
      for (const k of fields) {
        if (f[k]) plain[k] = k === 'hidden' ? f[k].booleanValue === true : f[k].stringValue;
      }
      out[d.name.split('/').pop()] = plain;
    }
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  return out;
}

/** Slugs of published news stories (the rules only allow this filtered query). */
async function publishedNewsSlugs() {
  const body = await fetchJson(`${DOCS}:runQuery`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'news' }],
        where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'published' } } },
      },
    }),
  });
  return body.filter((r) => r.document).map((r) => r.document.name.split('/').pop());
}

async function orFallback(label, load, fallback) {
  if (process.env.SITEMAP_OFFLINE) return fallback();
  try {
    return await load();
  } catch (err) {
    console.warn(`sitemap: could not read ${label} from Firestore (${err.message}); using built-in data`);
    return fallback();
  }
}

/* -------------------------------- build --------------------------------- */

/**
 * Pure merge of built-in data and Firestore docs into a sorted route list.
 * `patches.events` / `patches.businesses` are { [slug]: { hidden, title, start | name } }.
 */
export function composeRoutes({ staticPaths, events, businesses, newsSlugs, patches, redirected }) {
  const routes = new Set(staticPaths);
  const add = (prefix, slugs, docs, isComplete) => {
    const seen = new Set(slugs);
    slugs.forEach((s) => {
      if (s && !docs[s]?.hidden) routes.add(`${prefix}/${s}`);
    });
    // A doc matching nothing built in is a staff-added item; one lacking the
    // fields the site needs to render it is an orphaned patch and is ignored.
    Object.entries(docs).forEach(([s, d]) => {
      if (!seen.has(s) && !d.hidden && isComplete(d)) routes.add(`${prefix}/${s}`);
    });
  };
  add('/events', events.map(eventSlug), patches.events, (d) => d.title && d.start);
  add('/downtown-business', businesses.map((b) => b.slug), patches.businesses, (d) => d.name);
  newsSlugs.forEach((s) => routes.add(`/news/${s}`));
  return [...routes].filter((r) => !redirected.has(r)).sort();
}

export async function buildRoutes() {
  const news = readJson('data/site/news.json');
  return composeRoutes({
    staticPaths: staticRoutes(readFileSync(path.join(root, 'src/App.jsx'), 'utf8')),
    events: readJson('data/site/events.json'),
    businesses: readJson('data/site/businesses.json'),
    newsSlugs: await orFallback('news', publishedNewsSlugs, () =>
      news.filter((n) => n.published !== false).map((n) => n.slug)
    ),
    patches: {
      events: await orFallback('events', () => listCollection('events', ['hidden', 'title', 'start']), () => ({})),
      businesses: await orFallback('businesses', () => listCollection('businesses', ['hidden', 'name']), () => ({})),
    },
    redirected: redirectedPaths(readJson('firebase.json')),
  });
}

const xmlEscape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function toXml(routes) {
  const loc = (r) => xmlEscape(ORIGIN + (r === '/' ? '' : r.split('/').map(encodeURIComponent).join('/')));
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    routes.map((r) => `  <url><loc>${loc(r)}</loc></url>`).join('\n') +
    '\n</urlset>\n'
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.resolve(process.argv[2] || path.join(root, 'public/sitemap.xml'));
  const routes = await buildRoutes();
  const xml = toXml(routes);
  const problems = validateSitemap(xml);
  if (problems.length) {
    console.error('sitemap: generated file is invalid:\n  ' + problems.join('\n  '));
    process.exit(1);
  }
  writeFileSync(out, xml);
  console.log(`sitemap: wrote ${routes.length} URLs to ${path.relative(root, out)}`);
}
