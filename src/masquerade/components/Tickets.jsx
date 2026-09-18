import React from 'react';
import { Check, ExternalLink, Ticket as TicketIcon } from 'lucide-react';
import Ornament, { SectionHeading } from './Ornament';
import { tiers, ticketing } from '../data/eventDetails';

/**
 * Tiers sell on different rules — dinner closes October 20, the after party is
 * also sold at the door, and a sold-out tier points at the follow block — so
 * button state is per tier rather than one site-wide flag.
 */
function TierAction({ tier }) {
  const base =
    'w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm text-xs font-semibold uppercase tracking-[0.2em] transition-all';

  if (tier.status === 'waitlist') {
    return (
      <a href="#follow" className={`${base} border border-[var(--masq-gold)] text-[var(--masq-gold)] hover:bg-[var(--masq-gold)] hover:text-[var(--masq-ink)]`}>
        Follow for updates
      </a>
    );
  }

  if (tier.status === 'closed') {
    return (
      <span className={`${base} border border-[var(--masq-line)] text-[var(--masq-cream-dim)] cursor-not-allowed`}>
        Sales closed
      </span>
    );
  }

  // Without a checkout URL the button can't go anywhere — say so plainly
  // rather than shipping a dead link.
  if (!ticketing.url) {
    return (
      <span className={`${base} border border-dashed border-[var(--masq-line)] text-[var(--masq-cream-dim)]`}>
        Tickets open soon
      </span>
    );
  }

  return (
    <a
      href={ticketing.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${
        tier.featured
          ? 'bg-[var(--masq-crimson)] hover:bg-[var(--masq-crimson-bright)] text-[var(--masq-cream)]'
          : 'border border-[var(--masq-line)] hover:border-[var(--masq-gold)] text-[var(--masq-cream)]'
      } hover:scale-[1.02]`}
    >
      <TicketIcon className="w-4 h-4" />
      <span>Buy {tier.name}</span>
      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
    </a>
  );
}

export default function Tickets() {
  return (
    <section id="tickets" className="py-24 sm:py-32 bg-[var(--masq-ink-soft)] scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Admission"
          title="Choose Your Hour"
          lead="Three ways into Wonderland. Every ticket ends at the same after party."
        />

        <div className="mt-14 grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {tiers.map((tier) => (
            <article
              key={tier.id}
              className={`relative flex flex-col h-full rounded-sm p-7 sm:p-8 transition-transform hover:-translate-y-1 ${
                tier.featured
                  ? 'border-2 border-[var(--masq-gold)] bg-[var(--masq-ink-raised)]'
                  : 'border border-[var(--masq-line)] bg-[var(--masq-ink)]'
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--masq-gold)] text-[var(--masq-ink)] text-[0.65rem] font-semibold uppercase tracking-[0.2em] whitespace-nowrap">
                  The Full Evening
                </span>
              )}

              <header className="text-center pb-6 border-b border-[var(--masq-line)]">
                <h3 className="text-2xl text-[var(--masq-cream)]">{tier.name}</h3>
                <p className="masq-eyebrow mt-2">{tier.subtitle}</p>
                <p className="mt-5 masq-display text-5xl text-[var(--masq-gold)]">${tier.price}</p>
                <p className="mt-2 text-sm text-[var(--masq-cream-dim)]">{tier.doors}</p>
                {tier.status === 'atDoor' && (
                  <p className="mt-3 inline-block px-3 py-1 text-[0.7rem] uppercase tracking-[0.15em] text-[var(--masq-gold)] border border-[var(--masq-line)]">
                    Also sold at the door
                  </p>
                )}
              </header>

              <p className="py-6 text-[var(--masq-cream-dim)] leading-relaxed">{tier.blurb}</p>

              <ul className="space-y-3 flex-grow">
                {tier.includes.map((line) => (
                  <li key={line} className="flex gap-3 text-[var(--masq-cream)] leading-snug">
                    <Check className="w-4 h-4 mt-1 shrink-0 text-[var(--masq-crimson-bright)]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-8">
                <TierAction tier={tier} />
              </div>
            </article>
          ))}
        </div>

        <Ornament variant="key" className="mt-16" />

        <div className="mt-10 max-w-2xl mx-auto text-center space-y-2 text-[var(--masq-cream-dim)]">
          <p>{ticketing.salesNote}</p>
          <p className="text-sm">{ticketing.refundPolicy}</p>
        </div>
      </div>
    </section>
  );
}
