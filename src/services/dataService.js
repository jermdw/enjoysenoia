// Events and businesses are built from the Webflow CMS by
// scripts/webflow_transform.py (regenerate rather than editing by hand), then
// staff edits stored in Firestore are merged over them at runtime:
//
//   events/{slug}, businesses/{slug}
//     slug matches a built-in item -> a patch: present fields replace the
//                                     built-in ones; hidden:true removes it
//     slug matches nothing         -> a new item added by staff
//
// The site never depends on Firestore to render. Everything below works on
// the built-in data alone and the merge applies when (and if) the overrides
// arrive; they are fetched once, lazily, and kept in sessionStorage so later
// page loads apply them immediately. News is not here: it lives in Firestore
// proper (see services/newsService.js).
import { useEffect, useSyncExternalStore } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import eventsData from '../../data/site/events.json';
import businessesData from '../../data/site/businesses.json';
import galleriesData from '../../data/site/galleries.json';
import { db } from './firebase';

export const EVENTS_COLLECTION = 'events';
export const BUSINESSES_COLLECTION = 'businesses';

/* ------------------------------------------------------------------ *
 * Overrides store
 * ------------------------------------------------------------------ */

const CACHE_KEY = 'enjoysenoia:content-overrides:v1';
const FETCH_TIMEOUT_MS = 4000;

// Plain-data fields only (no Firestore timestamps), so the cache is JSON-safe.
const CONTENT_FIELDS = {
  events: ['title', 'date_time', 'start', 'end', 'location', 'description', 'image', 'external_url', 'category', 'hidden'],
  businesses: ['name', 'category', 'summary', 'description_html', 'hours_html', 'phone', 'email', 'website', 'facebook', 'instagram', 'address', 'image', 'hidden'],
};

const pick = (data, fields) => {
  const out = {};
  fields.forEach((f) => {
    if (data[f] !== undefined && data[f] !== null) out[f] = data[f];
  });
  return out;
};

function readCache() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    if (parsed && typeof parsed.events === 'object' && typeof parsed.businesses === 'object') return parsed;
  } catch {
    // Storage blocked or unparsable: behave as if there were no cache.
  }
  return null;
}

function writeCache(value) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // Private mode or quota: the cache is only an optimisation.
  }
}

const cached = readCache();
let overrides = cached || { events: {}, businesses: {} };
// 'loading' until the first fetch settles, or immediately when a cached copy
// is already applied. A failed fetch settles too, as 'ready' on built-in data.
let status = cached ? 'ready' : 'loading';
let version = 0;
let loadPromise = null;
const listeners = new Set();

const notify = () => {
  version += 1;
  listeners.forEach((l) => l());
};

async function fetchCollection(name) {
  const snap = await getDocs(collection(db, name));
  // Offline, getDocs answers from an empty local cache instead of failing; that
  // must not read as "staff have no edits".
  if (snap.empty && snap.metadata.fromCache) throw new Error(`${name} could not be reached`);
  const out = {};
  snap.docs.forEach((d) => {
    out[d.id] = { ...pick(d.data(), CONTENT_FIELDS[name]), slug: d.id };
  });
  return out;
}

const settle = () => {
  if (status !== 'ready') {
    status = 'ready';
    notify();
  }
};

/**
 * Fetches the staff overrides once per page load (call again with
 * { force: true } after saving). Never rejects: on any failure the site stays
 * on built-in data (plus any cached copy).
 */
export function loadOverrides({ force = false } = {}) {
  if (loadPromise && !force) return loadPromise;
  const fetched = Promise.all([fetchCollection(EVENTS_COLLECTION), fetchCollection(BUSINESSES_COLLECTION)])
    .then(([events, businesses]) => {
      overrides = { events, businesses };
      writeCache(overrides);
      status = 'ready';
      notify();
      return true;
    })
    .catch((err) => {
      console.warn('Could not load staff edits; showing the built-in listings:', err);
      settle();
      return false;
    });
  // Do not hold detail pages on a slow network: after the timeout they render
  // the built-in data, and a late response still applies through `fetched`.
  const timeout = new Promise((resolve) => setTimeout(resolve, FETCH_TIMEOUT_MS)).then(settle);
  loadPromise = Promise.race([fetched, timeout]).then(() => fetched);
  return loadPromise;
}

/**
 * Subscribes a component to the merged data. Call it once at the top of any
 * component that uses the getters below; it triggers the lazy load and
 * re-renders when the overrides land. `ready` is false only until the first
 * attempt settles, which detail pages use to avoid flashing a built-in item
 * that staff have hidden (or a "not found" for one staff have added).
 */
export function useContentOverrides() {
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => version,
    () => version
  );
  useEffect(() => {
    loadOverrides();
  }, []);
  return { ready: status === 'ready' };
}

/* ------------------------------------------------------------------ *
 * Merge
 * ------------------------------------------------------------------ */

// An event stays upcoming until it ends; recurring events always are.
// Decided at runtime so the split never goes stale between data rebuilds.
const isUpcoming = (event, now = new Date()) => {
  if (event.is_recurring) return true;
  const last = event.end || event.start;
  return !last || new Date(last) >= now;
};

/**
 * The slug an event is linked and looked up by. Events carry a `/events/<slug>`
 * link; anything without one falls back to its title, so a list link and the
 * detail lookup always agree. Index-based slugs could never be resolved.
 */
export const getEventSlug = (event) => {
  if (event?.link?.startsWith('/events/')) return event.link.replace('/events/', '');
  return String(event?.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const slugOf = (event) => event.slug || getEventSlug(event);

// Memoised per overrides version so list pages get a stable array reference.
let mergedFor = -1;
let mergedEvents = [];
let mergedBusinesses = [];

function merge(builtIn, slugFor, isComplete, makeNew, patches) {
  const seen = new Set();
  const items = builtIn.map((item) => {
    const slug = slugFor(item);
    seen.add(slug);
    const patch = patches[slug];
    if (!patch) return { ...item, _builtIn: true };
    // The address of a built-in item never changes.
    return { ...item, ...patch, slug: item.slug, link: item.link, path: item.path, _builtIn: true, _overridden: true };
  });
  Object.entries(patches).forEach(([slug, patch]) => {
    // A document matching nothing built in is a staff-added item; one without
    // the fields an item needs is an orphaned patch and is ignored.
    if (seen.has(slug) || !isComplete(patch)) return;
    items.push({ ...makeNew(slug, patch), _builtIn: false, _overridden: true });
  });
  return items;
}

function ensureMerged() {
  if (mergedFor === version) return;
  mergedEvents = merge(
    eventsData,
    slugOf,
    (p) => p.title && p.start,
    (slug, patch) => ({ is_recurring: false, is_active: true, ...patch, slug, link: `/events/${slug}` }),
    overrides.events || {}
  );
  mergedBusinesses = merge(
    businessesData,
    (b) => b.slug,
    (p) => p.name,
    (slug, patch) => ({ ...patch, slug, path: `/downtown-business/${slug}` }),
    overrides.businesses || {}
  );
  mergedFor = version;
}

const visible = (item) => !item.hidden;
const byStart = (a, b) => new Date(a.start || 0) - new Date(b.start || 0);

/** Everything, hidden items included, with `_builtIn` / `_overridden` flags; for the admin portal. */
export const getAllEventsForAdmin = () => {
  ensureMerged();
  return mergedEvents;
};

export const getAllBusinessesForAdmin = () => {
  ensureMerged();
  return mergedBusinesses;
};

/** An item as built, ignoring staff edits (to diff a form against, and to reset to). */
export const getBuiltInEvent = (slug) => eventsData.find((e) => slugOf(e) === slug) || null;
export const getBuiltInBusiness = (slug) => businessesData.find((b) => b.slug === slug) || null;

export const getEvents = () => {
  ensureMerged();
  const upcoming = mergedEvents.filter((e) => visible(e) && isUpcoming(e));
  // Built-in data is already in start order; sort only when staff added events.
  return upcoming.some((e) => !e._builtIn) ? [...upcoming].sort(byStart) : upcoming;
};

export const getPastEvents = () => {
  ensureMerged();
  const past = mergedEvents.filter((e) => visible(e) && !isUpcoming(e));
  return past.some((e) => !e._builtIn) ? [...past].sort(byStart).reverse() : past.reverse();
};

export const getBusinesses = () => {
  ensureMerged();
  return mergedBusinesses.filter(visible);
};

export const getBusinessBySlug = (slug) => {
  ensureMerged();
  return mergedBusinesses.find((b) => b.slug === slug && visible(b)) || null;
};

export const getEventBySlug = (slug) => {
  if (!slug) return null;
  ensureMerged();
  // Exact match: `includes` previously let a short slug resolve to a different
  // event whose link merely contained it. Searches past events too, so recap
  // links from /past-events resolve. Hidden events read as missing.
  return mergedEvents.find((e) => slugOf(e) === slug && visible(e)) || null;
};

// The /news listing shows stories from Firestore followed by these photo
// galleries. Galleries link to /photo-galleries/..., not /news/..., so pages
// use isNewsArticle to keep them out of the news routes.
export const isNewsArticle = (item) => Boolean(item?.link?.startsWith('/news/'));

export const getPhotoGalleryItems = () => {
  return galleriesData;
};
