/**
 * The Tour of Homes chauffeured BMW silent auction (/auction on
 * christmas.enjoysenoia.com). See functions/auction.js for the whole flow.
 *
 * Lots (one per car) are public Firestore documents, watched live. Asking for a
 * bidding link, looking up the bidder and placing a bid all go through Cloud
 * Functions; bids and bidders are never readable or writable from a browser
 * except by staff (firestore.rules).
 */
import { httpsCallable } from 'firebase/functions';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, functions } from './firebase';

export const LOTS = 'auction_lots';
const BIDS = 'auction_bids';
const BIDDERS = 'auction_bidders';
const TOKEN_KEY = 'toh-auction-token';
const TOKEN_RE = /^[a-f0-9]{48}$/;

/** The smallest bid a lot will take next. Mirrors minimumBid() in functions/auction.js. */
export const minimumBid = (lot) => (typeof lot.highBid === 'number' ? lot.highBid + lot.increment : lot.openingBid);

/** Whether a lot takes bids right now. Mirrors lotClosedReason() in functions/auction.js. */
export const isLotOpen = (lot, now = Date.now()) =>
  lot.open === true && typeof lot.closesAt?.toMillis === 'function' && now < lot.closesAt.toMillis();

const bySortOrder = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.title.localeCompare(b.title);

/** Live lots for the public page. Returns an unsubscribe function. */
export function watchLots(onLots, onError) {
  return onSnapshot(
    collection(db, LOTS),
    (snap) => onLots(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(bySortOrder)),
    onError
  );
}

/* ----------------------------- bidding link ----------------------------- */

// The token is the bidder's credential. Wrapped in try/catch: storage can be
// blocked (private windows), and the page still works from the ?t= link.
export function loadToken() {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    return t && TOKEN_RE.test(t) ? t : null;
  } catch {
    return null;
  }
}

export function saveToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* keep going without it */
  }
}

export const isToken = (t) => typeof t === 'string' && TOKEN_RE.test(t);

/**
 * @param {{name: string, email: string, phone: string, website: string, elapsedMs: number}} fields
 *   `website` is the honeypot. Resolves the same way whether or not tickets were found.
 */
export async function requestAuctionLink(fields) {
  const call = httpsCallable(functions, 'requestAuctionLink', { limitedUseAppCheckTokens: true });
  await call({
    name: fields.name.trim(),
    email: fields.email.trim(),
    phone: fields.phone.trim(),
    website: fields.website || '',
    elapsedMs: fields.elapsedMs,
  });
}

/** @returns {Promise<{name: string, email: string, bids: Object<string, {amount: number, leading: boolean}>}>} */
export async function getAuctionBidder(token) {
  const call = httpsCallable(functions, 'getAuctionBidder');
  return (await call({ token })).data;
}

export async function placeAuctionBid(token, lotId, amount) {
  const call = httpsCallable(functions, 'placeAuctionBid');
  return (await call({ token, lotId, amount })).data;
}

/* ------------------------------ admin side ------------------------------ */

// Bidding closes Sunday, December 6 at 8 PM Eastern (agreed 2026-11-13).
export const DEFAULT_CLOSE = '2026-12-06T20:00';

/** The three cars BMW of South Atlanta lends. Created closed; staff open them. */
export const DEFAULT_LOTS = [1, 2, 3].map((n) => ({
  id: `car-${n}`,
  title: `BMW Car ${n}`,
  subtitle: 'Chauffeured Candlelight Tour of Homes for up to 4',
  sortOrder: n,
}));

/**
 * "2026-12-06T20:00" read as Eastern time, to a Timestamp. Fixed at EST
 * (-05:00): the auction runs entirely between the November and March clock
 * changes.
 */
export function easternToTimestamp(local) {
  return Timestamp.fromDate(new Date(`${local}:00-05:00`));
}

/** A Timestamp as "YYYY-MM-DDTHH:mm" Eastern, for a datetime-local input. */
export function timestampToEastern(ts) {
  if (!ts?.toDate) return DEFAULT_CLOSE;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    })
      .formatToParts(ts.toDate())
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export async function getLots() {
  const snap = await getDocs(collection(db, LOTS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(bySortOrder);
}

/** Creates any of the three default cars that don't exist yet, closed. */
export async function createDefaultLots() {
  for (const { id, ...fields } of DEFAULT_LOTS) {
    const ref = doc(db, LOTS, id);
    if ((await getDoc(ref)).exists()) continue;
    await setDoc(ref, {
      ...fields,
      seats: 4,
      openingBid: 200,
      increment: 25,
      closesAt: easternToTimestamp(DEFAULT_CLOSE),
      open: false,
      highBid: null,
      bidCount: 0,
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Saves a lot's details. The bid fields are carried over from the live
 * document inside a transaction, so an edit made while someone bids cannot
 * roll the high bid back.
 */
export async function saveLot(id, fields) {
  const ref = doc(db, LOTS, id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('That car is no longer in the auction.');
    const live = snap.data();
    const data = {
      title: fields.title.trim(),
      openingBid: Number(fields.openingBid),
      increment: Number(fields.increment),
      seats: Number(fields.seats),
      sortOrder: Number(fields.sortOrder) || 0,
      closesAt: easternToTimestamp(fields.closesAt),
      open: Boolean(fields.open),
      highBid: live.highBid ?? null,
      bidCount: live.bidCount ?? 0,
      updatedAt: serverTimestamp(),
    };
    for (const key of ['subtitle', 'description', 'image']) {
      if (fields[key] && fields[key].trim()) data[key] = fields[key].trim();
    }
    if (live.highBidId) data.highBidId = live.highBidId;
    if (live.lastBidAt) data.lastBidAt = live.lastBidAt;
    tx.set(ref, data);
  });
}

/** Every bid, newest first. A few dozen at most, so no index or paging. */
export async function getBids() {
  const snap = await getDocs(collection(db, BIDS));
  const ms = (b) => b.createdAt?.toMillis?.() ?? 0;
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => ms(b) - ms(a));
}

export async function getBidders() {
  const snap = await getDocs(collection(db, BIDDERS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Voids a bid (a joke, a mistake, a bidder without tickets) and resets the
 * lot's high bid to the best bid left. `lotBids` is the bid list read just
 * before. If someone bid in between, the lot's highBidId will already have
 * moved past the voided bid, so the live high bid is kept as it is.
 */
export async function voidBid(bid, lotBids, voidedBy) {
  const bidRef = doc(db, BIDS, bid.id);
  const lotRef = doc(db, LOTS, bid.lotId);
  const best = lotBids
    .filter((b) => b.id !== bid.id && b.lotId === bid.lotId && b.status === 'active')
    .sort((a, b) => b.amount - a.amount)[0];
  await runTransaction(db, async (tx) => {
    const lotSnap = await tx.get(lotRef);
    tx.update(bidRef, { status: 'void', voidedAt: serverTimestamp(), voidedBy: voidedBy || 'admin' });
    if (!lotSnap.exists()) return;
    const { highBidId, ...lot } = lotSnap.data();
    // bidCount is what the public page shows, so it counts live bids only.
    const next = { ...lot, bidCount: Math.max(0, (lot.bidCount ?? 0) - 1), updatedAt: serverTimestamp() };
    if (highBidId === bid.id) {
      next.highBid = best ? best.amount : null;
      if (best) next.highBidId = best.id;
    } else if (highBidId) {
      next.highBidId = highBidId;
    }
    tx.set(lotRef, next);
  });
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** One row per lot: its winner (the high bid) and how to reach them. */
export function winnersToCsv(lots, bids) {
  const rows = [['Car', 'Winning bid', 'Name', 'Email', 'Phone', 'Bids on car']];
  for (const lot of lots) {
    const win = bids.find((b) => b.id === lot.highBidId && b.status === 'active');
    rows.push([lot.title, win ? win.amount : '', win?.name, win?.email, win?.phone, lot.bidCount ?? 0]);
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}
