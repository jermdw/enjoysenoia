import React from 'react';
import { event } from '../data/halloweenDetails';
import { WavyFrame, Icon, Ghost } from './Art';

/**
 * The title slide, rebuilt as the page's opening frame: "Halloween in Senoia"
 * in the title face, the three headline events in the subtitle face, and the
 * slide's two big ghosts peeking over opposite corners.
 */
export default function Hero() {
  return (
    <section id="top" className="hallo-hero">
      <div className="hallo-wrap">
        <WavyFrame className="hallo-hero-frame">
          <Icon icon={Ghost} className="hallo-corner hallo-corner-tl" />
          <Icon icon={Ghost} className="hallo-corner hallo-corner-br" />

          <h1>
            <span className="hallo-hero-title">Halloween</span>{' '}
            <span className="hallo-hero-sub">in Senoia</span>
          </h1>

          <ul className="hallo-hero-list">
            {event.tagline.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          <div className="hallo-hero-actions">
            <a href="#contest" className="hallo-btn">Enter the decorating contest</a>
            <a href="#trick-or-treating" className="hallo-btn hallo-btn-ghost">See the map</a>
          </div>
        </WavyFrame>
      </div>
    </section>
  );
}
