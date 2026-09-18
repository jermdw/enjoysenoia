import eventsData from '../../data/events.json';
import businessesData from '../../data/businesses_detail.json';
import newsData from '../../data/news.json';
import pagesData from '../../data/pages.json';

// Local dataset getters with fallback and filtering helpers
export const getEvents = () => {
  return eventsData.filter(e => e.title && e.title !== "Upcoming Events");
};

export const getBusinesses = () => {
  return businessesData;
};

export const getNews = () => {
  return newsData;
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
  // event whose link merely contained it.
  return getEvents().find(e => getEventSlug(e) === slug) || null;
};
