import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, MapPin, Search, X } from 'lucide-react';
import { geocodeAddress, distanceMeters, roundCoord } from '../../services/geocode';
import { trickOrTreating } from '../../halloween/data/halloweenDetails';

const PinPlacerMap = lazy(() => import('./PinPlacerMap'));

// Further than this from downtown and the pin is probably a wrong match.
const FAR_METERS = 3000;

/**
 * Looks an address up and lets an admin check the pin before it goes on the
 * public map. Nothing is written until they press the confirm button.
 *
 * Only the address is sent to the geocoder. A sign-up's name and email never
 * leave this page (see the privacy note in HalloweenAdmin).
 *
 * `onConfirm({ lat, lng })` does the write; `lat`/`lng` are null when the admin
 * chooses the unplaced option (shown only when `unplacedLabel` is given).
 */
export default function PinPlacerModal({ title, address, kind = 'residential', confirmLabel, unplacedLabel, onConfirm, onClose }) {
  const [query, setQuery] = useState(address);
  const [lookup, setLookup] = useState({ state: 'idle', results: [] }); // idle | loading | done | error
  const [chosen, setChosen] = useState(null); // index into lookup.results
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [focus, setFocus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const ran = useRef(false);

  const runLookup = async (q) => {
    setLookup({ state: 'loading', results: [] });
    setError('');
    try {
      const results = await geocodeAddress(q);
      setLookup({ state: 'done', results });
      if (results.length > 0) choose(results, 0);
    } catch (err) {
      console.warn('Address lookup failed:', err);
      setLookup({ state: 'error', results: [] });
    }
  };

  const choose = (results, i) => {
    const r = results[i];
    setChosen(i);
    setLat(String(r.lat));
    setLng(String(r.lng));
    setFocus({ lat: r.lat, lng: r.lng });
  };

  // One lookup when the dialog opens. The ref keeps StrictMode's double
  // effect from sending two requests to a service that allows one a second.
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (address.trim()) runLookup(address);
  }, [address]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const latNum = lat.trim() === '' ? NaN : Number(lat);
  const lngNum = lng.trim() === '' ? NaN : Number(lng);
  const valid = Number.isFinite(latNum) && Number.isFinite(lngNum)
    && Math.abs(latNum) <= 90 && Math.abs(lngNum) <= 180;
  const point = valid ? { lat: latNum, lng: lngNum } : null;
  const distance = point ? distanceMeters(trickOrTreating.mapDefaults.center, [point.lat, point.lng]) : 0;
  const match = chosen != null ? lookup.results[chosen] : null;

  const onPick = (pLat, pLng) => {
    setLat(String(roundCoord(pLat)));
    setLng(String(roundCoord(pLng)));
    setChosen(null);
  };

  const onPaste = (e) => {
    // Google Maps copies "33.302, -84.554"; split it across both fields.
    const text = e.clipboardData.getData('text');
    const m = text.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!m) return;
    e.preventDefault();
    setLat(m[1]);
    setLng(m[2]);
    setChosen(null);
    setFocus({ lat: Number(m[1]), lng: Number(m[2]) });
  };

  const submit = async (placed) => {
    setSaving(true);
    setError('');
    try {
      await onConfirm(placed ? { lat: roundCoord(latNum), lng: roundCoord(lngNum) } : { lat: null, lng: null });
    } catch (err) {
      console.warn('Could not save map pin:', err);
      setError('Could not save that pin. Please try again.');
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 overflow-y-auto"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-placer-title"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-lg border border-stone-200 p-5 sm:p-6 space-y-4 my-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="pin-placer-title" className="text-lg font-bold font-serif text-stone-900">{title}</h2>
            <p className="text-sm text-stone-600">{address}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); if (query.trim()) runLookup(query); }}
          className="flex gap-2"
        >
          <label htmlFor="pin-placer-query" className="sr-only">Address to look up</label>
          <input id="pin-placer-query" value={query} onChange={(e) => setQuery(e.target.value)} className={inputClass} />
          <button
            type="submit"
            disabled={lookup.state === 'loading' || !query.trim()}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-xs font-semibold shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>{lookup.state === 'loading' ? 'Looking up…' : 'Look up'}</span>
          </button>
        </form>

        <div aria-live="polite" className="space-y-2">
          {lookup.state === 'error' && (
            <p className="text-xs text-rose-700">The address lookup is not responding. Click the map or paste coordinates instead.</p>
          )}
          {lookup.state === 'done' && lookup.results.length === 0 && (
            <p className="text-xs text-amber-800">
              No match near Senoia. Try a shorter address (house number and street), or click the map to place the pin.
            </p>
          )}
          {lookup.results.length > 1 && (
            <ul className="space-y-1">
              {lookup.results.map((r, i) => (
                <li key={`${r.lat},${r.lng},${i}`}>
                  <button
                    type="button"
                    onClick={() => choose(lookup.results, i)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs border ${chosen === i ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:bg-stone-50'}`}
                  >
                    {r.label}
                    {!r.precise && <span className="ml-1.5 text-amber-700">(street only)</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {lookup.results.length === 1 && match && (
            <p className="text-xs text-stone-600">Matched: {match.label}</p>
          )}
          {match && !match.precise && (
            <p className="flex items-start gap-1.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Only the street was found, not the house number. Click the house on the map.</span>
            </p>
          )}
        </div>

        <div className="h-72 rounded-xl overflow-hidden border border-stone-200 relative z-0">
          <Suspense fallback={<div className="h-full flex items-center justify-center text-xs text-stone-500">Loading the map…</div>}>
            <PinPlacerMap point={point} focus={focus} kind={kind} onPick={onPick} />
          </Suspense>
        </div>
        <p className="text-xs text-stone-500">
          Check the pin is on the right house. Click the map to move it.
        </p>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="pin-placer-lat">Latitude</label>
            <input id="pin-placer-lat" value={lat} onPaste={onPaste} onChange={(e) => { setLat(e.target.value); setChosen(null); }} className={inputClass} placeholder="33.302" inputMode="decimal" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="pin-placer-lng">Longitude</label>
            <input id="pin-placer-lng" value={lng} onPaste={onPaste} onChange={(e) => { setLng(e.target.value); setChosen(null); }} className={inputClass} placeholder="-84.554" inputMode="decimal" />
          </div>
        </div>

        {point && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {distance > FAR_METERS ? (
              <span className="flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4" />
                {(distance / 1609).toFixed(1)} miles from downtown Senoia. Double-check this is right.
              </span>
            ) : <span />}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 underline"
            >
              Check in Google Maps <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">{error}</div>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-stone-100">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100">
            Cancel
          </button>
          {unplacedLabel && (
            <button type="button" onClick={() => submit(false)} disabled={saving} className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-xs font-semibold">
              {unplacedLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={saving || !valid}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-700 disabled:opacity-50 text-white text-xs font-semibold"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving…' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
