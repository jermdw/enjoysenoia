import React, { useEffect } from 'react';
import './masquerade.css';
import MasqueradeSEO from './components/MasqueradeSEO';
import MasqueradeNav from './components/MasqueradeNav';
import Hero from './components/Hero';
import ThankYou from './components/ThankYou';
import Gallery from './components/Gallery';
import Follow from './components/Follow';
import { gallery2026, photoCredit2026 } from './data/eventDetails';

/**
 * The Masquerade micro-site — its own brand, rendered outside the DDA Layout
 * (see App.jsx), so no Enjoy Senoia navbar or footer appears here.
 *
 * Deploy note: this lives at /masquerade today. Serving it at
 * thehalloweenmasquerade.com needs a second Firebase Hosting site and a
 * `hosting` array with targets in firebase.json — see README-masquerade.md.
 *
 * Post-event (2026-10-29): the pre-event sections — Invitation, ArrivalsParking,
 * Tickets, Schedule, Sponsors and Faq — are off the page. Their components and
 * data are kept for next year; add them back here to reopen sales.
 */
export default function MasqueradePage() {
  useEffect(() => {
    // index.html sets a light background on <body>; without this, overscroll
    // flashes stone-50 behind the dark page.
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#0b0a0c';
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  return (
    <div className="masq">
      <MasqueradeSEO />
      <MasqueradeNav />
      <main>
        <Hero />
        <Gallery
          id="photos"
          eyebrow="October 24, 2026"
          title="Down the Rabbit Hole"
          lead="This year's Masquerade, from golden hour on the lake to the last of the fire."
          label="Photographs from the 2026 Masquerade"
          photos={gallery2026}
          credit={photoCredit2026}
        />
        <ThankYou />
        <Gallery />
        <Follow />
      </main>
    </div>
  );
}
