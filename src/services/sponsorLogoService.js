/**
 * Sponsor logo upload (/sponsor-logo).
 *
 * Sends through the `submitSponsorLogo` Cloud Function (functions/index.js),
 * which verifies the App Check token, rate-limits, validates the file and files
 * it in the shared Drive folder. Nothing here can be trusted server-side; the
 * checks below only give a useful message early. Keep them in step with
 * functions/sponsorLogo.js.
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export const MAX_BYTES = 7 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'pdf', 'eps', 'ai'];
export const LIMITS = { sponsorMin: 2, sponsorMax: 120, nameMax: 120, emailMax: 254, eventMax: 120 };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const extensionOf = (name) => (/\.([A-Za-z0-9]+)$/.exec(name || '')?.[1] || '').toLowerCase();

/** Returns a map of field -> message; empty means valid. */
export function validateSponsorLogo({ sponsor, email, contactName, event }, file) {
  const errors = {};
  const s = (sponsor || '').trim();
  const e = (email || '').trim();
  if (s.length < LIMITS.sponsorMin) errors.sponsor = 'Please enter your business or sponsor name.';
  else if (s.length > LIMITS.sponsorMax) errors.sponsor = 'That name is too long.';
  if (!EMAIL_RE.test(e)) errors.email = 'Please enter a valid email address.';
  else if (e.length > LIMITS.emailMax) errors.email = 'That email address is too long.';
  if ((contactName || '').trim().length > LIMITS.nameMax) errors.contactName = 'That name is too long.';
  if ((event || '').trim().length > LIMITS.eventMax) errors.event = 'That is too long.';
  if (!file) errors.file = 'Please choose your logo file.';
  else if (!ACCEPTED_EXTENSIONS.includes(extensionOf(file.name))) {
    errors.file = `Please choose a ${ACCEPTED_EXTENSIONS.join(', ').toUpperCase()} file.`;
  } else if (file.size === 0) errors.file = 'That file is empty.';
  else if (file.size > MAX_BYTES) errors.file = 'That file is over 7 MB. Please email it to info@enjoysenoia.com instead.';
  return errors;
}

// FileReader's data URL, minus its "data:...;base64," prefix.
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });

/**
 * @param {{sponsor: string, email: string, contactName: string, event: string, website: string, elapsedMs: number}} fields
 *   `website` is the honeypot; `elapsedMs` is how long the form was open.
 * @param {File} file
 * @throws an Error with `.fieldErrors` for invalid input, or `.code` from the
 *   function (`resource-exhausted`, `failed-precondition`, `unavailable`, ...).
 */
export async function sendSponsorLogo(fields, file) {
  const errors = validateSponsorLogo(fields, file);
  if (Object.keys(errors).length > 0) {
    const err = new Error('Invalid upload');
    err.fieldErrors = errors;
    throw err;
  }
  const call = httpsCallable(functions, 'submitSponsorLogo', { limitedUseAppCheckTokens: true });
  try {
    await call(await buildPayload(fields, file));
  } catch (err) {
    // The function reports which fields it rejected (functions/index.js) in
    // `details.fields`; surface them like the checks above.
    if (err.code === 'functions/invalid-argument' && err.details?.fields) {
      err.fieldErrors = err.details.fields;
    }
    throw err;
  }
}

async function buildPayload(fields, file) {
  return {
    sponsor: fields.sponsor.trim(),
    email: fields.email.trim(),
    contactName: (fields.contactName || '').trim(),
    event: (fields.event || '').trim(),
    fileName: file.name,
    fileBase64: await toBase64(file),
    website: fields.website || '',
    elapsedMs: fields.elapsedMs,
  };
}
