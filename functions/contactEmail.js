/**
 * Validation and email content for the public contact form.
 *
 * No imports on purpose, so the unit test (and anything else) can load this
 * without firebase-functions or Resend installed.
 *
 * The email deliberately matches the Senoia Area Historical Society's contact
 * form notification: a gold house heading, a "Contact form message" title, and
 * a bordered Name / Email / Message / Submitted table.
 */

export const SENDER_DOMAIN = 'info.enjoysenoia.com';
export const FROM = `Enjoy Senoia <website@${SENDER_DOMAIN}>`;
export const RECIPIENT = 'info@enjoysenoia.com';

export const LIMITS = {
  nameMin: 2,
  nameMax: 120,
  emailMax: 254,
  messageMin: 10,
  messageMax: 5000,
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Trims and checks the submitted fields.
 * Returns { ok: true, value } or { ok: false, errors } keyed by field.
 */
export function validateContact(input) {
  const raw = input && typeof input === 'object' ? input : {};
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  const message = typeof raw.message === 'string' ? raw.message.trim() : '';

  const errors = {};
  if (name.length < LIMITS.nameMin) errors.name = 'Please enter your name.';
  else if (name.length > LIMITS.nameMax) errors.name = 'That name is too long.';
  if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';
  else if (email.length > LIMITS.emailMax) errors.email = 'That email address is too long.';
  if (message.length < LIMITS.messageMin) errors.message = 'Please write a short message.';
  else if (message.length > LIMITS.messageMax) {
    errors.message = `Please keep your message under ${LIMITS.messageMax} characters.`;
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value: { name, email, message } };
}

/** Escapes text for interpolation into HTML. Every field here is attacker-supplied. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** A header value must be one line: a CR/LF in a name could inject headers. */
const oneLine = (value) => String(value ?? '').replace(/[\r\n\u2028\u2029]+/g, ' ').trim();

const row = (label, valueHtml) =>
  `<tr>` +
  `<td style="padding: 8px; border: 1px solid #e0d8c0; font-weight: bold; vertical-align: top; width: 110px;">${escapeHtml(label)}</td>` +
  `<td style="padding: 8px; border: 1px solid #e0d8c0;">${valueHtml}</td>` +
  `</tr>`;

/**
 * The staff notification for one contact form message.
 *
 * `replyTo` is the visitor so a reply goes straight back to them, while `from`
 * stays on the verified sending domain; setting `from` to the visitor's address
 * is what gets a message rejected or filed as spam.
 *
 * @param {{name: string, email: string, message: string}} data validated fields
 * @param {Date} submittedAt
 */
export function buildContactEmail(data, submittedAt = new Date()) {
  const email = escapeHtml(data.email);
  const html = `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2c2c2c;">
  <h2 style="color: #8B6914;">Enjoy Senoia</h2>
  <p style="margin: 0; color: #888; font-size: 13px;">Senoia Downtown Development Authority</p>
  <h3 style="margin-bottom: 16px;">Contact form message</h3>
  <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">${[
    row('Name', escapeHtml(data.name)),
    row('Email', `<a href="mailto:${email}">${email}</a>`),
    row('Message', escapeHtml(data.message).replace(/\r?\n/g, '<br>')),
    row('Submitted', escapeHtml(submittedAt.toISOString())),
  ].join('')}</table>
</div>`.trim();

  return {
    from: FROM,
    to: RECIPIENT,
    replyTo: data.email,
    subject: `Contact form message from ${oneLine(data.name)}`,
    html,
  };
}
