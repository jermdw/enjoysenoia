/**
 * Volunteer shift sign-ups (/volunteer/:eventSlug), ported from the Senoia Car
 * Show's volunteer system.
 *
 *   volunteer_events/{eventSlug}         name, intro, signupOpen (the close switch)
 *   volunteer_events/{eventSlug}/shifts  role, time, note, spotsTotal, spotsFilled, sortOrder
 *   volunteer_signups/{id}               volunteer PII + cancelToken + status
 *
 * Visitors only ever READ events and shifts here (counts, no PII). A sign-up or
 * a cancellation goes through the submitVolunteerSignup / cancelVolunteerSignup
 * Cloud Functions (functions/index.js), which move `spotsFilled` inside a
 * transaction. The admin helpers below write directly and are enforced by
 * firestore.rules.
 *
 * Keep the checks in validateVolunteerSignup in step with
 * functions/volunteerSignup.js; they only give a useful message early.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  deleteDoc,
  addDoc,
  where,
  limit,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';

export const EVENTS = 'volunteer_events';
export const SIGNUPS = 'volunteer_signups';

export const LIMITS = { nameMax: 80, emailMax: 254, phoneMax: 40, noteMax: 500 };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Returns a map of field -> message; empty means valid. */
export function validateVolunteerSignup({ firstName, lastName, email, phone, note }) {
  const errors = {};
  const first = (firstName || '').trim();
  const last = (lastName || '').trim();
  const e = (email || '').trim();
  const p = (phone || '').trim();
  if (!first) errors.firstName = 'Please enter your first name.';
  else if (first.length > LIMITS.nameMax) errors.firstName = 'That name is too long.';
  if (!last) errors.lastName = 'Please enter your last name.';
  else if (last.length > LIMITS.nameMax) errors.lastName = 'That name is too long.';
  if (!EMAIL_RE.test(e)) errors.email = 'Please enter a valid email address.';
  else if (e.length > LIMITS.emailMax) errors.email = 'That email address is too long.';
  if (p.replace(/\D/g, '').length < 7) errors.phone = 'Please enter a phone number we can reach you on.';
  else if (p.length > LIMITS.phoneMax) errors.phone = 'That phone number is too long.';
  if ((note || '').trim().length > LIMITS.noteMax) errors.note = `Please keep this under ${LIMITS.noteMax} characters.`;
  return errors;
}

/**
 * @param {{eventSlug: string, shiftId: string, firstName: string, lastName: string, email: string, phone: string, note: string, website: string, elapsedMs: number}} fields
 *   `website` is the honeypot; `elapsedMs` is how long the form was open.
 * @throws an Error with `.fieldErrors` for invalid input, or `.code` from the
 *   function (`resource-exhausted`, `failed-precondition`, `not-found`, ...).
 */
export async function submitVolunteerSignup(fields) {
  const errors = validateVolunteerSignup(fields);
  if (Object.keys(errors).length > 0) {
    const err = new Error('Invalid sign-up');
    err.fieldErrors = errors;
    throw err;
  }
  const call = httpsCallable(functions, 'submitVolunteerSignup', { limitedUseAppCheckTokens: true });
  await call({
    eventSlug: fields.eventSlug,
    shiftId: fields.shiftId,
    firstName: fields.firstName.trim(),
    lastName: fields.lastName.trim(),
    email: fields.email.trim(),
    phone: fields.phone.trim(),
    note: (fields.note || '').trim(),
    website: fields.website || '',
    elapsedMs: fields.elapsedMs,
  });
}

export async function cancelVolunteerSignup(token) {
  const call = httpsCallable(functions, 'cancelVolunteerSignup', { limitedUseAppCheckTokens: true });
  await call({ token });
}

/** Live event + shifts for the public page. Returns an unsubscribe function. */
export function watchVolunteerEvent(eventSlug, { onEvent, onShifts, onError }) {
  const stopEvent = onSnapshot(doc(db, EVENTS, eventSlug), (snap) => onEvent(snap.exists() ? snap.data() : null), onError);
  const stopShifts = onSnapshot(
    query(collection(db, EVENTS, eventSlug, 'shifts'), orderBy('sortOrder')),
    (snap) => onShifts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
  return () => {
    stopEvent();
    stopShifts();
  };
}

/* ------------------------------ admin side ------------------------------ */

export async function getVolunteerEvent(eventSlug) {
  const snap = await getDoc(doc(db, EVENTS, eventSlug));
  return snap.exists() ? snap.data() : null;
}

/** Event-level fields: name, intro and the open/close switch. */
export async function saveVolunteerEvent(eventSlug, { name, intro, signupOpen }) {
  const data = { name: name.trim(), signupOpen: Boolean(signupOpen), updatedAt: serverTimestamp() };
  if (intro && intro.trim()) data.intro = intro.trim();
  await setDoc(doc(db, EVENTS, eventSlug), data);
}

export async function getShifts(eventSlug) {
  const snap = await getDocs(query(collection(db, EVENTS, eventSlug, 'shifts'), orderBy('sortOrder')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** New shift at zero filled (the rules require it). */
export async function addShift(eventSlug, { role, time, note, spotsTotal, sortOrder }) {
  const data = {
    role: role.trim(),
    time: time.trim(),
    spotsTotal: Number(spotsTotal),
    spotsFilled: 0,
    sortOrder: Number(sortOrder),
  };
  if (note && note.trim()) data.note = note.trim();
  await addDoc(collection(db, EVENTS, eventSlug, 'shifts'), data);
}

/**
 * Edits a shift's details. `spotsFilled` is carried through from the live
 * document inside a transaction, so an edit made while a volunteer signs up
 * cannot overwrite the count with a stale one.
 */
export async function updateShift(eventSlug, shiftId, { role, time, note, spotsTotal, sortOrder }) {
  const ref = doc(db, EVENTS, eventSlug, 'shifts', shiftId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('That shift no longer exists.');
    const data = {
      role: role.trim(),
      time: time.trim(),
      spotsTotal: Number(spotsTotal),
      spotsFilled: snap.data().spotsFilled ?? 0,
      sortOrder: Number(sortOrder),
    };
    if (note && note.trim()) data.note = note.trim();
    tx.set(ref, data);
  });
}

/** Active sign-ups for one shift, read from the server (not a stale list). */
async function activeSignupsForShift(eventSlug, shiftId) {
  const snap = await getDocs(
    query(
      collection(db, SIGNUPS),
      where('eventSlug', '==', eventSlug),
      where('shiftId', '==', shiftId),
      where('status', '==', 'active'),
      limit(1)
    )
  );
  return !snap.empty;
}

/** Refuses while the shift has active sign-ups, checked against the server. */
export async function deleteShift(eventSlug, shiftId) {
  if (await activeSignupsForShift(eventSlug, shiftId)) {
    throw new Error('This shift has volunteers signed up. Remove them first.');
  }
  await deleteDoc(doc(db, EVENTS, eventSlug, 'shifts', shiftId));
}

export async function getSignups(eventSlug) {
  // Sorted here, not in the query: equality on eventSlug plus an orderBy on
  // createdAt would need a composite index that is not deployed.
  const snap = await getDocs(query(collection(db, SIGNUPS), where('eventSlug', '==', eventSlug)));
  const ms = (s) => s.createdAt?.toMillis?.() ?? 0;
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => ms(b) - ms(a));
}

/**
 * Removes a volunteer: marks the sign-up cancelled and releases the spot in one
 * transaction that re-checks `status`, so a double click, or a race with the
 * volunteer's own cancel link, cannot release the spot twice. Floored at zero.
 */
export async function removeSignup(signup) {
  const signupRef = doc(db, SIGNUPS, signup.id);
  const shiftRef = doc(db, EVENTS, signup.eventSlug, 'shifts', signup.shiftId);
  await runTransaction(db, async (tx) => {
    const [signupSnap, shiftSnap] = await Promise.all([tx.get(signupRef), tx.get(shiftRef)]);
    if (!signupSnap.exists() || signupSnap.data().status !== 'active') return;
    tx.update(signupRef, { status: 'cancelled', cancelledAt: serverTimestamp() });
    if (shiftSnap.exists()) {
      const filled = shiftSnap.data().spotsFilled ?? 0;
      if (filled > 0) tx.update(shiftRef, { spotsFilled: filled - 1 });
    }
  });
}

/* --------------------------------- CSV ---------------------------------- */

/** Cells starting = + - @ (or a tab) are prefixed so a spreadsheet will not run them. */
const cell = (value) => {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

/** Roster in shift order. Every active sign-up is listed, even under a deleted shift. */
export function rosterToCsv(shifts, signups) {
  const byId = new Map(shifts.map((s) => [s.id, s]));
  const rows = signups
    .filter((s) => s.status === 'active')
    .map((s) => ({ shift: byId.get(s.shiftId), s }))
    .sort((a, b) => (a.shift?.sortOrder ?? 1e9) - (b.shift?.sortOrder ?? 1e9));
  const header = ['Role', 'When', 'First Name', 'Last Name', 'Email', 'Phone', 'Note', 'Signed Up'];
  const lines = [header.map(cell).join(',')];
  for (const { shift, s } of rows) {
    lines.push(
      [
        shift?.role ?? '(deleted shift)',
        shift?.time ?? '',
        s.firstName,
        s.lastName,
        s.email,
        s.phone,
        s.note || '',
        s.createdAt?.toDate?.().toISOString().slice(0, 16).replace('T', ' ') || '',
      ]
        .map(cell)
        .join(',')
    );
  }
  return lines.join('\r\n');
}
