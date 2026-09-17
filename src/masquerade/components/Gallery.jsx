import React from 'react';
import { SectionHeading } from './Ornament';
import { gallery } from '../data/eventDetails';

/**
 * Photographs from previous years, running from late afternoon to the end of
 * the night.
 *
 * A row-major grid, deliberately not CSS columns. Columns fill top-to-bottom,
 * which would put the afternoon in the first column and the fire in the last —
 * read left to right, the evening would run three times over. A grid lays the
 * photos out in the order they happened.
 *
 * Aspect ratios are left alone (the set is 15 portrait, 13 landscape) and the
 * rows are top-aligned, so a short photo beside a tall one leaves space rather
 * than cropping either. Two columns keeps that raggedness mild.
 */
export default function Gallery() {
  return (
    <section id="gallery" className="py-24 sm:py-32 bg-[var(--masq-ink-soft)] scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Previous years"
          title="From Past Masquerades"
          lead="The first two years, from the tables being laid to the last of the fire."
        />

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 items-start">
          {gallery.map((photo, i) => (
            <figure
              key={photo.src}
              className="overflow-hidden rounded-sm border border-[var(--masq-line)]"
            >
              <img
                src={photo.src}
                alt={photo.alt}
                width={photo.w}
                height={photo.h}
                /* The first row is above the fold on most screens; the rest waits. */
                loading={i < 2 ? 'eager' : 'lazy'}
                decoding="async"
                className="block w-full h-auto transition-transform duration-500 hover:scale-[1.03]"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
