import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

// Webflow writes this as the alt text of images whose alt it inherits from the
// asset; read aloud it is noise, so it becomes decorative.
const WEBFLOW_PLACEHOLDER_ALT = '__wf_reserved_inherit';

// One purifier for article HTML, so its hooks never leak into another caller
// of the shared DOMPurify instance.
const purifier = DOMPurify();

purifier.addHook('afterSanitizeAttributes', (node) => {
  // Webflow video figures wrap an iframe, which is stripped. Without it the
  // figure's inline padding leaves a blank box, so a link to the video stands
  // in, or the figure goes if it names no web address.
  if (node.tagName === 'FIGURE' && node.getAttribute('data-rt-type') === 'video') {
    const url = node.getAttribute('data-page-url') || '';
    if (!/^https?:\/\//i.test(url)) {
      node.remove();
      return;
    }
    const link = node.ownerDocument.createElement('a');
    link.setAttribute('href', url);
    link.textContent = 'Watch the video';
    node.removeAttribute('style');
    node.replaceChildren(link);
    return;
  }
  if (node.tagName === 'IMG' && node.getAttribute('alt') === WEBFLOW_PLACEHOLDER_ALT) {
    node.setAttribute('alt', '');
  }
  // Links off the site open in a new tab, without handing it window.opener.
  if (node.tagName === 'A' && /^https?:\/\//i.test(node.getAttribute('href') || '')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * Renders stored rich text (article bodies, business descriptions and hours)
 * as HTML.
 *
 * Bodies come from the Webflow export today and from the admin editor later;
 * either can carry markup pasted from elsewhere, so every render is sanitized.
 * Scripts and embeds are stripped. The Ticket Tailor embed in the banner story,
 * for one, falls back to the plain checkout link it ships with.
 */
export default function RichText({ html, className = '' }) {
  const clean = useMemo(
    () => purifier.sanitize(html || '', { ADD_ATTR: ['target'] }),
    [html]
  );

  if (!clean.trim()) return null;

  return (
    <div
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
