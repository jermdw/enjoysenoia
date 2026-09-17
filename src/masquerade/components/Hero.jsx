import React from "react";
import { Clock, MapPin } from "lucide-react";
import { Suit, Key, Keyhole } from "./Ornament";
import { event, contact } from "../data/eventDetails";

/**
 * The hero is a framed title card, following the artwork the organizer sent:
 * a harlequin diamond border around a dark panel, double-ruled inside, with
 * the theme set as a small line over a large one.
 *
 * Falling playing cards drift behind it. Positions are fixed rather than
 * random so the layout is identical on every render (and in screenshots).
 * Hidden under prefers-reduced-motion by the .masq-drift rule.
 */
const cards = [
  { left: "8%", delay: "0s", duration: "17s", suit: "heart", size: "w-6 h-6" },
  { left: "23%", delay: "5s", duration: "21s", suit: "spade", size: "w-4 h-4" },
  {
    left: "44%",
    delay: "9s",
    duration: "19s",
    suit: "diamond",
    size: "w-5 h-5",
  },
  { left: "61%", delay: "2s", duration: "23s", suit: "club", size: "w-4 h-4" },
  {
    left: "79%",
    delay: "12s",
    duration: "18s",
    suit: "heart",
    size: "w-5 h-5",
  },
  { left: "91%", delay: "7s", duration: "25s", suit: "spade", size: "w-3 h-3" },
];

/** enjoysenoia.com set the way the title card sets it, wide and spaced. */
const wordmark = contact.ddaUrl
  .replace(/^https?:\/\//, "")
  .replace(".com", " . com");

export default function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden px-4 py-24 sm:px-6 sm:py-28"
    >
      {/* Backdrop: a faint bone bloom over the charcoal ground. Rgba literals
          rather than var() because Tailwind v4 will not apply an opacity
          modifier to a bare custom property — see the nav bar for the same. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 15%, rgba(216, 205, 182, 0.13), transparent 62%), #24231f",
        }}
      />

      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {cards.map((card, i) => (
          <span
            key={i}
            className="masq-drift absolute -top-10 text-[rgba(216,205,182,0.26)]"
            style={{
              left: card.left,
              animationDelay: card.delay,
              animationDuration: card.duration,
            }}
          >
            <Suit suit={card.suit} className={card.size} />
          </span>
        ))}
      </div>

      {/* Built the way the title card is matted: a cream margin, a row of
          harlequin diamonds, a second cream margin, then the dark panel. */}
      <div className="masq-harlequin-mat relative z-10 w-full max-w-5xl">
        <div className="masq-harlequin-frame">
          <div className="masq-harlequin-mat">
            <div className="masq-frame bg-[var(--masq-ink)] px-5 py-14 sm:px-8 sm:py-16 text-center">
              <h1 className="text-[var(--masq-cream)]">
                <span className="flex items-center justify-center gap-4 sm:gap-6">
                  <span className="masq-display text-2xl sm:text-4xl lg:text-5xl">
                    {event.titleLockup.over}
                  </span>
                  <Key className="w-16 h-6 sm:w-24 sm:h-8 shrink-0 text-[var(--masq-cream)]" />
                </span>
                <span className="masq-titlecaps mt-1 block text-[2.9rem] sm:text-[4.4rem] lg:text-[6.2rem]">
                  {event.titleLockup.under}
                </span>
              </h1>

              <p className="masq-spacedcaps mt-10 text-xs sm:text-sm text-[var(--masq-bone)]">
                The {event.edition}
              </p>
              <p className="masq-spacedcaps mt-1 text-xl sm:text-3xl text-[var(--masq-cream)]">
                Masquerade
              </p>

              <p className="masq-spacedcaps mt-8 text-sm sm:text-lg text-[var(--masq-cream)]">
                {event.dateLabel}
              </p>

              <div className="mt-9 flex justify-center" aria-hidden="true">
                <Keyhole className="w-9 h-14 text-[var(--masq-cream)]" />
              </div>

              <dl className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-7 text-[var(--masq-cream-dim)]">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[var(--masq-bone)]" />
                  <dt className="sr-only">Time</dt>
                  <dd>{event.timeLabel}</dd>
                </div>
                <div
                  className="hidden sm:block w-px h-5 bg-[var(--masq-line)]"
                  aria-hidden="true"
                />
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[var(--masq-bone)]" />
                  <dt className="sr-only">Venue</dt>
                  <dd>{event.venue.name}</dd>
                </div>
              </dl>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="#tickets"
                  className="masq-btn-solid w-full sm:w-auto px-9 py-4 rounded-sm text-xs font-semibold uppercase tracking-[0.25em]"
                >
                  Reserve Your Place
                </a>
                <a
                  href="#invitation"
                  className="w-full sm:w-auto px-9 py-4 rounded-sm border border-[var(--masq-line)] hover:border-[var(--masq-bone)] text-[var(--masq-cream)] text-xs font-semibold uppercase tracking-[0.25em] transition-colors"
                >
                  The Invitation
                </a>
              </div>

              <p className="mt-9 text-sm text-[var(--masq-cream-dim)]">
                {event.ageLabel} · {event.weatherLabel}
              </p>

              <p className="masq-spacedcaps mt-7 text-[0.7rem] sm:text-xs tracking-[0.3em] text-[var(--masq-bone)]">
                {wordmark}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
