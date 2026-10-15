/**
 * Validation and email content for volunteer sign-ups (/volunteer/:eventSlug).
 *
 * Volunteers claim a shift with a name, email and phone; no account. The
 * Cloud Functions in index.js do the Firestore work (a transaction, so two
 * people cannot take the last spot); this file holds the parts that need no
 * Firebase, so the unit test can load it on its own.
 *
 * Ported from the Senoia Car Show's volunteer system (github.com/jermdw/senoia-car-show),
 * minus shirt sizes.
 */
import { FROM, RECIPIENT, escapeHtml } from './contactEmail.js';

export { FROM, RECIPIENT, escapeHtml };

export const SITE_URL = 'https://www.enjoysenoia.com';

export const LIMITS = {
  nameMin: 1,
  nameMax: 80,
  emailMax: 254,
  phoneMax: 40,
  noteMax: 500,
  eventMax: 120,
  shiftMax: 60,
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Both ids go into Firestore paths. A `/` would change the path shape.
export const DOC_ID_RE = /^[A-Za-z0-9_-]+$/;

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Trims and checks a sign-up. Returns { ok: true, value } or { ok: false, errors }
 * keyed by field, in the shape the page shows next to each input.
 */
export function validateVolunteerSignup(input) {
  const raw = input && typeof input === 'object' ? input : {};
  const value = {
    eventSlug: str(raw.eventSlug),
    shiftId: str(raw.shiftId),
    firstName: str(raw.firstName),
    lastName: str(raw.lastName),
    email: str(raw.email).toLowerCase(),
    phone: str(raw.phone),
    note: str(raw.note),
  };

  const errors = {};
  if (!DOC_ID_RE.test(value.eventSlug) || value.eventSlug.length > LIMITS.eventMax) errors.shiftId = 'That shift is no longer available.';
  if (!DOC_ID_RE.test(value.shiftId) || value.shiftId.length > LIMITS.shiftMax) errors.shiftId = 'That shift is no longer available.';
  if (value.firstName.length < LIMITS.nameMin) errors.firstName = 'Please enter your first name.';
  else if (value.firstName.length > LIMITS.nameMax) errors.firstName = 'That name is too long.';
  if (value.lastName.length < LIMITS.nameMin) errors.lastName = 'Please enter your last name.';
  else if (value.lastName.length > LIMITS.nameMax) errors.lastName = 'That name is too long.';
  if (!EMAIL_RE.test(value.email)) errors.email = 'Please enter a valid email address.';
  else if (value.email.length > LIMITS.emailMax) errors.email = 'That email address is too long.';
  if (value.phone.replace(/\D/g, '').length < 7) errors.phone = 'Please enter a phone number we can reach you on.';
  else if (value.phone.length > LIMITS.phoneMax) errors.phone = 'That phone number is too long.';
  if (value.note.length > LIMITS.noteMax) errors.note = `Please keep this under ${LIMITS.noteMax} characters.`;

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value };
}

/** A header value must be one line: a CR/LF in a name could inject headers. */
const oneLine = (value) => String(value ?? '').replace(/[\r\n\u2028\u2029]+/g, ' ').trim();

const wrap = (inner) => `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2c2c2c;">
  <h2 style="color: #8B6914;">Enjoy Senoia</h2>
  <p style="margin: 0; color: #888; font-size: 13px;">Senoia Downtown Development Authority</p>
  ${inner}
</div>`.trim();

export const cancelUrl = (token) => `${SITE_URL}/volunteer-cancel?token=${encodeURIComponent(token)}`;

/** The volunteer's confirmation, with the link that releases the spot. */
export function buildVolunteerConfirmationEmail({ signup, shift, eventName, cancelToken }) {
  const html = wrap(`
  <h3>You're signed up, ${escapeHtml(signup.firstName)}!</h3>
  <p>Thank you for volunteering for the <strong>${escapeHtml(eventName)}</strong>.</p>
  <p style="padding: 12px; border: 1px solid #e0d8c0;">
    <strong>${escapeHtml(shift.role)}</strong><br>${escapeHtml(shift.time)}
  </p>
  <p>Need to cancel? <a href="${escapeHtml(cancelUrl(cancelToken))}">Release your spot</a> so someone else can take it.</p>
  <p>Questions? Reply to this email or write to <a href="mailto:${RECIPIENT}">${RECIPIENT}</a>.</p>`);
  return {
    from: FROM,
    to: signup.email,
    replyTo: RECIPIENT,
    subject: `You're signed up: ${oneLine(shift.role)} - ${oneLine(eventName)}`,
    html,
  };
}

const row = (label, valueHtml) =>
  `<tr>` +
  `<td style="padding: 8px; border: 1px solid #e0d8c0; font-weight: bold; vertical-align: top; width: 110px;">${escapeHtml(label)}</td>` +
  `<td style="padding: 8px; border: 1px solid #e0d8c0;">${valueHtml}</td>` +
  `</tr>`;

/** The notification to the shared inbox. `kind` is 'signup' or 'cancel'. */
export function buildVolunteerStaffEmail({ kind, signup, shift, eventName, submittedAt = new Date() }) {
  const email = escapeHtml(signup.email);
  const title = kind === 'cancel' ? 'Volunteer cancelled' : 'New volunteer sign-up';
  const rows = [
    row('Event', escapeHtml(eventName)),
    row('Shift', `${escapeHtml(shift.role)}<br>${escapeHtml(shift.time)}`),
    row('Name', escapeHtml(`${signup.firstName} ${signup.lastName}`)),
    row('Email', `<a href="mailto:${email}">${email}</a>`),
    row('Phone', escapeHtml(signup.phone)),
  ];
  if (signup.note) rows.push(row('Note', escapeHtml(signup.note).replace(/\r?\n/g, '<br>')));
  rows.push(row('When', escapeHtml(submittedAt.toISOString())));
  return {
    from: FROM,
    to: RECIPIENT,
    replyTo: signup.email,
    subject: `${title}: ${oneLine(shift.role)} - ${oneLine(signup.firstName)} ${oneLine(signup.lastName)}`,
    html: wrap(`<h3>${title}</h3><table style="border-collapse: collapse; width: 100%; margin: 20px 0;">${rows.join('')}</table>`),
  };
}

/** Tells the volunteer their cancellation went through. */
export function buildVolunteerCancelEmail({ signup, shift, eventName, eventSlug }) {
  return {
    from: FROM,
    to: signup.email,
    replyTo: RECIPIENT,
    subject: `Your volunteer shift was cancelled - ${oneLine(eventName)}`,
    html: wrap(`
  <h3>Your shift was cancelled</h3>
  <p>Hi ${escapeHtml(signup.firstName)}, your sign-up for <strong>${escapeHtml(shift?.role ?? 'a volunteer shift')}</strong>
  (${escapeHtml(shift?.time ?? '')}) has been cancelled and your spot released.</p>
  <p>Changed your mind? <a href="${SITE_URL}/volunteer/${encodeURIComponent(eventSlug)}">Sign-ups are here</a>.</p>`),
  };
}
