/**
 * Masquerade Red Carpet photo downloads (/red-carpet on thehalloweenmasquerade.com).
 *
 * A guest asks for a link with the email they bought tickets with; the
 * requestRedCarpetLink function emails it if the address is on the guest list.
 * The link's token then unlocks the photos through the redCarpetPhotos HTTP
 * function. See functions/redCarpet.js for the whole flow.
 */
import { httpsCallable } from 'firebase/functions';
import { emulatorHost, functions } from './firebase';

// An HTTP function, not a callable: <img> tags load the photos straight from it.
// Region matches functions/index.js.
const project = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const emulator = emulatorHost('VITE_FUNCTIONS_EMULATOR_HOST');
const PHOTOS_URL = emulator
  ? `http://${emulator.join(':')}/${project}/us-central1/redCarpetPhotos`
  : `https://us-central1-${project}.cloudfunctions.net/redCarpetPhotos`;

/**
 * @param {{email: string, website: string, elapsedMs: number}} fields
 *   `website` is the honeypot; `elapsedMs` is how long the form was open.
 * Resolves the same way whether or not the address is on the guest list.
 */
export async function requestRedCarpetLink(fields) {
  const call = httpsCallable(functions, 'requestRedCarpetLink', { limitedUseAppCheckTokens: true });
  await call({ email: fields.email.trim(), website: fields.website || '', elapsedMs: fields.elapsedMs });
}

/**
 * The photo numbers a link unlocks, and when it stops working.
 * @returns {Promise<{photos: string[], expiresAt: string}>}
 * @throws an Error with `.status` 404 (no such link) or 410 (expired).
 */
export async function fetchRedCarpetPhotos(token) {
  const res = await fetch(`${PHOTOS_URL}?t=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const err = new Error(`redCarpetPhotos answered ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const thumbUrl = (token, n) => `${PHOTOS_URL}?t=${encodeURIComponent(token)}&n=${n}`;

export const downloadUrl = (token, n) => `${PHOTOS_URL}?t=${encodeURIComponent(token)}&n=${n}&size=full`;
