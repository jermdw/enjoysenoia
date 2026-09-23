import React, { useEffect } from 'react';
import './halloween.css';
import HalloweenSEO from './components/HalloweenSEO';
import HalloweenNav from './components/HalloweenNav';
import Hero from './components/Hero';
import OctoberCalendar from './components/OctoberCalendar';
import DecoratingContest from './components/DecoratingContest';
import MasqueradeTeaser from './components/MasqueradeTeaser';
import ToddlerTrickOrTreat from './components/ToddlerTrickOrTreat';
import TrickOrTreating from './components/TrickOrTreating';
import { PatternBackground } from './components/Art';

/**
 * The Halloween in Senoia micro-site — its own brand, rendered outside the DDA
 * Layout (see App.jsx), so no Enjoy Senoia navbar or footer appears here.
 *
 * Section order follows the brief: October calendar, decorating contest,
 * Masquerade Ball, toddler trick or treat, trick or treating.
 */
export default function HalloweenPage() {
  useEffect(() => {
    // index.html sets a light background on <body>; without this, overscroll
    // flashes stone-50 behind the purple page. Matches --hallo-purple.
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#846589';
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  return (
    <div className="hallo">
      <PatternBackground />
      <HalloweenSEO />
      <HalloweenNav />
      <main>
        <Hero />
        <OctoberCalendar />
        <DecoratingContest />
        <MasqueradeTeaser />
        <ToddlerTrickOrTreat />
        <TrickOrTreating />
      </main>
      <footer className="hallo-footer">
        <div className="hallo-wrap">
          <p>
            Presented by the{' '}
            <a href="https://enjoysenoia.com" target="_blank" rel="noreferrer">
              Senoia Downtown Development Authority
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
