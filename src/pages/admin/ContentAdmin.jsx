import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw, Eye, EyeOff, ExternalLink, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import {
  KINDS,
  displayDateTime,
  fromDateTimeInput,
  hasContentEdits,
  htmlToText,
  removeOverride,
  saveItem,
  setHidden,
  slugInUse,
  slugify,
  textToHtml,
  toDateTimeInput,
} from '../../services/contentAdminService';
import { loadOverrides, useContentOverrides } from '../../services/dataService';

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-senoia-red/30 focus:border-senoia-red';
const labelClass = 'block text-xs font-semibold text-stone-700 mb-1';

// Matches CATEGORY_MAP in BusinessesPage: the directory filters are an exact
// match on this label.
const BUSINESS_CATEGORIES = [
  'Dining & Drinks', 'Shopping & Retail', 'Services & Salons', 'Health & Medical',
  'Stay & Tours', 'Civic & Historic', 'Downtown Business',
];
const EVENT_CATEGORIES = ['DDA Event', 'Community Event'];

const LIST_DATE = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric',
});

/* Per-kind form definitions: how an item becomes form state and back. */
const CONFIG = {
  event: {
    noun: 'event',
    plural: 'Events',
    title: 'Events',
    blurb: 'Hide old events, fix details, or add new ones. Changes go live immediately.',
    nameOf: (i) => i.title,
    publicPath: (i) => `/events/${i.slug}`,
    secondary: (i) => i.date_time || '',
    toForm: (i) => ({
      title: i?.title || '',
      start: toDateTimeInput(i?.start),
      end: toDateTimeInput(i?.end),
      date_time: i?.date_time || '',
      location: i?.location || '',
      category: i?.category || 'DDA Event',
      description: i?.description || '',
      image: i?.image || '',
      external_url: i?.external_url || '',
    }),
    // An untouched date keeps its stored ISO string, so saving other fields
    // does not rewrite it.
    toValues: (f, original) => ({
      title: f.title,
      start: f.start === toDateTimeInput(original?.start) ? original?.start : fromDateTimeInput(f.start),
      end: f.end === toDateTimeInput(original?.end) ? original?.end : fromDateTimeInput(f.end),
      date_time: f.date_time,
      location: f.location,
      category: f.category,
      description: f.description,
      image: f.image,
      external_url: f.external_url,
    }),
  },
  business: {
    noun: 'business',
    plural: 'Businesses',
    title: 'Merchant Directory',
    blurb: 'Add a storefront, correct a listing, or hide one that has closed. Changes go live immediately.',
    nameOf: (i) => i.name,
    publicPath: (i) => `/downtown-business/${i.slug}`,
    secondary: (i) => [i.category, i.address].filter(Boolean).join(' · '),
    toForm: (i) => ({
      name: i?.name || '',
      category: i?.category || 'Downtown Business',
      summary: i?.summary || '',
      description: htmlToText(i?.description_html),
      hours: htmlToText(i?.hours_html),
      phone: i?.phone || '',
      email: i?.email || '',
      website: i?.website || '',
      facebook: i?.facebook || '',
      instagram: i?.instagram || '',
      address: i?.address || '',
      image: i?.image || '',
    }),
    // Rich text is only rewritten when its plain-text view was edited, so a
    // listing with links or lists keeps them when staff fix only a phone number.
    toValues: (f, original) => {
      const base = CONFIG.business.toForm(original);
      return {
        name: f.name,
        category: f.category,
        summary: f.summary,
        description_html: f.description === base.description ? original?.description_html : textToHtml(f.description),
        hours_html: f.hours === base.hours ? original?.hours_html : textToHtml(f.hours),
        phone: f.phone,
        email: f.email,
        website: f.website,
        facebook: f.facebook,
        instagram: f.instagram,
        address: f.address,
        image: f.image,
      };
    },
  },
};

function Field({ label, hint, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-stone-500">{hint}</p>}
    </div>
  );
}

function ItemForm({ kind, item, onDone }) {
  const cfg = CONFIG[kind];
  const isNew = !item;
  const [form, setForm] = useState(() => cfg.toForm(item));
  const [slug, setSlug] = useState(item?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(item));
  const [dateTextTouched, setDateTextTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const nameKey = kind === 'event' ? 'title' : 'name';
  const effectiveSlug = slugTouched ? slug : slugify(form[nameKey]);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const bind = (key) => ({ value: form[key], onChange: (e) => set({ [key]: e.target.value }), className: inputClass });

  const setDates = (patch) => {
    const next = { ...form, ...patch };
    if (!dateTextTouched) {
      next.date_time = displayDateTime(fromDateTimeInput(next.start), fromDateTimeInput(next.end));
    }
    setForm(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (isNew && slugInUse(kind, effectiveSlug)) {
      setError(`Another ${cfg.noun} already uses the address "${effectiveSlug}". Change the name or the web address.`);
      return;
    }
    if (kind === 'event' && !form.start) {
      setError('Pick a start date and time.');
      return;
    }
    for (const key of ['external_url', 'website', 'facebook', 'instagram', 'image']) {
      if (form[key] && !/^https?:\/\//i.test(form[key].trim())) {
        setError('Web addresses must start with http:// or https://');
        return;
      }
    }
    setBusy(true);
    try {
      await saveItem(kind, {
        slug: effectiveSlug,
        values: cfg.toValues(form, item),
        hidden: item?.hidden || false,
      });
      onDone(`Saved "${form[nameKey]}". It is live on the site now.`);
    } catch (err) {
      console.warn('Save failed:', err);
      setError(
        err?.code === 'permission-denied'
          ? 'Your account is not allowed to save changes.'
          : err?.message?.startsWith('A ') || err?.message?.startsWith('The ')
            ? err.message
            : 'The change could not be saved. Check your connection and try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 max-w-2xl">
      <button type="button" onClick={() => onDone('')} className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-senoia-red">
        <ArrowLeft className="w-4 h-4" /> Back to the list
      </button>
      <h2 className="text-lg font-bold font-serif text-stone-900">
        {isNew ? `Add a ${cfg.noun}` : `Edit ${cfg.nameOf(item)}`}
      </h2>

      {kind === 'event' ? (
        <>
          <Field label="Title"><input required {...bind('title')} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Starts">
              <input type="datetime-local" required className={inputClass} value={form.start} onChange={(e) => setDates({ start: e.target.value })} />
            </Field>
            <Field label="Ends (optional)" hint="Leave blank for a single-session event.">
              <input type="datetime-local" className={inputClass} value={form.end} onChange={(e) => setDates({ end: e.target.value })} />
            </Field>
          </div>
          <Field label="Date text shown on the site" hint="Filled in from the start and end; change it for wording like “Every Saturday”.">
            <input
              className={inputClass}
              value={form.date_time}
              onChange={(e) => { setDateTextTouched(true); set({ date_time: e.target.value }); }}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Location"><input {...bind('location')} placeholder="Historic Downtown Senoia, GA" /></Field>
            <Field label="Category">
              <select className={inputClass} value={form.category} onChange={(e) => set({ category: e.target.value })}>
                {[...new Set([...EVENT_CATEGORIES, form.category])].filter(Boolean).map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description"><textarea rows={4} {...bind('description')} /></Field>
          <Field label="Image address" hint="A full https:// link to the picture shown on the card and page.">
            <input type="url" {...bind('image')} placeholder="https://" />
          </Field>
          <Field label="Event website (optional)" hint="When set, the event's card goes straight to this site in a new tab.">
            <input type="url" {...bind('external_url')} placeholder="https://" />
          </Field>
        </>
      ) : (
        <>
          <Field label="Business name"><input required {...bind('name')} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category" hint="Decides which directory filter lists it.">
              <select className={inputClass} value={form.category} onChange={(e) => set({ category: e.target.value })}>
                {[...new Set([...BUSINESS_CATEGORIES, form.category])].filter(Boolean).map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Short summary"><input {...bind('summary')} placeholder="e.g. Sim racing arcade" maxLength={300} /></Field>
          </div>
          <Field label="Address" hint="Include the unit or floor, e.g. “Lower level, 48 Main Street, Senoia, Georgia 30276”.">
            <input {...bind('address')} />
          </Field>
          <Field label="Description" hint="Plain text; a blank line starts a new paragraph.">
            <textarea rows={5} {...bind('description')} />
          </Field>
          <Field label="Hours"><textarea rows={3} {...bind('hours')} placeholder="Opens November 1" /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone"><input {...bind('phone')} /></Field>
            <Field label="Email"><input type="email" {...bind('email')} /></Field>
            <Field label="Website"><input type="url" {...bind('website')} placeholder="https://" /></Field>
            <Field label="Facebook"><input type="url" {...bind('facebook')} placeholder="https://" /></Field>
            <Field label="Instagram"><input type="url" {...bind('instagram')} placeholder="https://" /></Field>
            <Field label="Image address"><input type="url" {...bind('image')} placeholder="https://" /></Field>
          </div>
        </>
      )}

      {isNew && (
        <Field label="Web address" hint={`Fixed once saved: ${kind === 'event' ? '/events/' : '/downtown-business/'}${effectiveSlug || '…'}`}>
          <input
            className={inputClass}
            value={effectiveSlug}
            onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); }}
          />
        </Field>
      )}

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3" role="alert">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-xs font-semibold shadow-xs disabled:opacity-60">
          {busy ? 'Saving…' : isNew ? `Add ${cfg.noun}` : 'Save changes'}
        </button>
        <button type="button" onClick={() => onDone('')} className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Badge({ tone, children }) {
  const tones = {
    hidden: 'bg-stone-200 text-stone-700',
    edited: 'bg-amber-100 text-amber-800',
    added: 'bg-emerald-100 text-emerald-800',
  };
  return <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${tones[tone]}`}>{children}</span>;
}

/**
 * The portal's Events and Merchant Directory tabs. One component, two kinds:
 * lists every item (hidden ones included) merged with staff edits, and saves
 * straight to Firestore. See services/dataService.js for how the site merges.
 */
export default function ContentAdmin({ kind }) {
  const cfg = CONFIG[kind];
  const k = KINDS[kind];
  useContentOverrides();
  const items = k.all();

  const [editing, setEditing] = useState(undefined); // undefined: list; null: new; item: editing
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  // Saving over a list that failed to load (or came from a stale cache) could
  // erase another admin's edits, so editing waits for a fresh, successful load.
  const [loadState, setLoadState] = useState('loading'); // loading | ok | error
  const [busySlug, setBusySlug] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoadState('loading');
    setLoadState((await loadOverrides({ force: true })) ? 'ok' : 'error');
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items.filter((i) => {
      const edited = i._overridden && (!i._builtIn || hasContentEdits(kind, i));
      if (filter === 'hidden' && !i.hidden) return false;
      if (filter === 'changed' && !(edited || i.hidden)) return false;
      return !q || `${cfg.nameOf(i)} ${cfg.secondary(i)}`.toLowerCase().includes(q);
    });
    // Events: newest first. Directory: alphabetical.
    return kind === 'event'
      ? [...list].sort((a, b) => new Date(b.start || 0) - new Date(a.start || 0))
      : [...list].sort((a, b) => cfg.nameOf(a).localeCompare(cfg.nameOf(b)));
  }, [items, filter, search, kind, cfg]);

  const act = async (item, fn, success, failure) => {
    setBusySlug(item.slug);
    setNotice('');
    setError('');
    try {
      await fn();
      setNotice(success);
    } catch (err) {
      console.warn(failure, err);
      setError(err?.code === 'permission-denied' ? 'Your account is not allowed to make this change.' : failure);
    } finally {
      setBusySlug('');
    }
  };

  if (editing !== undefined && loadState === 'ok') {
    return (
      <ItemForm
        key={editing?.slug || 'new'}
        kind={kind}
        item={editing}
        onDone={(message) => {
          setEditing(undefined);
          setError('');
          setNotice(message);
        }}
      />
    );
  }

  const name = (i) => cfg.nameOf(i);
  const toggleHidden = (item) => {
    const hide = !item.hidden;
    act(
      item,
      () => setHidden(kind, item, hide),
      hide ? `"${name(item)}" is hidden and no longer appears on the site.` : `"${name(item)}" is showing on the site again.`,
      `"${name(item)}" could not be ${hide ? 'hidden' : 'shown'}. Check your connection and try again.`
    );
  };
  const reset = (item) => {
    if (!window.confirm(`Discard every change to "${name(item)}" and restore the original?`)) return;
    act(item, () => removeOverride(kind, item.slug), `"${name(item)}" was restored to the original.`, `"${name(item)}" could not be restored.`);
  };
  const remove = (item) => {
    if (!window.confirm(`Delete "${name(item)}" permanently? This cannot be undone. (To just take it off the site, use Hide.)`)) return;
    act(item, () => removeOverride(kind, item.slug), `"${name(item)}" was deleted.`, `"${name(item)}" could not be deleted.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold font-serif text-stone-900">{cfg.title}</h2>
          <p className="text-xs text-stone-500">{cfg.blurb}</p>
        </div>
        <button type="button" disabled={loadState !== 'ok'} onClick={() => { setNotice(''); setError(''); setEditing(null); }} className="disabled:opacity-50 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-senoia-red hover:bg-senoia-darkred text-white text-xs font-semibold shadow-xs">
          <Plus className="w-4 h-4" />
          <span>{kind === 'event' ? 'New event' : 'Add business'}</span>
        </button>
      </div>

      {loadState === 'loading' && <p className="text-sm text-stone-500" role="status">Loading the latest changes…</p>}
      {loadState === 'error' && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3" role="alert">
          <span>The latest changes could not be loaded, so editing is switched off to avoid overwriting someone else&rsquo;s work.</span>
          <button type="button" onClick={refresh} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      )}
      {notice && <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3" role="status">{notice}</p>}
      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3" role="alert">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[12rem] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${cfg.plural.toLowerCase()}…`}
            className={`${inputClass} pl-9`}
            aria-label={`Search ${cfg.plural.toLowerCase()}`}
          />
        </div>
        <div className="flex gap-1.5">
          {[['all', 'All'], ['changed', 'Edited, added or hidden'], ['hidden', 'Hidden']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === id ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-stone-500">Nothing matches.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {rows.map((item) => {
            const busy = busySlug === item.slug || loadState !== 'ok';
            const edited = item._builtIn && item._overridden && hasContentEdits(kind, item);
            return (
              <li key={item.slug} className={`py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${item.hidden ? 'opacity-70' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.hidden && <Badge tone="hidden">Hidden</Badge>}
                    {!item._builtIn && <Badge tone="added">Added by staff</Badge>}
                    {edited && <Badge tone="edited">Edited</Badge>}
                    <h3 className="font-semibold text-stone-900 truncate">{name(item)}</h3>
                  </div>
                  <p className="mt-1 text-xs text-stone-500 truncate">
                    {kind === 'event' && item.start && !item.date_time ? LIST_DATE.format(new Date(item.start)) : cfg.secondary(item)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => { setNotice(''); setError(''); setEditing(item); }} disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800 disabled:opacity-50">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => toggleHidden(item)} disabled={busy} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800 disabled:opacity-50">
                    {item.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {busy ? 'Working…' : item.hidden ? 'Show' : 'Hide'}
                  </button>
                  {edited && (
                    <button type="button" onClick={() => reset(item)} disabled={busy} className="p-1.5 text-stone-400 hover:text-senoia-red disabled:opacity-50" title="Restore the original" aria-label={`Restore the original ${name(item)}`}>
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  {!item.hidden && (
                    <a href={cfg.publicPath(item)} target="_blank" rel="noreferrer" className="p-1.5 text-stone-400 hover:text-senoia-red" title="View on site" aria-label={`View ${name(item)} on the site`}>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {!item._builtIn && (
                    <button type="button" onClick={() => remove(item)} disabled={busy} className="p-1.5 text-stone-400 hover:text-red-700 disabled:opacity-50" title="Delete" aria-label={`Delete ${name(item)}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
