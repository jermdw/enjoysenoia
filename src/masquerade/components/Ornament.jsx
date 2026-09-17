import React from 'react';

/**
 * Card-suit ornaments drawn inline so the site has its motif without waiting
 * on artwork files. Sizes are set by the caller via className.
 */
export function Suit({ suit = 'heart', className = 'w-4 h-4' }) {
  const paths = {
    heart: 'M12 21s-7.5-4.7-9.6-9A5.4 5.4 0 0 1 12 6.6 5.4 5.4 0 0 1 21.6 12c-2.1 4.3-9.6 9-9.6 9Z',
    spade: 'M12 2c2.4 3.6 8 6.4 8 10.4a4.3 4.3 0 0 1-6.9 3.5c.2 2 .9 3.4 2.4 4.6H8.5c1.5-1.2 2.2-2.6 2.4-4.6A4.3 4.3 0 0 1 4 12.4C4 8.4 9.6 5.6 12 2Z',
    club: 'M12 2.8a3.7 3.7 0 0 1 3.1 5.7 3.8 3.8 0 1 1 1.5 7.2 3.8 3.8 0 0 1-3-1.5c.1 2.1.8 3.6 2.4 4.9H8c1.6-1.3 2.3-2.8 2.4-4.9a3.8 3.8 0 0 1-3 1.5 3.8 3.8 0 1 1 1.5-7.2A3.7 3.7 0 0 1 12 2.8Z',
    diamond: 'M12 2 20 12l-8 10-8-10 8-10Z',
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d={paths[suit] || paths.heart} />
    </svg>
  );
}

/** A thin gold rule with a suit at its center, used between sections. */
export default function Ornament({ suit = 'diamond', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden="true">
      <span className="masq-rule w-16 sm:w-28" />
      <Suit suit={suit} className="w-3 h-3 text-[var(--masq-gold)]" />
      <span className="masq-rule w-16 sm:w-28" />
    </div>
  );
}

/** Section heading: eyebrow, title, optional lead paragraph. */
export function SectionHeading({ eyebrow, title, lead, align = 'center' }) {
  const alignment = align === 'left' ? 'text-left items-start' : 'text-center items-center';
  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      {eyebrow && <span className="masq-eyebrow">{eyebrow}</span>}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[var(--masq-cream)]">{title}</h2>
      {lead && (
        <p className="max-w-2xl text-lg sm:text-xl text-[var(--masq-cream-dim)] leading-relaxed">
          {lead}
        </p>
      )}
    </div>
  );
}
