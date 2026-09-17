import React from 'react';
import { SectionHeading } from './Ornament';
import { schedule } from '../data/eventDetails';

export default function Schedule() {
  return (
    <section id="schedule" className="py-24 sm:py-32 bg-[var(--masq-ink)] scroll-mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The run of show"
          title="An Evening in Eight Acts"
          lead="From the first pour in the tasting room to last call under the trees."
        />

        <ol className="mt-16 relative">
          {/* The vertical thread the whole night hangs from. */}
          <span
            className="absolute left-[7.5rem] sm:left-[9.5rem] top-2 bottom-2 w-px bg-[var(--masq-line)] hidden sm:block"
            aria-hidden="true"
          />

          {schedule.map((item) => (
            <li key={item.time} className="relative flex flex-col sm:flex-row gap-2 sm:gap-8 pb-10 last:pb-0">
              <div className="sm:w-28 sm:text-right shrink-0">
                <p className="masq-display text-lg text-[var(--masq-bone)] whitespace-nowrap">{item.time}</p>
              </div>

              <span
                className="hidden sm:block absolute left-[9.4rem] top-2.5 w-2 h-2 rounded-full bg-[var(--masq-bone)] ring-4 ring-[var(--masq-ink)]"
                aria-hidden="true"
              />

              <div className="sm:pl-10">
                <h3 className="text-xl text-[var(--masq-cream)]">{item.title}</h3>
                <p className="text-[var(--masq-cream-dim)] leading-relaxed">{item.detail}</p>
                <p className="mt-1.5 text-[0.7rem] uppercase tracking-[0.18em] text-[rgba(216,205,182,0.8)]">
                  {item.tier}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
