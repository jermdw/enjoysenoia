import React, { useCallback, useEffect, useState } from 'react';
import { Download, ExternalLink, RefreshCw, Save, Ban } from 'lucide-react';
import { auth } from '../../services/firebase';
import {
  createDefaultLots,
  getBidders,
  getBids,
  getLots,
  saveLot,
  timestampToEastern,
  voidBid,
  winnersToCsv,
} from '../../services/auctionService';

/**
 * The Tour of Homes chauffeured BMW silent auction: its three cars (lots), every
 * bid with the bidder's contact details, and the winners. Bids arrive only
 * through the placeAuctionBid function; staff can edit a car, open or close it,
 * and void a bid. Bids, bidders and the void are admin-only in firestore.rules.
 */

const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-senoia-red/40';
const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString('en-US')}` : '—');
const when = (ts) =>
  ts?.toDate
    ? ts.toDate().toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';

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

export default function AuctionAdmin() {
  const [data, setData] = useState({ status: 'loading', lots: [], bids: [], bidders: [] });
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setData((d) => ({ ...d, status: 'loading' }));
    try {
      const [lots, bids, bidders] = await Promise.all([getLots(), getBids(), getBidders()]);
      setData({ status: 'ready', lots, bids, bidders });
    } catch (err) {
      console.warn('Could not load the auction:', err);
      setData((d) => ({ ...d, status: 'error' }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setup = async () => {
    setError(null);
    try {
      await createDefaultLots();
      await load();
    } catch (err) {
      setError(err.message || 'Could not create the cars.');
    }
  };

  const exportBids = () => {
    const titles = Object.fromEntries(data.lots.map((l) => [l.id, l.title]));
    const rows = [['Time (Eastern)', 'Car', 'Amount', 'Status', 'Name', 'Email', 'Phone']];
    for (const b of data.bids) rows.push([when(b.createdAt), titles[b.lotId] || b.lotId, b.amount, b.status, b.name, b.email, b.phone]);
    downloadCsv(
      'tour-of-homes-auction-bids.csv',
      rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold font-serif text-stone-900">Tour of Homes BMW Auction</h2>
          <p className="text-xs text-stone-500">
            Three cars, three silent auctions, ticket holders only.{' '}
            <a href="https://christmas.enjoysenoia.com/auction" target="_blank" rel="noreferrer" className="underline">
              Public page <ExternalLink className="inline w-3 h-3" />
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={load} disabled={data.status === 'loading'} className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-xs font-semibold">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button onClick={() => downloadCsv('tour-of-homes-auction-winners.csv', winnersToCsv(data.lots, data.bids))} disabled={!data.lots.length} className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold">
            <Download className="w-4 h-4" />
            <span>Winners CSV</span>
          </button>
          <button onClick={exportBids} disabled={!data.bids.length} className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-xs font-semibold">
            <Download className="w-4 h-4" />
            <span>All bids CSV</span>
          </button>
        </div>
      </div>

      {data.status === 'error' && <p className="text-sm text-red-700" role="alert">Could not load the auction. Try Refresh.</p>}
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}

      {data.status === 'ready' && data.lots.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 p-6 text-sm text-stone-600 space-y-3">
          <p>
            The auction isn't set up yet. This creates the three cars, <strong>closed</strong>, with a $200 opening bid,
            $25 steps, four seats, and bidding closing Sunday, December 6 at 8 PM. The models (2026 X7, X5, iX) and
            photos are placeholders until BMW of South Atlanta confirms its cars. Edit them, then open bidding on each.
          </p>
          <button onClick={setup} className="px-4 py-2 rounded-xl bg-senoia-red text-white text-xs font-semibold">
            Set up the three cars
          </button>
        </div>
      )}

      {data.lots.map((lot) => (
        <LotPanel
          key={lot.id}
          lot={lot}
          bids={data.bids.filter((b) => b.lotId === lot.id)}
          onChanged={load}
        />
      ))}

      {data.status === 'ready' && (
        <details className="rounded-xl border border-stone-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-stone-800">
            Verified ticket holders who asked for a bidding link ({data.bidders.length})
          </summary>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 text-xs font-semibold uppercase text-stone-500">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Tickets</th>
                  <th className="p-2">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.bidders.map((b) => (
                  <tr key={b.id}>
                    <td className="p-2 text-stone-900">{b.name}</td>
                    <td className="p-2">{b.email}</td>
                    <td className="p-2">{b.phone}</td>
                    <td className="p-2">{b.ticketCount}</td>
                    <td className="p-2 text-xs">{when(b.verifiedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

function LotPanel({ lot, bids, onChanged }) {
  const [form, setForm] = useState(() => ({
    title: lot.title || '',
    subtitle: lot.subtitle || '',
    description: lot.description || '',
    image: lot.image || '',
    openingBid: String(lot.openingBid ?? 200),
    increment: String(lot.increment ?? 25),
    seats: String(lot.seats ?? 4),
    sortOrder: String(lot.sortOrder ?? 0),
    closesAt: timestampToEastern(lot.closesAt),
    open: Boolean(lot.open),
  }));
  const [state, setState] = useState({ status: 'idle', message: null });
  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const leader = bids.find((b) => b.id === lot.highBidId && b.status === 'active');
  const closed = lot.closesAt?.toMillis && Date.now() >= lot.closesAt.toMillis();

  const save = async (e) => {
    e.preventDefault();
    const ints = ['openingBid', 'increment', 'seats'].every((k) => Number.isInteger(Number(form[k])) && Number(form[k]) >= 1);
    if (!form.title.trim() || !ints || !form.closesAt) {
      setState({ status: 'idle', message: 'Title, whole-dollar amounts, seats and a closing time are required.' });
      return;
    }
    setState({ status: 'saving', message: null });
    try {
      await saveLot(lot.id, form);
      setState({ status: 'idle', message: 'Saved.' });
      onChanged();
    } catch (err) {
      setState({ status: 'idle', message: err.message || 'Could not save.' });
    }
  };

  const voidOne = async (bid) => {
    if (!window.confirm(`Void ${bid.name}'s ${money(bid.amount)} bid on ${lot.title}? The next-best bid becomes the high bid. This can't be undone.`)) return;
    try {
      await voidBid(bid, bids, auth.currentUser?.email);
      onChanged();
    } catch (err) {
      window.alert(err.message || 'Could not void that bid.');
    }
  };

  return (
    <section className="rounded-xl border border-stone-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 p-4">
        <div>
          <h3 className="font-semibold text-stone-900">{lot.title}</h3>
          <p className="text-xs text-stone-500">
            High bid <strong className="text-stone-800">{money(lot.highBid)}</strong> · {lot.bidCount ?? 0} bids · closes {when(lot.closesAt)} ET
          </p>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          closed ? 'bg-stone-200 text-stone-700' : lot.open ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {closed ? 'Closed' : lot.open ? 'Open for bids' : 'Not open'}
        </span>
      </header>

      {leader && (
        <p className="px-4 pt-3 text-sm text-stone-700">
          {closed ? 'Winner' : 'Leading'}: <strong>{leader.name}</strong> · {leader.email} · {leader.phone}
        </p>
      )}

      <form onSubmit={save} className="grid gap-3 p-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-stone-600 sm:col-span-2">
          Title (e.g. the car's model)
          <input className={inputClass} value={form.title} onChange={set('title')} maxLength={120} />
        </label>
        <label className="text-xs font-semibold text-stone-600 sm:col-span-2">
          Subtitle
          <input className={inputClass} value={form.subtitle} onChange={set('subtitle')} maxLength={200} />
        </label>
        <label className="text-xs font-semibold text-stone-600 sm:col-span-2">
          Description (optional)
          <textarea className={inputClass} rows={2} value={form.description} onChange={set('description')} maxLength={2000} />
        </label>
        <label className="text-xs font-semibold text-stone-600 sm:col-span-2">
          Photo (optional: an https link, or a path on this site)
          <input className={inputClass} value={form.image} onChange={set('image')} maxLength={2000} placeholder="https://…" />
        </label>
        <label className="text-xs font-semibold text-stone-600">
          Opening bid ($)
          <input className={inputClass} type="number" min="1" step="1" value={form.openingBid} onChange={set('openingBid')} />
        </label>
        <label className="text-xs font-semibold text-stone-600">
          Minimum raise ($)
          <input className={inputClass} type="number" min="1" step="1" value={form.increment} onChange={set('increment')} />
        </label>
        <label className="text-xs font-semibold text-stone-600">
          Seats
          <input className={inputClass} type="number" min="1" max="12" step="1" value={form.seats} onChange={set('seats')} />
        </label>
        <label className="text-xs font-semibold text-stone-600">
          Order on page
          <input className={inputClass} type="number" step="1" value={form.sortOrder} onChange={set('sortOrder')} />
        </label>
        <label className="text-xs font-semibold text-stone-600">
          Bidding closes (Eastern)
          <input className={inputClass} type="datetime-local" value={form.closesAt} onChange={set('closesAt')} />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-stone-800 self-end pb-2">
          <input type="checkbox" checked={form.open} onChange={set('open')} />
          Open for bids
        </label>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={state.status === 'saving'} className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-senoia-red text-white text-xs font-semibold disabled:opacity-50">
            <Save className="w-4 h-4" />
            <span>{state.status === 'saving' ? 'Saving…' : 'Save car'}</span>
          </button>
          {state.message && <span className="text-xs text-stone-600" role="status">{state.message}</span>}
        </div>
      </form>

      <div className="overflow-x-auto border-t border-stone-100">
        {bids.length === 0 ? (
          <p className="p-4 text-sm text-stone-500">No bids yet.</p>
        ) : (
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 text-xs font-semibold uppercase text-stone-500">
              <tr>
                <th className="p-2">Time (ET)</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Bidder</th>
                <th className="p-2">Contact</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {bids.map((b) => (
                <tr key={b.id} className={b.status === 'void' ? 'opacity-50 line-through' : ''}>
                  <td className="p-2 text-xs whitespace-nowrap">{when(b.createdAt)}</td>
                  <td className="p-2 font-semibold text-stone-900">{money(b.amount)}</td>
                  <td className="p-2">{b.name}</td>
                  <td className="p-2 text-xs">{b.email}<br />{b.phone}</td>
                  <td className="p-2 text-right">
                    {b.status === 'active' && (
                      <button onClick={() => voidOne(b)} className="inline-flex items-center gap-1 text-xs text-red-700 hover:underline">
                        <Ban className="w-3.5 h-3.5" /> Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
