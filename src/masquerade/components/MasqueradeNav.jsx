import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Suit } from './Ornament';
import { event } from '../data/eventDetails';

const links = [
  { href: '#invitation', label: 'The Invitation' },
  { href: '#tickets', label: 'Tickets' },
  { href: '#schedule', label: 'The Evening' },
  { href: '#gallery', label: 'Past Years' },
  { href: '#sponsors', label: 'Sponsors' },
  { href: '#faq', label: 'Know Before You Go' },
];

export default function MasqueradeNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // The bar stays invisible over the hero, then fades in a backdrop once
    // the title has scrolled away.
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[rgba(11,10,12,0.95)] backdrop-blur-md border-b border-[var(--masq-line)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-20 flex items-center justify-between gap-6">
          <a href="#top" className="flex items-center gap-2.5 shrink-0 group">
            <Suit suit="heart" className="w-4 h-4 text-[var(--masq-crimson-bright)] transition-transform group-hover:scale-110" />
            <span className="masq-display text-sm sm:text-base tracking-wider text-[var(--masq-cream)]">
              The Masquerade
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-[0.95rem]">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="masq-link text-[var(--masq-cream-dim)] hover:text-[var(--masq-cream)] transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#tickets"
              className="hidden sm:inline-flex items-center px-5 py-2.5 rounded-sm bg-[var(--masq-crimson)] hover:bg-[var(--masq-crimson-bright)] text-[var(--masq-cream)] text-xs font-semibold uppercase tracking-[0.2em] transition-colors"
            >
              Tickets
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="lg:hidden p-2 text-[var(--masq-cream)]"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-[var(--masq-line)] bg-[rgba(11,10,12,0.98)] backdrop-blur-md">
          <div className="px-4 sm:px-6 py-4 flex flex-col">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-3 border-b border-[var(--masq-line)] last:border-0 text-[var(--masq-cream-dim)] hover:text-[var(--masq-cream)] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#tickets"
              onClick={() => setOpen(false)}
              className="mt-4 text-center px-5 py-3 rounded-sm bg-[var(--masq-crimson)] text-[var(--masq-cream)] text-xs font-semibold uppercase tracking-[0.2em]"
            >
              {event.dateShort} — Tickets
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
