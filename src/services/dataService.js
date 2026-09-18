// Built from the Webflow CMS by scripts/webflow_transform.py - regenerate
// rather than editing by hand.
import eventsData from '../../data/site/events.json';
import businessesData from '../../data/site/businesses.json';
import newsData from '../../data/site/news.json';
import pagesData from '../../data/pages.json';

// An event stays upcoming until it ends; recurring events always are.
// Decided at runtime so the split never goes stale between data rebuilds.
const isUpcoming = (event, now = new Date()) => {
  if (event.is_recurring) return true;
  const last = event.end || event.start;
  return !last || new Date(last) >= now;
};

// Local dataset getters with fallback and filtering helpers
export const getEvents = () => {
  return eventsData.filter((e) => isUpcoming(e));
};

export const getPastEvents = () => {
  return eventsData.filter((e) => !isUpcoming(e)).reverse();
};

export const getBusinesses = () => {
  return businessesData;
};

export const getNews = () => {
  return newsData.filter((n) => !n.merchants_only);
};

// Some records in news.json are legacy photo galleries whose links point at
// /photo-galleries/..., not /news/.... Mixing them into the news routes
// produced URLs like /news//photo-galleries/<slug>.
export const isNewsArticle = (item) => Boolean(item?.link?.startsWith('/news/'));

export const getNewsArticles = () => {
  return newsData.filter(isNewsArticle);
};

export const getPhotoGalleryItems = () => {
  return newsData.filter((item) => !isNewsArticle(item));
};

export const getPageContent = (path) => {
  return pagesData[path] || null;
};

export const getBusinessBySlug = (slug) => {
  return businessesData.find(b => b.slug === slug) || null;
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

export const getEventBySlug = (slug) => {
  if (!slug) return null;
  // Exact match: `includes` previously let a short slug resolve to a different
  // event whose link merely contained it. Searches past events too, so recap
  // links from /past-events resolve.
  return eventsData.find(e => getEventSlug(e) === slug) || null;
};
