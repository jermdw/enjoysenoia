/**
 * Firestore access for News stories.
 *
 * Firestore is the source of truth for News. data/site/news.json is what
 * scripts/webflow_transform.py exported from Webflow; it seeded this
 * collection once (scripts/seed_news.py) and no page reads it any more, so
 * re-running the transform does not change the site's news.
 *
 *   news/{slug}   one story per document, keyed by its /news/<slug> address.
 *                 Public may read a story only when status is 'published';
 *                 drafts and every write are admin-only (firestore.rules).
 *
 * Because the rules gate reads on status, every public query below filters
 * on status == 'published'. A query without that filter is rejected outright
 * rather than quietly trimmed.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export const NEWS = 'news';

const DISPLAY_DATE = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

/**
 * A stored story in the shape the pages already render. `date` stays blank
 * when showDate is off: most migrated stories had no date on the old site,
 * and publishedAt then only orders them.
 */
function toArticle(id, data) {
  const publishedAt = data.publishedAt?.toDate?.() ?? null;
  return {
    id,
    slug: data.slug || id,
    link: `/news/${data.slug || id}`,
    title: data.title || '',
    summary: data.summary || '',
    body_html: data.bodyHtml || '',
    image: data.image || null,
    image_alt: data.imageAlt || '',
    status: data.status,
    publishedAt,
    date: data.showDate && publishedAt ? DISPLAY_DATE.format(publishedAt) : '',
  };
}

/**
 * Published stories, newest first. Served by the (status, publishedAt)
 * composite index in firestore.indexes.json, which must be deployed before
 * this query runs against a project.
 */
export async function getPublishedNews({ max } = {}) {
  const clauses = [
    collection(db, NEWS),
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
  ];
  if (max) clauses.push(limit(max));
  const snap = await getDocs(query(...clauses));
  // When the server is unreachable, getDocs settles on the (empty) local cache
  // instead of failing; that would read as "no news" rather than "couldn't load".
  if (snap.empty && snap.metadata.fromCache) {
    throw new Error('News could not be reached; only the empty local cache answered.');
  }
  return snap.docs.map((d) => toArticle(d.id, d.data()));
}

/**
 * One published story by slug, or null when there is none. A draft reads as
 * missing: the rules refuse it to the public, and a signed-in admin landing on
 * the public page should see what visitors see.
 */
export async function getPublishedStory(slug) {
  try {
    const snap = await getDoc(doc(db, NEWS, slug));
    if (!snap.exists() || snap.data().status !== 'published') return null;
    return toArticle(snap.id, snap.data());
  } catch (err) {
    if (err?.code === 'permission-denied') return null;
    throw err;
  }
}
