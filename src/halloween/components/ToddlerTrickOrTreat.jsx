import React from 'react';
import { toddlerTrickOrTreat } from '../data/halloweenDetails';
import { WavyFrame } from './Art';

/** Section 4 — toddler trick or treat. Copy is verbatim from the slide. */
export default function ToddlerTrickOrTreat() {
  return (
    <section id="toddler">
      <div className="hallo-wrap">
        <WavyFrame className="hallo-center">
          <h2>{toddlerTrickOrTreat.heading}</h2>
          <p className="hallo-kicker">{toddlerTrickOrTreat.kicker}</p>

          {toddlerTrickOrTreat.blurb.map((line, i) => (
            <p key={i} className="hallo-lede">{line}</p>
          ))}

          <p className="hallo-subtitle">{toddlerTrickOrTreat.where}</p>
          <p className="hallo-pill">{toddlerTrickOrTreat.whenLabel}</p>

          <h3 className="hallo-biz-heading">Participating Businesses:</h3>
          {/* Set as a run of names, like the slide, rather than as tiles: these
              are a list to read, not things to press. */}
          <ul className="hallo-biz-list">
            {toddlerTrickOrTreat.participatingBusinesses.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>

          <p className="hallo-perk">{toddlerTrickOrTreat.perk}</p>
        </WavyFrame>
      </div>
    </section>
  );
}
