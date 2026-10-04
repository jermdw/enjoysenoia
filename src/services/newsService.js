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
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';

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

/* ------------------------------------------------------------------ *
 * Admin-only below. Every one of these fails for a signed-out visitor
 * at the rules layer, not here.
 * ------------------------------------------------------------------ */

/** Mirrors the slug pattern isValidNewsStory() enforces in firestore.rules. */
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,119}$/;

/** "Porchfest 2025: Highlights!" -> "porchfest-2025-highlights" */
export function slugify(title) {
  return String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/, '');
}

/**
 * A story's address is fixed once anyone could have linked to it: after its
 * first publish, and for every story carried over from Webflow.
 */
export function isSlugLocked(story) {
  return Boolean(story && (story.status === 'published' || story.firstPublishedAt || story.webflowId));
}

/** Every story, drafts included, newest first. */
export async function getAllStories() {
  const snap = await getDocs(query(collection(db, NEWS), orderBy('publishedAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

const editorStamp = () => ({
  updatedAt: serverTimestamp(),
  updatedBy: auth.currentUser?.email || null,
});

/**
 * The editable fields, cleaned to the shape firestore.rules accepts.
 * `publishedAt` arrives as a Date from the form.
 */
function storyFields(form) {
  return {
    title: form.title.trim(),
    summary: (form.summary || '').trim(),
    bodyHtml: form.bodyHtml || '',
    image: form.image || null,
    imageAlt: (form.imageAlt || '').trim(),
    publishedAt: Timestamp.fromDate(form.publishedAt),
    showDate: Boolean(form.showDate),
  };
}

/**
 * Saves a story, creating it when `originalSlug` is null.
 *
 * Renaming a draft's address writes the story under the new slug and deletes
 * the old document in one transaction; a slug already in use is refused rather
 * than overwritten. Status changes go through setStoryStatus.
 */
export async function saveStory({ originalSlug, slug, form, status }) {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error('The web address may use only lowercase letters, numbers and hyphens.');
  }
  const fields = storyFields(form);

  if (originalSlug === slug) {
    await updateDoc(doc(db, NEWS, slug), { ...fields, ...editorStamp() });
    return slug;
  }

  await runTransaction(db, async (tx) => {
    const target = doc(db, NEWS, slug);
    if ((await tx.get(target)).exists()) {
      throw new Error(`Another story already uses the address /news/${slug}.`);
    }
    let carried = {};
    if (originalSlug) {
      const previous = await tx.get(doc(db, NEWS, originalSlug));
      if (isSlugLocked(previous.data())) {
        throw new Error('This story has been published, so its web address can no longer change.');
      }
      const { createdAt, featured, eventSlug } = previous.data();
      carried = { createdAt, featured, eventSlug };
      tx.delete(previous.ref);
    }
    tx.set(target, {
      featured: false,
      eventSlug: null,
      webflowId: null,
      firstPublishedAt: status === 'published' ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
      ...carried,
      ...fields,
      slug,
      status: status || 'draft',
      ...editorStamp(),
    });
  });
  return slug;
}

/** Publishes or unpublishes. The first publish is recorded, which locks the slug. */
export async function setStoryStatus(story, status) {
  const patch = { status, ...editorStamp() };
  if (status === 'published' && !story.firstPublishedAt) {
    patch.firstPublishedAt = serverTimestamp();
  }
  await updateDoc(doc(db, NEWS, story.slug), patch);
}

export async function deleteStory(slug) {
  await deleteDoc(doc(db, NEWS, slug));
}

/** Matches the news/ size cap in storage.rules. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Uploads an image for a story and returns its public URL. Files land under
 * news/<slug>/, the only place storage.rules lets the site write.
 */
export async function uploadNewsImage(slug, file) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file (JPG, PNG, WebP or GIF).');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('That image is over 10 MB. Please use a smaller version.');
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const objectRef = ref(storage, `news/${slug}/${Date.now()}-${safeName}`);
  await uploadBytes(objectRef, file, { contentType: file.type });
  return getDownloadURL(objectRef);
}
