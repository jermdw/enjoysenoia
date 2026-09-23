import React from 'react';
import { decoratingContest } from '../data/halloweenDetails';
import SignupForm from './SignupForm';
import { WavyFrame } from './Art';
import peacockLogo from '../assets/kimberly-peacock-realtor.png';

/** Section 2 — the decorating contest and its sign-up form. */
export default function DecoratingContest() {
  return (
    <section id="contest">
      <div className="hallo-wrap">
        <WavyFrame className="hallo-split">
          <div>
            <h2>{decoratingContest.heading}</h2>
            <p className="hallo-lede">{decoratingContest.blurb}</p>

            <p className="hallo-keydates">
              <strong>{decoratingContest.judgedLabel}</strong>
              <span>{decoratingContest.deadlineLabel}</span>
            </p>

            <h3>Who can participate?</h3>
            <ul className="hallo-bullets">
              {decoratingContest.eligibility.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>

            {decoratingContest.contestCategories.map((cat) => (
              <div key={cat.id} className="hallo-card hallo-cat">
                <h3>Category: {cat.label}</h3>
                <p>{cat.blurb}</p>
              </div>
            ))}

            <p className="hallo-winners">{decoratingContest.winnersNote}</p>
            <p className="hallo-sponsor-label">{decoratingContest.sponsorLabel}</p>
            <img
              className="hallo-contest-logo"
              src={peacockLogo}
              alt={decoratingContest.logoAlt}
              width="720"
              height="348"
              loading="lazy"
            />
          </div>

          <SignupForm />
        </WavyFrame>
      </div>
    </section>
  );
}
