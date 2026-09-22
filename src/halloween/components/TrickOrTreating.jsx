import React, { Suspense, lazy, useEffect, useState } from 'react';
import { trickOrTreating } from '../data/halloweenDetails';
import { getMapPoints } from '../../services/halloweenService';

// Leaflet plus react-leaflet is a heavy dependency for a page whose first
// screen is type. Split it out so it loads when this section is reached rather
// than blocking the rest of the site.
const TrickOrTreatMap = lazy(() => import('./TrickOrTreatMap'));

/**
 * Section 5 — trick or treating.
 *
 * Pins come from `halloween_map_points`, which is public-read and holds no
 * personal data: an address, coordinates, and a kind. The names and emails
 * collected by the sign-up form live in a separate, admin-only collection and
 * never reach the browser. See src/services/halloweenService.js.
 */
export default function TrickOrTreating() {
  const [points, setPoints] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    getMapPoints()
      .then((rows) => {
        if (cancelled) return;
        setPoints(rows);
        setState('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        // Firestore is not provisioned yet (see README-halloween.md), so this
        // is the expected path today. Say so rather than showing an empty map
        // that looks like nobody signed up.
        console.warn('Could not load trick-or-treat map points:', err);
        setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="trick-or-treating">
      <div className="hallo-wrap">
        <h2>{trickOrTreating.heading}</h2>
        <p className="hallo-lede">{trickOrTreating.blurb}</p>

        <ul className="hallo-legend">
          <li><span className="hallo-cal-dot" style={{ backgroundColor: '#ff7518' }} aria-hidden="true" />Handing out candy</li>
          <li><span className="hallo-cal-dot" style={{ backgroundColor: '#e11d48' }} aria-hidden="true" />Road closed</li>
          <li><span className="hallo-cal-dot" style={{ backgroundColor: '#7b3ff2' }} aria-hidden="true" />Parking</li>
        </ul>

        {state === 'error' ? (
          <p className="hallo-card hallo-todo">
            The map isn&rsquo;t available right now. Please check back soon.
          </p>
        ) : (
          <Suspense fallback={<div className="hallo-map hallo-map-loading">Loading the map&hellip;</div>}>
            <TrickOrTreatMap points={points} />
          </Suspense>
        )}

        {state === 'ready' && points.length === 0 && (
          <p className="hallo-field-note">{trickOrTreating.emptyState}</p>
        )}

        {/* The map is not reachable by keyboard in any useful way, so the same
            information is listed underneath it. */}
        {points.length > 0 && (
          <>
            <h3>Every stop on the route</h3>
            <ul className="hallo-point-list">
              {points.map((p) => (
                <li key={p.id} className="hallo-card">
                  <strong>{p.label || p.kind}</strong>
                  <span>{p.address}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
