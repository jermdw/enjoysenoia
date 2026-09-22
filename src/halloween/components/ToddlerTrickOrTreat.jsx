import React from 'react';
import { toddlerTrickOrTreat } from '../data/halloweenDetails';

/** Section 4 — toddler trick or treat. Copy is verbatim from the slide. */
export default function ToddlerTrickOrTreat() {
  return (
    <section id="toddler" className="hallo-band">
      <div className="hallo-wrap">
        <h2>{toddlerTrickOrTreat.heading}</h2>
        <p className="hallo-when">{toddlerTrickOrTreat.whenLabel}</p>
        <p className="hallo-kicker">{toddlerTrickOrTreat.kicker}</p>

        {toddlerTrickOrTreat.blurb.map((line, i) => (
          <p key={i} className="hallo-lede">{line}</p>
        ))}

        <h3>Participating Businesses</h3>
        <ul className="hallo-biz-list">
          {toddlerTrickOrTreat.participatingBusinesses.map((name) => (
            <li key={name} className="hallo-card">{name}</li>
          ))}
        </ul>

        <p className="hallo-perk hallo-card">{toddlerTrickOrTreat.perk}</p>
      </div>
    </section>
  );
}
