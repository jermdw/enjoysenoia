import { useEffect } from 'react';

const SITE_ORIGIN = 'https://www.enjoysenoia.com';
const DEFAULT_TITLE = 'Enjoy Senoia | Senoia Downtown Development Authority';
const DEFAULT_DESCRIPTION =
  'The mission of the Senoia DDA is to revitalize, enhance, promote, and stimulate the economic development of Senoia while maintaining its historical integrity and charm.';
// Same file index.html's static og:image points at (public/og-image.png).
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

// Open Graph / Twitter tags need absolute URLs.
const absolute = (url) => (url.startsWith('/') ? `${SITE_ORIGIN}${url}` : url);

// Updates the tag index.html ships statically, creating it if it is missing
// (the Halloween/Masquerade SEO components remove tags they created, not ours).
function setMeta(attr, key, value) {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
}

export default function SEO({ title, description, ogImage }) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | Enjoy Senoia | Senoia DDA`
      : DEFAULT_TITLE;
    const fullDescription = description || DEFAULT_DESCRIPTION;
    const image = ogImage ? absolute(ogImage) : DEFAULT_OG_IMAGE;

    document.title = fullTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', fullDescription);
    }

    // Social tags. Crawlers that don't run JavaScript only see the static
    // copies in index.html; these keep the ones that do (Google) in step with
    // the page. og:image is reset to the site default when a page has none, so
    // a previous page's image never lingers.
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', fullDescription);
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', fullDescription);
    setMeta('name', 'twitter:image', image);

    // Scroll to top on page navigation
    window.scrollTo(0, 0);
  }, [title, description, ogImage]);

  return null;
}
