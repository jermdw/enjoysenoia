import React from 'react';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { Suit } from './Ornament';
import { event, heroBlurb } from '../data/eventDetails';

/**
 * Falling playing cards. Positions are fixed rather than random so the layout
 * is identical on every render (and in screenshots). Hidden under
 * prefers-reduced-motion by the .masq-drift rule.
 */
const cards = [
  { left: '8%', delay: '0s', duration: '17s', suit: 'heart', size: 'w-6 h-6' },
  { left: '23%', delay: '5s', duration: '21s', suit: 'spade', size: 'w-4 h-4' },
  { left: '44%', delay: '9s', duration: '19s', suit: 'diamond', size: 'w-5 h-5' },
  { left: '61%', delay: '2s', duration: '23s', suit: 'club', size: 'w-4 h-4' },
  { left: '79%', delay: '12s', duration: '18s', suit: 'heart', size: 'w-5 h-5' },
  { left: '91%', delay: '7s', duration: '25s', suit: 'spade', size: 'w-3 h-3' },
];

export default function Hero() {
  return (
    <section id="top" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden masq-vignette">
      {/* Backdrop: deep crimson bloom over near-black. Replace with the hero
          photograph once artwork arrives (NEEDED: hero image from organizer). */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(139, 14, 22, 0.42), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 100%, rgba(194, 163, 107, 0.16), transparent 70%), #0b0a0c',
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {cards.map((card, i) => (
          <span
            key={i}
            className="masq-drift absolute -top-10 text-[rgba(194,163,107,0.4)]"
            style={{ left: card.left, animationDelay: card.delay, animationDuration: card.duration }}
          >
            <Suit suit={card.suit} className={card.size} />
          </span>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-28 text-center">
        <p className="masq-eyebrow mb-6">Senoia, Georgia</p>

        <h1 className="text-[var(--masq-cream)]">
          <span className="block text-2xl leading-snug sm:text-3xl lg:text-4xl">
            {event.name}
          </span>
          <span className="block mt-3 uppercase text-[2.3rem] leading-[1.05] sm:text-5xl lg:text-6xl text-[var(--masq-gold)]">
            {event.theme}
          </span>
        </h1>

        <div className="flex items-center justify-center gap-4 mt-7" aria-hidden="true">
          <span className="masq-rule w-12 sm:w-24" />
          <Suit suit="heart" className="w-4 h-4 text-[var(--masq-crimson-bright)]" />
          <span className="masq-rule w-12 sm:w-24" />
        </div>

        <div className="mt-8 max-w-2xl mx-auto space-y-4">
          {heroBlurb.map((para) => (
            <p key={para} className="text-lg sm:text-xl text-[var(--masq-cream-dim)] leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        <dl className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 text-[var(--masq-cream)]">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-4 h-4 text-[var(--masq-gold)]" />
            <dt className="sr-only">Date</dt>
            <dd>{event.dateLabel}</dd>
          </div>
          <div className="hidden sm:block w-px h-5 bg-[var(--masq-line)]" aria-hidden="true" />
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[var(--masq-gold)]" />
            <dt className="sr-only">Time</dt>
            <dd>{event.timeLabel}</dd>
          </div>
          <div className="hidden sm:block w-px h-5 bg-[var(--masq-line)]" aria-hidden="true" />
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-[var(--masq-gold)]" />
            <dt className="sr-only">Venue</dt>
            <dd>{event.venue.label}</dd>
          </div>
        </dl>

        <div className="mt-11 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#tickets"
            className="w-full sm:w-auto px-9 py-4 rounded-sm bg-[var(--masq-crimson)] hover:bg-[var(--masq-crimson-bright)] text-[var(--masq-cream)] text-xs font-semibold uppercase tracking-[0.25em] transition-all hover:scale-[1.03]"
          >
            Reserve Your Place
          </a>
          <a
            href="#invitation"
            className="w-full sm:w-auto px-9 py-4 rounded-sm border border-[var(--masq-line)] hover:border-[var(--masq-gold)] text-[var(--masq-cream)] text-xs font-semibold uppercase tracking-[0.25em] transition-colors"
          >
            The Invitation
          </a>
        </div>

        <p className="mt-8 text-sm text-[var(--masq-cream-dim)]">
          {event.ageLabel} · {event.weatherLabel}
        </p>
      </div>
    </section>
  );
}
