import React from 'react';
import { masqueradeTeaser } from '../data/halloweenDetails';
// The Masquerade is a live micro-site with its own domain and its own single
// source of truth. Import the facts rather than restating them here — a copy
// would drift the first time a door time or venue changes.
import { event as masqEvent } from '../../masquerade/data/eventDetails';

/** Section 3 — a teaser that hands off to thehalloweenmasquerade.com. */
export default function MasqueradeTeaser() {
  return (
    <section id="masquerade">
      <div className="hallo-wrap hallo-teaser">
        <h2>{masqueradeTeaser.heading}</h2>
        <p className="hallo-display hallo-teaser-theme">{masqEvent.theme}</p>
        <p className="hallo-lede">{masqueradeTeaser.blurb}</p>

        <dl className="hallo-facts">
          <div>
            <dt>When</dt>
            <dd>{masqEvent.dateLabel}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{masqEvent.timeLabel}</dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>{masqEvent.venue.label}</dd>
          </div>
          <div>
            <dt>Ages</dt>
            <dd>{masqEvent.ageLabel}</dd>
          </div>
        </dl>

        <a className="hallo-btn" href={masqueradeTeaser.url} target="_blank" rel="noreferrer">
          {masqueradeTeaser.ctaLabel}
        </a>
      </div>
    </section>
  );
}
