import React from 'react';
import { Suit } from './Ornament';
import { thankYou } from '../data/eventDetails';

function CreditList({ title, items }) {
  return (
    <div>
      <h3 className="text-xl sm:text-2xl text-[var(--masq-gold)]">{title}</h3>
      <ul className="mt-5 space-y-2.5">
        {items.map((item) => (
          <li key={item.name} className="text-lg text-[var(--masq-cream-dim)] leading-snug">
            <a
              href={item.url}
              {...(item.url.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              className="masq-link"
            >
              {item.name}
            </a>
            {item.role && <span> ({item.role})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Post-event credits, in the order the organizer listed them. */
export default function ThankYou() {
  return (
    <section id="thanks" className="py-24 sm:py-32 bg-[var(--masq-ink-soft)] scroll-mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl text-[var(--masq-cream)]">
          Please be sure to thank &amp; visit our sponsors
        </h2>

        <img
          src={thankYou.sponsorLogos}
          alt={`Sponsor and Friends of Wonderland logos: ${[...thankYou.sponsors, ...thankYou.friends].map((s) => s.name).join(', ')}`}
          width="973"
          height="1544"
          className="mt-12 w-full max-w-md mx-auto h-auto rounded-sm"
          loading="lazy"
        />

        <ul className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3">
          {thankYou.sponsors.map((sponsor) => (
            <li key={sponsor.name} className="text-lg">
              <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="masq-link">
                {sponsor.name}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-20 grid gap-14 md:grid-cols-2 md:gap-10">
          <CreditList title="And our friends of Wonderland" items={thankYou.friends} />
          <CreditList title="Special thanks to" items={thankYou.specialThanks} />
        </div>

        <p className="mt-20 max-w-2xl mx-auto text-lg sm:text-xl text-[var(--masq-cream-dim)] leading-relaxed">
          {thankYou.hosts.before}{' '}
          <a href={thankYou.hosts.url} target="_blank" rel="noopener noreferrer" className="masq-link">
            {thankYou.hosts.name}
          </a>
          {thankYou.hosts.after}
        </p>

        <div className="mt-14 flex items-center justify-center gap-4" aria-hidden="true">
          <Suit suit="heart" className="w-4 h-4 text-[var(--masq-crimson-bright)]" />
          <Suit suit="spade" className="w-4 h-4 text-[var(--masq-gold)]" />
        </div>
        <p className="mt-6 masq-display text-2xl sm:text-3xl text-[var(--masq-cream)]">{thankYou.signOff}</p>
      </div>
    </section>
  );
}
