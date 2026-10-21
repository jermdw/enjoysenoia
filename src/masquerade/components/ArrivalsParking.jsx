import React, { Suspense, lazy } from 'react';
import { SectionHeading } from './Ornament';
import { arrivals } from '../data/eventDetails';

// Leaflet is heavy and sits well down the page, so it loads on its own chunk
// rather than with the hero (same split as the Halloween trick-or-treat map).
const ArrivalsMap = lazy(() => import('./ArrivalsMap'));

export default function ArrivalsParking() {
  return (
    <section id="arrivals" className="py-24 sm:py-32 bg-[var(--masq-ink-soft)] scroll-mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Getting there" title="Arrivals & Parking" />

        <div className="mt-10 max-w-3xl mx-auto space-y-4 text-center">
          {arrivals.paragraphs.map((para) => (
            <p key={para} className="text-lg sm:text-xl text-[var(--masq-cream-dim)] leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        <div className="mt-12">
          <Suspense fallback={<div className="masq-map masq-map-loading">Loading the map&hellip;</div>}>
            <ArrivalsMap />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
