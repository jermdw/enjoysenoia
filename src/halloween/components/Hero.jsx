import React from 'react';
import { event } from '../data/halloweenDetails';

/**
 * NEEDED: artwork. The brief calls for classic 2D American Halloween imagery —
 * ghosts, pumpkins, spiders, a haunted house, a graveyard, kids in costume —
 * taken from the organizer's slides. Until those images are exported, this is
 * type on a gradient with a CSS moon. Drop art in src/halloween/assets/ and
 * layer it here; nothing else depends on this component's internals.
 */
export default function Hero() {
  return (
    <section id="top" className="hallo-hero">
      <div className="hallo-wrap hallo-hero-inner">
        <p className="hallo-hero-kicker">{event.town}</p>
        <h1>{event.name}</h1>
        <p className="hallo-hero-year hallo-display">{event.year}</p>
        <p className="hallo-lede">{event.tagline}</p>
        <div className="hallo-hero-actions">
          <a href="#contest" className="hallo-btn">Enter the decorating contest</a>
          <a href="#trick-or-treating" className="hallo-btn hallo-btn-ghost">See the map</a>
        </div>
      </div>
    </section>
  );
}
