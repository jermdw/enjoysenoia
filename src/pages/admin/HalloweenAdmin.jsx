import React, { useCallback, useEffect, useState } from 'react';
import { Download, MapPin, Trash2, RefreshCw } from 'lucide-react';
import {
  getSignups,
  getMapPoints,
  publishMapPoint,
  deleteMapPoint,
  signupsToCsv,
  POINT_KINDS,
} from '../../services/halloweenService';

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
  const [busyId, setBusyId] = useState(null);
  const [newPoint, setNewPoint] = useState({ address: '', lat: '', lng: '', kind: 'closure', label: '' });

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

  const onPublish = async (signup) => {
    // Coordinates are optional: an unplaced pin is stored and skipped by the
    // map until someone adds them, so nothing blocks on geocoding.
    const raw = window.prompt(
      `Coordinates for ${signup.address}\n\nPaste "lat, lng" (right-click the spot in Google Maps to copy), or leave blank to publish it unplaced.`,
      ''
    );
    if (raw === null) return;

    let lat = null;
    let lng = null;
    if (raw.trim()) {
      const [a, b] = raw.split(',').map((v) => Number(v.trim()));
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        window.alert('Could not read those coordinates. Expected something like: 33.302, -84.554');
        return;
      }
      lat = a;
      lng = b;
    }

    setBusyId(signup.id);
    try {
      await publishMapPoint({ signupId: signup.id, address: signup.address, lat, lng, kind: 'residential' });
      await load();
    } catch (err) {
      console.warn('Could not publish map point:', err);
      window.alert('Could not publish that address. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const onAddPoint = async (e) => {
    e.preventDefault();
    const lat = newPoint.lat.trim() ? Number(newPoint.lat) : null;
    const lng = newPoint.lng.trim() ? Number(newPoint.lng) : null;
    if ((lat !== null && !Number.isFinite(lat)) || (lng !== null && !Number.isFinite(lng))) {
      window.alert('Latitude and longitude must be numbers.');
      return;
    }
    try {
      await publishMapPoint({
        address: newPoint.address,
        lat,
        lng,
        kind: newPoint.kind,
        label: newPoint.label.trim() || null,
      });
      setNewPoint({ address: '', lat: '', lng: '', kind: 'closure', label: '' });
      await load();
    } catch (err) {
      console.warn('Could not add map point:', err);
      window.alert('Could not add that point.');
    }
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
                          onClick={() => onPublish(s)}
                          disabled={busyId === s.id}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-700 disabled:opacity-50 text-white text-xs font-semibold"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{busyId === s.id ? 'Publishing…' : 'Publish to map'}</span>
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
                Road closures and parking are added here directly. Leave latitude and longitude
                blank to store a pin without placing it yet.
              </p>
            </div>

            <form onSubmit={onAddPoint} className="grid gap-3 sm:grid-cols-5 items-end">
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
                <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="hallo-pt-lat">Lat</label>
                <input id="hallo-pt-lat" value={newPoint.lat} onChange={(e) => setNewPoint({ ...newPoint, lat: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm" placeholder="33.302" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="hallo-pt-lng">Lng</label>
                <input id="hallo-pt-lng" value={newPoint.lng} onChange={(e) => setNewPoint({ ...newPoint, lng: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm" placeholder="-84.554" />
              </div>
              <div className="sm:col-span-5">
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-xs font-semibold shadow-xs">
                  Add pin
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
                  <button onClick={() => onDeletePoint(p.id)} aria-label={`Remove ${p.address}`} className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
