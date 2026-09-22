import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

/**
 * In-page nav for the five sections in the brief. Anchors rather than routes:
 * the whole site is one page, so every destination is a scroll.
 */
const LINKS = [
  { href: '#calendar', label: 'October' },
  { href: '#contest', label: 'Decorating Contest' },
  { href: '#masquerade', label: 'Masquerade Ball' },
  { href: '#toddler', label: 'Toddler Trick or Treat' },
  { href: '#trick-or-treating', label: 'Trick or Treating' },
];

export default function HalloweenNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="hallo-nav">
      <nav className="hallo-nav-inner" aria-label="Senoia Halloween sections">
        <a href="#top" className="hallo-display hallo-nav-brand">
          Senoia Halloween
        </a>

        <button
          type="button"
          className="hallo-btn hallo-btn-ghost hallo-nav-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="hallo-nav-links"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>

        <ul id="hallo-nav-links" className="hallo-nav-links" data-open={open ? 'true' : 'false'}>
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
