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

export const getPageContent = (path) => {
  return pagesData[path] || null;
};

export const getBusinessBySlug = (slug) => {
  return businessesData.find(b => b.slug === slug) || null;
};

export const getEventBySlug = (slug) => {
  return eventsData.find(e => e.link && e.link.includes(slug)) || null;
};
