/**
 * Admin-only writes for staff edits to events and the business directory.
 *
 * Documents live in `events/{slug}` and `businesses/{slug}` and are merged over
 * the built-in data by dataService.js. See firestore.rules for the shape each
 * must have; the rules, not this file, are the enforcement point.
 *
 *   - built-in item   -> the document is a patch holding only changed fields
 *   - staff-added     -> the document is the whole item
 *
 * Every save ends by reloading the overrides so the portal (and the cached
 * copy a visitor on this browser would get) reflects it straight away.
 */
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  BUSINESSES_COLLECTION,
  EVENTS_COLLECTION,
  getAllBusinessesForAdmin,
  getAllEventsForAdmin,
  getBuiltInBusiness,
  getBuiltInEvent,
  loadOverrides,
} from './dataService';
import { SLUG_PATTERN, slugify } from './newsService';

export { SLUG_PATTERN, slugify };

export const KINDS = {
  event: {
    collection: EVENTS_COLLECTION,
    builtIn: getBuiltInEvent,
    all: getAllEventsForAdmin,
    // Fields staff can change; a patch holds a subset of these.
    fields: ['title', 'date_time', 'start', 'end', 'location', 'description', 'image', 'external_url', 'category'],
    label: 'event',
  },
  business: {
    collection: BUSINESSES_COLLECTION,
    builtIn: getBuiltInBusiness,
    all: getAllBusinessesForAdmin,
    fields: ['name', 'category', 'summary', 'description_html', 'hours_html', 'phone', 'email', 'website', 'facebook', 'instagram', 'address', 'image'],
    label: 'business',
  },
};

const stamp = () => ({ updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.email || null });
const norm = (v) => (v == null ? '' : String(v).trim());

/** True when a document holds anything beyond slug/hidden/bookkeeping. */
export function hasContentEdits(kind, item) {
  const builtIn = KINDS[kind].builtIn(item.slug);
  if (!builtIn) return true;
  return KINDS[kind].fields.some((f) => norm(item[f]) !== norm(builtIn[f]));
}

/** Slugs already taken, by built-in items and by staff additions alike. */
export function slugInUse(kind, slug) {
  return KINDS[kind].all().some((item) => item.slug === slug);
}

/**
 * Saves the fields of an item. For a built-in item only the fields that differ
 * from the built-in value are stored (so "edited" means something and a reset
 * is just deleting the document); for a new item everything non-empty is.
 */
export async function saveItem(kind, { slug, values, hidden = false }) {
  const k = KINDS[kind];
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error('The web address may use only lowercase letters, numbers and hyphens.');
  }
  const builtIn = k.builtIn(slug);
  const data = { slug, hidden: Boolean(hidden) };
  k.fields.forEach((f) => {
    const value = norm(values[f]);
    if (builtIn) {
      if (value !== norm(builtIn[f])) data[f] = value;
    } else if (value) {
      data[f] = value;
    }
  });
  if (!builtIn) {
    const title = kind === 'event' ? data.title : data.name;
    if (!title) throw new Error(`A ${k.label} needs a ${kind === 'event' ? 'title' : 'name'}.`);
    if (kind === 'event' && !data.start) throw new Error('An event needs a start date.');
  }
  // Plain replace: a field the editor put back to its built-in value drops out.
  await setDoc(doc(db, k.collection, slug), { ...data, ...stamp() });
  await loadOverrides({ force: true });
}

/**
 * Hides or shows an item. Showing a built-in item that carries no other edits
 * deletes its document, returning it to a pristine, un-overridden state.
 */
export async function setHidden(kind, item, hidden) {
  const k = KINDS[kind];
  const ref = doc(db, k.collection, item.slug);
  if (!hidden && k.builtIn(item.slug) && !hasContentEdits(kind, item)) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { slug: item.slug, hidden, ...stamp() }, { merge: true });
  }
  await loadOverrides({ force: true });
}

/** Deletes the document: restores a built-in item, or removes a staff-added one for good. */
export async function removeOverride(kind, slug) {
  await deleteDoc(doc(db, KINDS[kind].collection, slug));
  await loadOverrides({ force: true });
}

/* ------------------------------------------------------------------ *
 * Form helpers
 * ------------------------------------------------------------------ */

const pad = (n) => String(n).padStart(2, '0');

/** ISO string -> value for <input type="datetime-local"> in the browser's zone. */
export function toDateTimeInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value -> ISO string (UTC), or '' when blank. */
export function fromDateTimeInput(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

const LONG_DAY = { month: 'long', day: 'numeric', year: 'numeric' };

/**
 * The text shown on the site ("October 15, 2026 5:00 PM"), the style the
 * built-in events use. A multi-day event reads "start – last day".
 */
export function displayDateTime(startInput, endInput) {
  if (!startInput) return '';
  const start = new Date(startInput);
  if (Number.isNaN(start.getTime())) return '';
  const time = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  let text = `${start.toLocaleDateString('en-US', LONG_DAY)} ${time}`;
  const end = endInput ? new Date(endInput) : null;
  if (end && !Number.isNaN(end.getTime()) && end.toDateString() !== start.toDateString()) {
    text += ` – ${end.toLocaleDateString('en-US', LONG_DAY)}`;
  }
  return text;
}

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Plain text (blank lines between paragraphs) -> simple paragraph HTML. */
export function textToHtml(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Stored HTML -> plain text for a textarea (paragraph breaks kept). */
export function htmlToText(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(
    String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h[1-6])>/gi, '</$1>\n\n'),
    'text/html'
  );
  return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}
