import { useEffect } from 'react';

export default function SEO({ title, description, ogImage }) {
  useEffect(() => {
    const fullTitle = title 
      ? `${title} | Enjoy Senoia | Senoia DDA`
      : 'Enjoy Senoia | Senoia Downtown Development Authority';
    
    document.title = fullTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description || 'The mission of the Senoia DDA is to revitalize, enhance, promote, and stimulate the economic development of Senoia while maintaining its historical integrity and charm.');
    }

    // Scroll to top on page navigation
    window.scrollTo(0, 0);
  }, [title, description, ogImage]);

  return null;
}
