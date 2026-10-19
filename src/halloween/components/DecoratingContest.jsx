import React from 'react';
import { decoratingContest } from '../data/halloweenDetails';
import { WavyFrame } from './Art';
import peacockLogo from '../assets/kimberly-peacock-realtor.png';

/**
 * Section 2 — the decorating contest results and the sponsor's logo. Entries
 * have closed, so SignupForm is no longer rendered here.
 */
export default function DecoratingContest() {
  return (
    <section id="contest">
      <div className="hallo-wrap">
        <WavyFrame>
          <h2>{decoratingContest.heading}</h2>
          {decoratingContest.results.map((line, i) => (
            <p key={i} className="hallo-lede">{line}</p>
          ))}
          <p className="hallo-winners">{decoratingContest.winner}</p>
          <p>{decoratingContest.honorableMentions}</p>
          <p>
            <a href="#trick-or-treating">{decoratingContest.mapNote}</a>
          </p>
          <p className="hallo-sponsor-label">{decoratingContest.sponsorThanks}</p>
          <img
            className="hallo-contest-logo"
            src={peacockLogo}
            alt={decoratingContest.logoAlt}
            width="720"
            height="348"
            loading="lazy"
          />
        </WavyFrame>
      </div>
    </section>
  );
}
