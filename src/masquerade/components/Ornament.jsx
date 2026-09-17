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

/**
 * Ornate skeleton key, lying horizontally as it does on the organizer's title
 * card: toothed bit at the left, quatrefoil bow at the right. Stroke-drawn, so
 * it takes its weight from the surrounding type rather than reading as a solid
 * blob at small sizes.
 */
export function Key({ className = 'w-20 h-7' }) {
  return (
    <svg
      viewBox="0 0 96 32"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="17" cy="16" r="3.2" />
      <path d="M21 16h39" />
      <path d="M24 16.6v7.4M30 16.6v5.6M36 16.6v3.8" />
      <path d="M60 11.6v8.8M63.6 13.2v5.6" />
      <circle cx="76" cy="10.8" r="4.6" />
      <circle cx="76" cy="21.2" r="4.6" />
      <circle cx="70.8" cy="16" r="4.6" />
      <circle cx="81.2" cy="16" r="4.6" />
      <circle cx="76" cy="16" r="2.3" />
    </svg>
  );
}

/** Keyhole set in an arched cartouche, double-ruled as on the title card. */
export function Keyhole({ className = 'w-8 h-12' }) {
  return (
    <svg
      viewBox="0 0 48 72"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    >
      <path d="M5 68V21C5 11 13 4 24 4s19 7 19 17v47Z" />
      <path d="M9.5 63.5V21c0-7.6 6-12.5 14.5-12.5S38.5 13.4 38.5 21v42.5Z" />
      <circle cx="24" cy="29" r="5.4" />
      <path d="M20.4 33.2 17.8 50h12.4l-2.6-16.8Z" />
    </svg>
  );
}

/**
 * A thin gold rule with an ornament at its centre, used between sections.
 * `variant` picks the centrepiece: a card suit by default, or the key / keyhole
 * from the title card.
 */
export default function Ornament({ variant = 'suit', suit = 'diamond', className = '' }) {
  const centre =
    variant === 'key' ? (
      <Key className="w-16 h-6 sm:w-20 sm:h-7 text-[var(--masq-gold)]" />
    ) : variant === 'keyhole' ? (
      <Keyhole className="w-5 h-8 text-[var(--masq-gold)]" />
    ) : (
      <Suit suit={suit} className="w-3 h-3 text-[var(--masq-gold)]" />
    );

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden="true">
      <span className="masq-rule w-16 sm:w-28" />
      {centre}
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
