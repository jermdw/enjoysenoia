import React, { useEffect } from 'react';
import './masquerade.css';
import MasqueradeSEO from './components/MasqueradeSEO';
import MasqueradeNav from './components/MasqueradeNav';
import Hero from './components/Hero';
import Invitation from './components/Invitation';
import Tickets from './components/Tickets';
import Schedule from './components/Schedule';
import Feast from './components/Feast';
import Sponsors from './components/Sponsors';
import Faq from './components/Faq';
import Waitlist from './components/Waitlist';
import MasqueradeFooter from './components/MasqueradeFooter';

/**
 * The Masquerade micro-site — its own brand, rendered outside the DDA Layout
 * (see App.jsx), so no Enjoy Senoia navbar or footer appears here.
 *
 * Deploy note: this lives at /masquerade today. Serving it at
 * thehalloweenmasquerade.com needs a second Firebase Hosting site and a
 * `hosting` array with targets in firebase.json — see README-masquerade.md.
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
        <Invitation />
        <Tickets />
        <Schedule />
        <Feast />
        <Sponsors />
        <Faq />
        <Waitlist />
      </main>
      <MasqueradeFooter />
    </div>
  );
}
