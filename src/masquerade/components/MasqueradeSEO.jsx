import { useEffect } from 'react';
import { event, seo } from '../data/eventDetails';

/**
 * The micro-site carries its own branding, so it can't use the shared SEO
 * component (that one appends "| Enjoy Senoia | Senoia DDA" to every title).
 * This sets the document head for the masquerade and restores the DDA defaults
 * on unmount, so navigating back to the main site leaves no trace.
 */
export default function MasqueradeSEO() {
  useEffect(() => {
    const previousTitle = document.title;
    const descTag = document.querySelector('meta[name="description"]');
    const previousDesc = descTag?.getAttribute('content');

    document.title = seo.title;
    descTag?.setAttribute('content', seo.description);

    // Open Graph / Twitter tags aren't in index.html, so create them on mount.
    const created = [];
    const setMeta = (attr, key, value) => {
      if (!value) return;
      let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
        created.push(tag);
      }
      tag.setAttribute('content', value);
    };

    setMeta('property', 'og:title', seo.title);
    setMeta('property', 'og:description', seo.description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', seo.url);
    setMeta('property', 'og:image', seo.ogImage);
    setMeta('name', 'twitter:card', seo.ogImage ? 'summary_large_image' : 'summary');

    // Only one canonical may exist, so reuse the DDA one if index.html has it.
    let canonical = document.head.querySelector('link[rel="canonical"]');
    const previousCanonical = canonical?.getAttribute('href');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
      created.push(canonical);
    }
    canonical.href = seo.url;

    // Structured data helps the event surface in search and social previews.
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: `${event.name}: ${event.theme}`,
      url: seo.url,
      startDate: `${event.dateISO}T17:30:00-04:00`,
      endDate: `${event.dateISO}T23:30:00-04:00`,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      description: seo.description,
      location: {
        '@type': 'Place',
        name: event.venue.name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Senoia',
          addressRegion: 'GA',
          addressCountry: 'US',
        },
      },
      organizer: {
        '@type': 'Organization',
        name: 'Senoia Downtown Development Authority',
        url: 'https://enjoysenoia.com',
      },
    });
    document.head.appendChild(ld);

    window.scrollTo(0, 0);

    return () => {
      document.title = previousTitle;
      // An empty previous description is still a value to restore; only a
      // missing attribute should be removed.
      if (previousDesc === null || previousDesc === undefined) {
        descTag?.removeAttribute('content');
      } else {
        descTag?.setAttribute('content', previousDesc);
      }
      if (previousCanonical) canonical.setAttribute('href', previousCanonical);
      created.forEach((tag) => tag.remove());
      ld.remove();
    };
  }, []);

  return null;
}
