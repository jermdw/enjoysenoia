import React, { Suspense, lazy, useEffect, useState } from 'react';
import { trickOrTreating } from '../data/halloweenDetails';
import { getMapPoints } from '../../services/halloweenService';
import { WavyFrame, Icon, JackOLantern } from './Art';

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
        <WavyFrame>
          <div className="hallo-center">
            <h2>{trickOrTreating.heading}</h2>
            <p className="hallo-pill hallo-pill-orange">{trickOrTreating.dateLabel}</p>
            <p className="hallo-when">{trickOrTreating.whenLabel}</p>
            <p className="hallo-lede hallo-strong">{trickOrTreating.blurb}</p>
          </div>

          {trickOrTreating.roadClosures.length > 0 && (
            <div className="hallo-closures">
              <h3>Road Closures</h3>
              <ul>
                {trickOrTreating.roadClosures.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </div>
          )}

          <p className="hallo-center hallo-map-note">{trickOrTreating.mapNote}</p>

          <ul className="hallo-legend">
            {Object.entries(trickOrTreating.mapKinds).map(([kind, { fill, label }]) => (
              <li key={kind}>
                <span className="hallo-map-dot" style={{ backgroundColor: fill }} aria-hidden="true" />
                {label}
              </li>
            ))}
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
            <ul className="hallo-point-list" aria-label="Every stop on the map">
              {points.map((p) => (
                <li key={p.id} className="hallo-card">
                  <strong>{p.label || p.kind}</strong>
                  <span>{p.address}</span>
                </li>
              ))}
            </ul>
          )}

          <Icon icon={JackOLantern} className="hallo-section-icon" />
        </WavyFrame>
      </div>
    </section>
  );
}
