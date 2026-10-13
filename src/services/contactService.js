/**
 * Public contact form.
 *
 * Sends through the `submitContactMessage` Cloud Function (functions/index.js),
 * not a Firestore write: the function verifies the App Check reCAPTCHA token,
 * rate-limits, stores the message and emails it. Nothing here can be trusted
 * server-side; the checks below only give a useful message early.
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export const LIMITS = { nameMin: 2, nameMax: 120, emailMax: 254, messageMin: 10, messageMax: 5000 };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Returns a map of field -> message; empty means valid. */
export function validateContact({ name, email, message }) {
  const errors = {};
  const n = (name || '').trim();
  const e = (email || '').trim();
  const m = (message || '').trim();
  if (n.length < LIMITS.nameMin) errors.name = 'Please enter your name.';
  else if (n.length > LIMITS.nameMax) errors.name = 'That name is too long.';
  if (!EMAIL_RE.test(e)) errors.email = 'Please enter a valid email address.';
  else if (e.length > LIMITS.emailMax) errors.email = 'That email address is too long.';
  if (m.length < LIMITS.messageMin) errors.message = 'Please write a short message.';
  else if (m.length > LIMITS.messageMax) errors.message = `Please keep your message under ${LIMITS.messageMax} characters.`;
  return errors;
}

/**
 * @param {{name: string, email: string, message: string, website: string, elapsedMs: number}} fields
 *   `website` is the honeypot (always empty for a person); `elapsedMs` is how
 *   long the form was open.
 * @throws an Error with `.fieldErrors` for invalid input, or `.code` from the
 *   function (`resource-exhausted`, `failed-precondition`, `unavailable`, ...).
 */
export async function sendContactMessage(fields) {
  const errors = validateContact(fields);
  if (Object.keys(errors).length > 0) {
    const err = new Error('Invalid message');
    err.fieldErrors = errors;
    throw err;
  }
  // Single-use App Check token: the server consumes it, so it cannot be replayed.
  const call = httpsCallable(functions, 'submitContactMessage', { limitedUseAppCheckTokens: true });
  await call({
    name: fields.name.trim(),
    email: fields.email.trim(),
    message: fields.message.trim(),
    website: fields.website || '',
    elapsedMs: fields.elapsedMs,
  });
}
