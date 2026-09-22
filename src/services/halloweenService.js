/**
 * Firestore access for the Senoia Halloween micro-site.
 *
 * TWO COLLECTIONS, AND THE SPLIT IS THE WHOLE POINT
 * -------------------------------------------------
 * Firestore rules are per-document: there is no way to allow a public read of
 * *some* fields. A single collection holding {name, address, email} could
 * therefore never be public-readable without publishing every entrant's name
 * and email address to anyone who opens the map.
 *
 *   halloween_signups     full entry. Public CREATE, no public read.
 *                         Admin-only read/update/delete.
 *   halloween_map_points  address + coordinates only, never a name or email.
 *                         Public READ, admin-only write.
 *
 * Nothing moves between them automatically. An admin reviews a sign-up and
 * publishes it, which is also the spam gate — a public-write, public-read
 * collection would let anyone drop an arbitrary address onto a map of a town's
 * trick-or-treat route.
 *
 * Road closures and parking are the same kind of record (a pin with a
 * category), so they live in halloween_map_points too, created by an admin
 * directly rather than promoted from a sign-up.
 */
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

export const SIGNUPS = 'halloween_signups';
export const MAP_POINTS = 'halloween_map_points';

/** Who is entering, mirrored in firestore.rules. Drives map eligibility. */
export const CATEGORIES = ['residential', 'business'];

/**
 * Which judging lane the entry is in, mirrored in firestore.rules.
 * Deliberately separate from CATEGORIES: they are orthogonal questions, and a
 * business can enter either lane. Collapsing them into one four-value enum
 * would break every `category === 'residential'` check that gates the map.
 */
export const CONTEST_CATEGORIES = ['spooky', 'pumpkinPals'];

/** Map point categories, mirrored in firestore.rules. */
export const POINT_KINDS = ['residential', 'closure', 'parking'];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Validates a sign-up in the browser. The same shape is enforced in
 * firestore.rules — this exists to give a useful message, not to secure
 * anything. Returns a map of field -> message; empty means valid.
 */
export function validateSignup({ name, address, email, category, contestCategory }) {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Please enter your name.';
  if (name && name.trim().length > 120) errors.name = 'That name is too long.';
  if (!address || address.trim().length < 5) errors.address = 'Please enter a street address.';
  if (address && address.trim().length > 200) errors.address = 'That address is too long.';
  if (!email || !EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (email && email.trim().length > 254) errors.email = 'That email address is too long.';
  if (!CATEGORIES.includes(category)) errors.category = 'Choose home or business.';
  if (!CONTEST_CATEGORIES.includes(contestCategory)) errors.contestCategory = 'Choose Spooky or Pumpkin Pals.';
  return errors;
}

/**
 * Records a decorating-contest entry. Writes only — the form never reads this
 * collection back, and rules forbid it from doing so.
 *
 * `status: 'pending'` is what keeps the entry off the map until an admin
 * publishes it. Rules pin this value on create so a caller cannot self-approve.
 */
export async function submitSignup({ name, address, email, category, contestCategory }) {
  const errors = validateSignup({ name, address, email, category, contestCategory });
  if (Object.keys(errors).length > 0) {
    const err = new Error('Invalid sign-up');
    err.fieldErrors = errors;
    throw err;
  }

  await addDoc(collection(db, SIGNUPS), {
    name: name.trim(),
    address: address.trim(),
    email: email.trim().toLowerCase(),
    category,
    contestCategory,
    status: 'pending',
    submittedAt: serverTimestamp(),
    source: 'halloween_2026',
  });
}

/**
 * Public map pins. Safe to call unauthenticated: this collection carries no
 * personal data beyond a street address the entrant agreed to publish.
 */
export async function getMapPoints() {
  const snap = await getDocs(query(collection(db, MAP_POINTS), orderBy('kind')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ------------------------------------------------------------------ *
 * Admin-only below. Every one of these fails for a signed-out visitor
 * at the rules layer, not here.
 * ------------------------------------------------------------------ */

/**
 * All sign-ups, newest first. Admin portal only.
 *
 * Passing `category` adds a `where` alongside the `orderBy`, which Firestore
 * can only serve from a composite index — it is declared in
 * firestore.indexes.json and must be deployed before that path is used.
 */
export async function getSignups({ category } = {}) {
  const clauses = [collection(db, SIGNUPS)];
  if (category) clauses.push(where('category', '==', category));
  clauses.push(orderBy('submittedAt', 'desc'));
  const snap = await getDocs(query(...clauses));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Publishes a residential sign-up to the map.
 *
 * Deliberately copies only the address — carrying `name` or `email` across
 * would defeat the split this module exists to enforce.
 *
 * `lat`/`lng` are supplied by the admin placing the pin. Passing null is
 * allowed and leaves the point unplaced (the map skips it), so no geocoding
 * service is required to run the site.
 */
export async function publishMapPoint({ signupId, address, lat = null, lng = null, kind = 'residential', label = null }) {
  if (!POINT_KINDS.includes(kind)) throw new Error(`Unknown map point kind: ${kind}`);

  // Batched, so the pin and the sign-up's `published` mark land together. Two
  // sequential writes could leave a live pin against a sign-up still reading
  // `pending` — the admin would publish again and the same address would
  // appear on the map twice, with no way to tell the duplicates apart.
  const pointRef = doc(collection(db, MAP_POINTS));
  const batch = writeBatch(db);

  batch.set(pointRef, {
    address: address.trim(),
    lat,
    lng,
    kind,
    label,
    createdAt: serverTimestamp(),
  });

  if (signupId) {
    batch.update(doc(db, SIGNUPS, signupId), { status: 'published', mapPointId: pointRef.id });
  }

  await batch.commit();
  return pointRef.id;
}

/** Moves or relabels an existing pin — used for road closures and parking. */
export async function updateMapPoint(id, patch) {
  await updateDoc(doc(db, MAP_POINTS, id), patch);
}

export async function deleteMapPoint(id) {
  await deleteDoc(doc(db, MAP_POINTS, id));
}

/**
 * The Google Sheets half of the brief.
 *
 * The brief asks for sign-ups to land in a Google Sheet. A live Firestore ->
 * Sheets sync needs a Cloud Function and the Blaze plan; this repo has neither.
 * A CSV with the three requested columns imports into Sheets in one step
 * (File > Import > Upload), so that is the default. See README-halloween.md
 * for the Function-based upgrade if the organizer wants it automatic.
 */
export function signupsToCsv(signups) {
  const header = ['Name', 'Address', 'Email Address', 'Type', 'Contest Category', 'Submitted'];
  // Excel and Sheets both treat a leading =, +, - or @ as a formula. Prefixing
  // with a quote neutralises it without changing what a human reads.
  const cell = (value) => {
    const s = value == null ? '' : String(value);
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const rows = signups.map((s) => [
    s.name,
    s.address,
    s.email,
    s.category,
    s.contestCategory,
    s.submittedAt?.toDate ? s.submittedAt.toDate().toISOString().slice(0, 10) : '',
  ]);
  return [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}
