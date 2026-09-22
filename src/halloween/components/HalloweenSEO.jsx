import { useEffect } from 'react';
import { seo } from '../data/halloweenDetails';

/**
 * Document head for the Halloween micro-site.
 *
 * Same shape as MasqueradeSEO: the shared SEO component appends
 * "| Enjoy Senoia | Senoia DDA" to every title, which is wrong for a site that
 * carries its own brand. Restores the DDA defaults on unmount so navigating
 * back from /halloween leaves no trace.
 */
export default function HalloweenSEO() {
  useEffect(() => {
    const previousTitle = document.title;
    const descTag = document.querySelector('meta[name="description"]');
    const previousDesc = descTag?.getAttribute('content');

    document.title = seo.title;
    descTag?.setAttribute('content', seo.description);

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

    let canonical = document.head.querySelector('link[rel="canonical"]');
    const previousCanonical = canonical?.getAttribute('href');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
      created.push(canonical);
    }
    canonical.href = seo.url;

    window.scrollTo(0, 0);

    return () => {
      document.title = previousTitle;
      if (previousDesc === null || previousDesc === undefined) {
        descTag?.removeAttribute('content');
      } else {
        descTag?.setAttribute('content', previousDesc);
      }
      if (previousCanonical) canonical.setAttribute('href', previousCanonical);
      created.forEach((tag) => tag.remove());
    };
  }, []);

  return null;
}
