import React, { useCallback, useEffect, useState } from 'react';
import { Download, MapPin, Trash2, RefreshCw } from 'lucide-react';
import {
  getSignups,
  getMapPoints,
  publishMapPoint,
  updateMapPoint,
  deleteMapPoint,
  signupsToCsv,
  POINT_KINDS,
} from '../../services/halloweenService';
import PinPlacerModal from './PinPlacerModal';

/**
 * Halloween decorating contest — review sign-ups and manage the public map.
 *
 * Self-contained so AdminPortalPage only gains an import and a tab. Every read
 * here is admin-only at the rules layer; a signed-out visitor gets a permission
 * error rather than data.
 *
 * THE PUBLISH STEP IS THE PRIVACY BOUNDARY. Sign-ups hold a name, an address
 * and an email. Publishing copies the address alone into `halloween_map_points`
 * — the only one of the two collections the public can read.
 *
 * Coordinates come from PinPlacerModal: it looks the address up and the admin
 * confirms or moves the pin before anything is written.
 */

/** Sheets and Excel both need a real file; a data: URI mangles quoted commas. */
function downloadCsv(filename, csv) {
  // The BOM makes Excel read it as UTF-8 rather than the local codepage.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function HalloweenAdmin() {
  const [signups, setSignups] = useState([]);
  const [points, setPoints] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | error
  // What the pin dialog is placing: a sign-up being published, a new
  // closure/parking pin from the form, or an existing pin that is not placed.
  const [placing, setPlacing] = useState(null); // null | { mode: 'signup' | 'new' | 'existing', ... }
  const [newPoint, setNewPoint] = useState({ address: '', kind: 'closure', label: '' });

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [s, p] = await Promise.all([getSignups(), getMapPoints()]);
      setSignups(s);
      setPoints(p);
      setState('ready');
    } catch (err) {
      // Expected until a Firestore database exists in the project.
      console.warn('Could not load Halloween data:', err);
      setState('error');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onExport = () => {
    downloadCsv(`senoia_halloween_signups_${new Date().toISOString().slice(0, 10)}.csv`, signupsToCsv(signups));
  };

  // Coordinates stay optional: an unplaced pin is stored and skipped by the
  // map until someone places it, so a failed lookup never blocks publishing.
  const onConfirmPlacement = async ({ lat, lng }) => {
    if (placing.mode === 'signup') {
      const { signup } = placing;
      await publishMapPoint({ signupId: signup.id, address: signup.address, lat, lng, kind: 'residential' });
    } else if (placing.mode === 'new') {
      const { address, kind, label } = placing.point;
      await publishMapPoint({ address, lat, lng, kind, label: label.trim() || null });
      setNewPoint({ address: '', kind: 'closure', label: '' });
    } else {
      await updateMapPoint(placing.point.id, { lat, lng });
    }
    setPlacing(null);
    await load();
  };

  const onAddPoint = (e) => {
    e.preventDefault();
    setPlacing({ mode: 'new', point: { ...newPoint } });
  };

  const onDeletePoint = async (id) => {
    if (!window.confirm('Remove this pin from the public map?')) return;
    try {
      await deleteMapPoint(id);
      await load();
    } catch (err) {
      console.warn('Could not delete map point:', err);
      window.alert('Could not remove that pin.');
    }
  };

  if (state === 'error') {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-bold font-serif text-stone-900">Halloween</h2>
        <p className="text-sm text-stone-600">
          Could not load sign-ups. This is expected until a Firestore database is created
          for the project and <code className="text-xs">firestore.rules</code> is deployed — see
          <code className="text-xs"> README-halloween.md</code>.
        </p>
        <button onClick={load} className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold">
          <RefreshCw className="w-4 h-4" />
          <span>Try again</span>
        </button>
      </div>
    );
  }

  const pending = signups.filter((s) => s.status !== 'published');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold font-serif text-stone-900">Decorating Contest Sign-ups</h2>
          <p className="text-xs text-stone-500">
            Export for Google Sheets, then publish residential addresses to the trick-or-treat map.
          </p>
        </div>
        <button
          onClick={onExport}
          disabled={signups.length === 0}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {state === 'loading' ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 text-xs font-semibold uppercase text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">On map</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {signups.length === 0 && (
                  <tr><td colSpan={6} className="p-3 text-xs text-stone-500">No sign-ups yet.</td></tr>
                )}
                {signups.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/80">
                    <td className="p-3 font-medium text-stone-900">{s.name}</td>
                    <td className="p-3">{s.address}</td>
                    <td className="p-3 text-xs">{s.email}</td>
                    <td className="p-3 text-xs capitalize">{s.category}</td>
                    <td className="p-3 text-xs">{s.contestCategory === 'pumpkinPals' ? 'Pumpkin Pals' : 'Spooky'}</td>
                    <td className="p-3">
                      {s.category !== 'residential' ? (
                        <span className="text-xs text-stone-400">Business — not mapped</span>
                      ) : s.status === 'published' ? (
                        <span className="text-xs text-emerald-700 font-semibold">Published</span>
                      ) : (
                        <button
                          onClick={() => setPlacing({ mode: 'signup', signup: s })}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-700 text-white text-xs font-semibold"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Publish to map</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pending.length > 0 && (
            <p className="text-xs text-stone-500">
              {pending.length} entr{pending.length === 1 ? 'y' : 'ies'} not yet on the map.
            </p>
          )}

          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div>
              <h2 className="text-lg font-bold font-serif text-stone-900">Map Pins</h2>
              <p className="text-xs text-stone-500">
                Road closures and parking are added here directly. The address is looked up
                and you confirm the pin on a map; for a description like an intersection,
                click the spot instead.
              </p>
            </div>

            <form onSubmit={onAddPoint} className="grid gap-3 sm:grid-cols-4 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="hallo-pt-address">Address or description</label>
                <input
                  id="hallo-pt-address"
                  required
                  value={newPoint.address}
                  onChange={(e) => setNewPoint({ ...newPoint, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm"
                  placeholder="Main St at Seavy St"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="hallo-pt-kind">Kind</label>
                <select
                  id="hallo-pt-kind"
                  value={newPoint.kind}
                  onChange={(e) => setNewPoint({ ...newPoint, kind: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm capitalize"
                >
                  {POINT_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="hallo-pt-label">Label (optional)</label>
                <input id="hallo-pt-label" value={newPoint.label} onChange={(e) => setNewPoint({ ...newPoint, label: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm" placeholder="Road closed" />
              </div>
              <div className="sm:col-span-4">
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-xs font-semibold shadow-xs">
                  Add pin…
                </button>
              </div>
            </form>

            <ul className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
              {points.length === 0 && <li className="p-3 text-xs text-stone-500">No pins on the map yet.</li>}
              {points.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 p-3 hover:bg-stone-50/80">
                  <span className="text-sm">
                    <span className="font-medium text-stone-900 capitalize">{p.label || p.kind}</span>
                    <span className="text-stone-500"> — {p.address}</span>
                    {(p.lat == null || p.lng == null) && (
                      <span className="ml-2 text-xs text-amber-700">not placed</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    {(p.lat == null || p.lng == null) && (
                      <button
                        onClick={() => setPlacing({ mode: 'existing', point: p })}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Place</span>
                      </button>
                    )}
                    <button onClick={() => onDeletePoint(p.id)} aria-label={`Remove ${p.address}`} className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {placing && (
        <PinPlacerModal
          key={placing.mode === 'signup' ? placing.signup.id : placing.point.id ?? 'new'}
          title={placing.mode === 'signup' ? 'Publish to the trick-or-treat map' : placing.mode === 'new' ? 'Add a map pin' : 'Place this pin'}
          address={placing.mode === 'signup' ? placing.signup.address : placing.point.address}
          kind={placing.mode === 'signup' ? 'residential' : placing.point.kind}
          confirmLabel={placing.mode === 'existing' ? 'Save pin here' : placing.mode === 'signup' ? 'Publish here' : 'Add pin here'}
          unplacedLabel={placing.mode === 'existing' ? null : placing.mode === 'signup' ? 'Publish without a pin' : 'Add without placing'}
          onConfirm={onConfirmPlacement}
          onClose={() => setPlacing(null)}
        />
      )}
    </div>
  );
}
