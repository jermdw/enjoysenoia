import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Pencil, RefreshCw, Trash2, UserMinus } from 'lucide-react';
import { getAllEventsForAdmin, useContentOverrides } from '../../services/dataService';
import { hasVolunteerBoard } from '../../utils/volunteer';
import {
  addShift,
  deleteShift,
  getShifts,
  getSignups,
  getVolunteerEvent,
  removeSignup,
  rosterToCsv,
  saveVolunteerEvent,
  updateShift,
} from '../../services/volunteerService';

/**
 * Volunteer shifts and roster, per event.
 *
 * An event gets a shift board when staff tick "Link volunteer sign-up" on it in
 * the Events tab (the tab lists those events). Everything else is
 * managed here: the open/close switch, the shifts and who has signed up. All
 * reads and writes are admin-only at the rules layer. Removing a volunteer, and
 * every count change, run in transactions (see volunteerService.js).
 */

const EMPTY_SHIFT = { role: '', time: '', note: '', spotsTotal: '4', sortOrder: '' };

/** Same file-download approach as HalloweenAdmin (a data: URI mangles commas). */
function downloadCsv(filename, csv) {
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

const inputClass = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-senoia-red/40';

export default function VolunteerAdmin() {
  // Live merged events, so linking one from its listing shows up here at once.
  useContentOverrides();
  const events = getAllEventsForAdmin();
  const options = useMemo(
    () => events.filter(hasVolunteerBoard).map((e) => ({ slug: e.slug, title: e.title })),
    [events]
  );
  const [chosen, setChosen] = useState(null);
  const eventSlug = options.some((o) => o.slug === chosen) ? chosen : options[0]?.slug || null;
  const setEventSlug = setChosen;
  const [eventDoc, setEventDoc] = useState(null);
  const [settings, setSettings] = useState({ name: '', intro: '', signupOpen: false });
  const [shifts, setShifts] = useState([]);
  const [signups, setSignups] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | error
  const [shiftForm, setShiftForm] = useState(EMPTY_SHIFT);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const builtInTitle = options.find((o) => o.slug === eventSlug)?.title || '';

  const load = useCallback(async () => {
    if (!eventSlug) return;
    setState('loading');
    try {
      const [ev, sh, su] = await Promise.all([getVolunteerEvent(eventSlug), getShifts(eventSlug), getSignups(eventSlug)]);
      setEventDoc(ev);
      setSettings({ name: ev?.name || builtInTitle, intro: ev?.intro || '', signupOpen: Boolean(ev?.signupOpen) });
      setShifts(sh);
      setSignups(su);
      setState('ready');
    } catch (err) {
      console.warn('Could not load volunteer data:', err);
      setState('error');
    }
  }, [eventSlug, builtInTitle]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn, failure) => {
    setBusy(true);
    try {
      await fn();
      await load();
      return true;
    } catch (err) {
      console.warn(failure, err);
      window.alert(err?.message && !err.code ? err.message : failure);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const onSaveSettings = (e) => {
    e.preventDefault();
    if (!settings.name.trim()) {
      window.alert('Please give the sign-up a name.');
      return;
    }
    return run(() => saveVolunteerEvent(eventSlug, settings), 'Could not save the settings.');
  };

  const onSubmitShift = async (e) => {
    e.preventDefault();
    const spots = Number(shiftForm.spotsTotal);
    if (!shiftForm.role.trim() || !shiftForm.time.trim()) {
      window.alert('A shift needs a role and a time.');
      return;
    }
    if (!Number.isInteger(spots) || spots < 1 || spots > 500) {
      window.alert('Spots must be a whole number from 1 to 500.');
      return;
    }
    const next = shifts.reduce((m, s) => Math.max(m, Number(s.sortOrder) || 0), 0) + 1;
    const values = { ...shiftForm, spotsTotal: spots, sortOrder: shiftForm.sortOrder === '' ? next : Number(shiftForm.sortOrder) };
    if (!Number.isFinite(values.sortOrder)) {
      window.alert('Order must be a number.');
      return;
    }
    const ok = await run(
      () => (editingId ? updateShift(eventSlug, editingId, values) : addShift(eventSlug, values)),
      'Could not save that shift.'
    );
    if (ok) {
      setShiftForm(EMPTY_SHIFT);
      setEditingId(null);
    }
  };

  const onEditShift = (s) => {
    setEditingId(s.id);
    setShiftForm({ role: s.role, time: s.time, note: s.note || '', spotsTotal: String(s.spotsTotal), sortOrder: String(s.sortOrder) });
  };

  const onDeleteShift = (s) => {
    if (!window.confirm(`Delete the "${s.role}" shift?`)) return;
    return run(() => deleteShift(eventSlug, s.id), 'Could not delete that shift.');
  };

  const onRemove = (s) => {
    if (!window.confirm(`Remove ${s.firstName} ${s.lastName} and release their spot? They will not be emailed.`)) return;
    return run(() => removeSignup(s), 'Could not remove that volunteer.');
  };

  const onExport = () => {
    downloadCsv(`${eventSlug}_volunteers_${new Date().toISOString().slice(0, 10)}.csv`, rosterToCsv(shifts, signups));
  };

  if (!eventSlug) {
    return (
      <p className="text-sm text-stone-600">
        No event is linked to volunteer sign-up yet. In the Events tab, edit an event and tick{' '}
        <strong>Link volunteer sign-up</strong>.
      </p>
    );
  }

  if (state === 'error') {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-bold font-serif text-stone-900">Volunteers</h2>
        <p className="text-sm text-stone-600">Could not load volunteer data. Please try again.</p>
        <button onClick={load} className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold">
          <RefreshCw className="w-4 h-4" />
          <span>Try again</span>
        </button>
      </div>
    );
  }

  const active = signups.filter((s) => s.status === 'active');
  const shiftById = new Map(shifts.map((s) => [s.id, s]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold font-serif text-stone-900">Volunteers</h2>
          <p className="text-xs text-stone-500">
            Public page: <code>/volunteer/{eventSlug}</code> &middot; {active.length} signed up
          </p>
        </div>
        <div className="flex items-center gap-2">
          {options.length > 1 && (
            <select value={eventSlug} onChange={(e) => setEventSlug(e.target.value)} className={`${inputClass} w-auto`}>
              {options.map((o) => <option key={o.slug} value={o.slug}>{o.title}</option>)}
            </select>
          )}
          <button
            onClick={onExport}
            disabled={active.length === 0}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {state === 'loading' ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : (
        <>
          <form onSubmit={onSaveSettings} className="space-y-3 p-4 rounded-xl border border-stone-200 bg-stone-50">
            <h3 className="text-sm font-bold text-stone-900">Sign-up page</h3>
            {!eventDoc && (
              <p className="text-xs text-amber-700">
                Not set up yet. Visitors see "not open". Save to create it, then add shifts below.
              </p>
            )}
            <input className={inputClass} placeholder="Name shown on the page and in emails" value={settings.name}
              onChange={(e) => setSettings((v) => ({ ...v, name: e.target.value }))} maxLength={200} />
            <textarea className={inputClass} rows={2} placeholder="Intro (optional): when to arrive, where to meet, what to wear"
              value={settings.intro} onChange={(e) => setSettings((v) => ({ ...v, intro: e.target.value }))} maxLength={2000} />
            <label className="flex items-center gap-2 text-sm text-stone-800">
              <input type="checkbox" checked={settings.signupOpen}
                onChange={(e) => setSettings((v) => ({ ...v, signupOpen: e.target.checked }))} />
              Sign-ups are open
            </label>
            <button disabled={busy} className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-700 disabled:opacity-50 text-white text-xs font-semibold">
              Save
            </button>
          </form>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-900">Shifts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-600">
                <thead className="bg-stone-50 text-xs font-semibold uppercase text-stone-500 border-b border-stone-200">
                  <tr>
                    <th className="p-3">Order</th><th className="p-3">Role</th><th className="p-3">When</th>
                    <th className="p-3">Filled</th><th className="p-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {shifts.length === 0 && <tr><td colSpan={5} className="p-3 text-xs text-stone-500">No shifts yet.</td></tr>}
                  {shifts.map((s) => (
                    <tr key={s.id}>
                      <td className="p-3 text-xs">{s.sortOrder}</td>
                      <td className="p-3 font-medium text-stone-900">{s.role}</td>
                      <td className="p-3">{s.time}</td>
                      <td className="p-3">{s.spotsFilled ?? 0} / {s.spotsTotal}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button onClick={() => onEditShift(s)} className="p-1.5 text-stone-500 hover:text-stone-900" aria-label={`Edit ${s.role}`}><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => onDeleteShift(s)} disabled={busy} className="p-1.5 text-stone-500 hover:text-red-700" aria-label={`Delete ${s.role}`}><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form onSubmit={onSubmitShift} className="grid sm:grid-cols-2 gap-2 p-4 rounded-xl border border-stone-200 bg-stone-50">
              <h4 className="sm:col-span-2 text-xs font-bold uppercase text-stone-500">{editingId ? 'Edit shift' : 'Add a shift'}</h4>
              <input className={inputClass} placeholder="Role (e.g. Setup crew)" value={shiftForm.role}
                onChange={(e) => setShiftForm((v) => ({ ...v, role: e.target.value }))} maxLength={120} />
              <input className={inputClass} placeholder="When (e.g. Sat Nov 21, 6:00 to 8:00 AM)" value={shiftForm.time}
                onChange={(e) => setShiftForm((v) => ({ ...v, time: e.target.value }))} maxLength={120} />
              <input className={`${inputClass} sm:col-span-2`} placeholder="Note shown under the role (optional)" value={shiftForm.note}
                onChange={(e) => setShiftForm((v) => ({ ...v, note: e.target.value }))} maxLength={500} />
              <input className={inputClass} type="number" min="1" max="500" placeholder="Spots" value={shiftForm.spotsTotal}
                onChange={(e) => setShiftForm((v) => ({ ...v, spotsTotal: e.target.value }))} />
              <input className={inputClass} type="number" placeholder="Order (blank = last)" value={shiftForm.sortOrder}
                onChange={(e) => setShiftForm((v) => ({ ...v, sortOrder: e.target.value }))} />
              <div className="sm:col-span-2 flex gap-2">
                <button disabled={busy} className="px-4 py-2 rounded-lg bg-senoia-red hover:bg-senoia-darkred disabled:opacity-50 text-white text-xs font-semibold">
                  {editingId ? 'Save shift' : 'Add shift'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setShiftForm(EMPTY_SHIFT); }}
                    className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold">Cancel</button>
                )}
              </div>
            </form>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-900">Volunteers ({active.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-600">
                <thead className="bg-stone-50 text-xs font-semibold uppercase text-stone-500 border-b border-stone-200">
                  <tr>
                    <th className="p-3">Name</th><th className="p-3">Shift</th><th className="p-3">Email</th>
                    <th className="p-3">Phone</th><th className="p-3">Note</th><th className="p-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {active.length === 0 && <tr><td colSpan={6} className="p-3 text-xs text-stone-500">Nobody has signed up yet.</td></tr>}
                  {active.map((s) => (
                    <tr key={s.id}>
                      <td className="p-3 font-medium text-stone-900">{s.firstName} {s.lastName}</td>
                      <td className="p-3 text-xs">{shiftById.get(s.shiftId)?.role ?? '(deleted shift)'}</td>
                      <td className="p-3 text-xs">{s.email}</td>
                      <td className="p-3 text-xs">{s.phone}</td>
                      <td className="p-3 text-xs">{s.note}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => onRemove(s)} disabled={busy} className="p-1.5 text-stone-500 hover:text-red-700" aria-label={`Remove ${s.firstName} ${s.lastName}`}>
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
