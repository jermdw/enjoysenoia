import React from 'react';
import { decoratingContest } from '../data/halloweenDetails';
import SignupForm from './SignupForm';

/** Section 2 — the decorating contest and its sign-up form. */
export default function DecoratingContest() {
  return (
    <section id="contest" className="hallo-band">
      <div className="hallo-wrap hallo-split">
        <div>
          <h2>{decoratingContest.heading}</h2>
          <p className="hallo-lede">{decoratingContest.blurb}</p>

          {decoratingContest.prizes.length > 0 && (
            <ul className="hallo-prizes">
              {decoratingContest.prizes.map((prize, i) => (
                <li key={i} className="hallo-card">{prize}</li>
              ))}
            </ul>
          )}
        </div>

        <SignupForm />
      </div>
    </section>
  );
}
