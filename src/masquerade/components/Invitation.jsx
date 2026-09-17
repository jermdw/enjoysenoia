import React from 'react';
import Ornament, { SectionHeading, Suit } from './Ornament';
import { dressCode, happenings, event } from '../data/eventDetails';

export default function Invitation() {
  return (
    <section id="invitation" className="py-24 sm:py-32 bg-[var(--masq-ink)] scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="You are cordially invited"
          title="Down the Rabbit Hole"
          lead="For one night, the Stone Lodge at Marimac Lake falls into Wonderland — lantern light through the trees, acrobats overhead, a long table laid under canvas, and fire after dark."
        />

        <Ornament variant="keyhole" className="my-14" />

        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-start">
          {/* Dress code — the copy the organizer wrote, nearly untouched. */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-2xl sm:text-3xl text-[var(--masq-cream)]">{dressCode.headline}</h3>
            <p className="text-lg text-[var(--masq-cream-dim)] leading-relaxed">{dressCode.body}</p>
            <p className="flex items-start gap-3 text-[var(--masq-cream)] border-l-2 border-[var(--masq-bone)] pl-5 py-1">
              <span>{dressCode.note}</span>
            </p>
            <p className="text-[var(--masq-cream-dim)]">
              {event.venue.setting} {event.weatherLabel}, and {event.ageLabel.toLowerCase()}.
            </p>
          </div>

          {/* What's afoot through the night. */}
          <div className="lg:col-span-2 w-full">
            <div className="border border-[var(--masq-line)] rounded-sm p-7 sm:p-8 bg-[var(--masq-ink-soft)]">
              <h3 className="text-xl text-[var(--masq-cream)] mb-6">Curious Happenings</h3>
              <ul className="space-y-5">
                {happenings.map((item, i) => (
                  <li key={item.title} className="flex gap-4">
                    <Suit
                      suit={['heart', 'spade', 'club', 'diamond'][i % 4]}
                      className="w-3.5 h-3.5 mt-1.5 shrink-0 text-[var(--masq-bone)]"
                    />
                    <div>
                      <p className="text-[var(--masq-cream)] font-semibold">{item.title}</p>
                      <p className="text-[var(--masq-cream-dim)] leading-snug">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
