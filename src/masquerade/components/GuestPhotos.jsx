import React from 'react';
import { thankYou } from '../data/eventDetails';

/**
 * This year's photos, as a static grid under the thank-you buttons. The set is
 * small (8), so a grid is easier to scan than a carousel, and every frame is
 * shown whole rather than cropped.
 */
export default function GuestPhotos() {
  const photos = thankYou.guestPhotos;
  const total = photos.length;
  const { video } = thankYou;

  return (
    <section id="photos" className="py-16 sm:py-24 bg-[var(--masq-ink)] scroll-mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <video
          src={video.src}
          poster={video.poster}
          controls
          preload="metadata"
          playsInline
          aria-label={video.title}
          className="w-full mb-10 sm:mb-14 rounded-sm border border-[var(--masq-line)] bg-black"
        >
          Your browser can't play this video.
        </video>

        <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {photos.map((photo, i) => (
            <li
              key={photo.src}
              className="flex items-center justify-center aspect-[4/3] overflow-hidden rounded-sm border border-[var(--masq-line)] bg-[var(--masq-ink-soft)]"
            >
              <img
                src={photo.src}
                alt={`Photo ${i + 1} of ${total} from the 3rd Annual Masquerade, Down the Rabbit Hole`}
                width={photo.w}
                height={photo.h}
                loading="lazy"
                decoding="async"
                className="max-h-full max-w-full w-auto h-auto object-contain"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
