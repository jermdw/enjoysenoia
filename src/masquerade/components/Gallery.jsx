import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { SectionHeading } from './Ornament';
import { gallery } from '../data/eventDetails';

const INTERVAL = 5000;

/**
 * Photographs from previous years, as a carousel that advances on its own.
 *
 * The order still runs late afternoon to end of night, so advancing forward
 * walks the evening — see the note on `gallery` in eventDetails.js.
 *
 * Frames are letterboxed rather than cropped: the set is 15 portrait and 13
 * landscape, and a fixed aspect box would cut the tall ones badly. A height-
 * constrained box with object-contain lets each photo keep its own shape.
 */
export default function Gallery() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const count = gallery.length;

  const go = useCallback((next) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (!playing) return undefined;
    // Someone who has asked for less motion should not get a slideshow that
    // moves under them; they keep the arrows.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(id);
  }, [playing, count]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { go(index - 1); setPlaying(false); }
    if (e.key === 'ArrowRight') { go(index + 1); setPlaying(false); }
  };

  return (
    <section id="gallery" className="py-24 sm:py-32 bg-[var(--masq-ink-soft)] scroll-mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Previous years"
          title="From Past Masquerades"
          lead="The first two years, from the tables being laid to the last of the fire."
        />

        <div
          role="group"
          aria-roledescription="carousel"
          aria-label="Photographs from previous Masquerades"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onMouseEnter={() => setPlaying(false)}
          onMouseLeave={() => setPlaying(true)}
          onFocus={() => setPlaying(false)}
          className="mt-14 relative rounded-sm border border-[var(--masq-line)] bg-[var(--masq-ink)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--masq-gold)]"
        >
          <div className="h-[clamp(300px,55vh,560px)] flex items-center justify-center overflow-hidden">
            {gallery.map((photo, i) => (
              <img
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                width={photo.w}
                height={photo.h}
                /* Neighbours are fetched early so the next slide is ready. */
                loading={Math.abs(i - index) <= 1 || (index === 0 && i === count - 1) ? 'eager' : 'lazy'}
                decoding="async"
                hidden={i !== index}
                className="max-h-full w-auto max-w-full object-contain"
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[var(--masq-line)] px-4 py-3">
            <button
              type="button"
              onClick={() => { go(index - 1); setPlaying(false); }}
              aria-label="Previous photograph"
              className="p-2 text-[var(--masq-cream-dim)] hover:text-[var(--masq-gold)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'Pause the slideshow' : 'Play the slideshow'}
                className="p-2 text-[var(--masq-cream-dim)] hover:text-[var(--masq-gold)] transition-colors"
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <p
                aria-live="polite"
                className="text-xs uppercase tracking-[0.2em] text-[var(--masq-cream-dim)] tabular-nums"
              >
                {index + 1} / {count}
              </p>
            </div>

            <button
              type="button"
              onClick={() => { go(index + 1); setPlaying(false); }}
              aria-label="Next photograph"
              className="p-2 text-[var(--masq-cream-dim)] hover:text-[var(--masq-gold)] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
