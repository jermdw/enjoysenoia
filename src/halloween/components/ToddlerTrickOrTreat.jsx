import React from 'react';
import { toddlerTrickOrTreat } from '../data/halloweenDetails';

/**
 * Section 4 — toddler trick or treat.
 *
 * The brief names this section but carries no details for it; they are on the
 * organizer's slides. `detailsNeeded` renders an honest placeholder rather than
 * inventing a time and route, and disappears on its own once `facts` is filled.
 */
export default function ToddlerTrickOrTreat() {
  return (
    <section id="toddler" className="hallo-band">
      <div className="hallo-wrap">
        <h2>{toddlerTrickOrTreat.heading}</h2>
        <p className="hallo-lede">{toddlerTrickOrTreat.blurb}</p>

        {toddlerTrickOrTreat.facts.length > 0 ? (
          <dl className="hallo-facts">
            {toddlerTrickOrTreat.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          toddlerTrickOrTreat.detailsNeeded && (
            <p className="hallo-card hallo-todo">
              Details for this section are still to come from the organizers.
            </p>
          )
        )}
      </div>
    </section>
  );
}
