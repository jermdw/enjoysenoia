/**
 * Validation, file naming and the staff email for the sponsor logo upload page.
 *
 * No imports on purpose, so the unit test can load this without
 * firebase-functions, googleapis or Resend installed.
 *
 * The file arrives base64-encoded inside a callable request, so MAX_BYTES is
 * kept well under the ~10 MB request body limit once base64 inflates it by a
 * third. Larger vector files should be emailed instead (the page says so).
 */
import { RECIPIENT, SENDER_DOMAIN, escapeHtml } from './contactEmail.js';

export const FROM = `Enjoy Senoia <website@${SENDER_DOMAIN}>`;
export { RECIPIENT };

export const MAX_BYTES = 7 * 1024 * 1024;

export const LIMITS = {
  sponsorMin: 2,
  sponsorMax: 120,
  nameMax: 120,
  emailMax: 254,
  eventMax: 120,
  fileNameMax: 200,
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Accepted extensions, each with the Drive MIME type and a check of the file's
 * first bytes. The extension alone is attacker-chosen; the signature check
 * stops an executable renamed to .png from being filed in a shared folder.
 */
const startsWith = (bytes, ...sig) => sig.every((b, i) => bytes[i] === b);
const head = (bytes, n = 1024) => Buffer.from(bytes.subarray(0, n)).toString('latin1');

export const FILE_TYPES = {
  png: { mime: 'image/png', matches: (b) => startsWith(b, 0x89, 0x50, 0x4e, 0x47) },
  jpg: { mime: 'image/jpeg', matches: (b) => startsWith(b, 0xff, 0xd8, 0xff) },
  jpeg: { mime: 'image/jpeg', matches: (b) => startsWith(b, 0xff, 0xd8, 0xff) },
  webp: {
    mime: 'image/webp',
    matches: (b) => head(b, 12).startsWith('RIFF') && head(b, 12).slice(8, 12) === 'WEBP',
  },
  pdf: { mime: 'application/pdf', matches: (b) => head(b, 1024).includes('%PDF-') },
  svg: { mime: 'image/svg+xml', matches: (b) => /<svg[\s>]/i.test(head(b, 4096)) },
  eps: { mime: 'application/postscript', matches: (b) => startsWith(b, 0x25, 0x21) || startsWith(b, 0xc5, 0xd0, 0xd3, 0xc6) },
  // Illustrator files are PDF-compatible or PostScript.
  ai: {
    mime: 'application/illustrator',
    matches: (b) => head(b, 1024).includes('%PDF-') || startsWith(b, 0x25, 0x21),
  },
};

export const ACCEPTED_EXTENSIONS = Object.keys(FILE_TYPES);

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

/** A header value or Drive file name must be one line. */
const oneLine = (value) => String(value ?? '').replace(/[\r\n\u2028\u2029]+/g, ' ').trim();

export const extensionOf = (fileName) => {
  const m = /\.([A-Za-z0-9]+)$/.exec(clean(fileName));
  return m ? m[1].toLowerCase() : '';
};

/**
 * Trims and checks the submitted fields and the file.
 * Returns { ok: true, value } (value includes the decoded `bytes`) or
 * { ok: false, errors } keyed by field.
 */
export function validateSponsorLogo(input) {
  const raw = input && typeof input === 'object' ? input : {};
  const sponsor = clean(raw.sponsor);
  const contactName = clean(raw.contactName);
  const email = clean(raw.email).toLowerCase();
  const event = clean(raw.event);
  const fileName = clean(raw.fileName);
  const base64 = typeof raw.fileBase64 === 'string' ? raw.fileBase64 : '';

  const errors = {};
  if (sponsor.length < LIMITS.sponsorMin) errors.sponsor = 'Please enter your business or sponsor name.';
  else if (sponsor.length > LIMITS.sponsorMax) errors.sponsor = 'That name is too long.';
  if (contactName.length > LIMITS.nameMax) errors.contactName = 'That name is too long.';
  if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';
  else if (email.length > LIMITS.emailMax) errors.email = 'That email address is too long.';
  if (event.length > LIMITS.eventMax) errors.event = 'That is too long.';

  let bytes = null;
  const ext = extensionOf(fileName);
  if (!fileName || fileName.length > LIMITS.fileNameMax || !FILE_TYPES[ext]) {
    errors.file = `Please choose a ${ACCEPTED_EXTENSIONS.join(', ').toUpperCase()} file.`;
  } else if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    errors.file = 'We could not read that file. Please try again.';
  } else {
    bytes = Buffer.from(base64, 'base64');
    if (bytes.length === 0) errors.file = 'That file is empty.';
    else if (bytes.length > MAX_BYTES) errors.file = 'That file is over 7 MB. Please email it to us instead.';
    else if (!FILE_TYPES[ext].matches(bytes)) errors.file = `That does not look like a real .${ext} file. Try exporting or saving it again as a PNG or JPG.`;
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value: { sponsor, contactName, email, event, fileName, ext, bytes } };
}

/**
 * The name the logo is filed under, e.g. "Acme Plumbing - Senoia Porchfest -
 * 2026-10-15.png". Built from attacker-supplied text, so anything that is not a
 * letter, digit, space, dash, ampersand or period is dropped.
 */
export function driveFileName({ sponsor, event, ext }, date = new Date()) {
  const part = (s) =>
    oneLine(s)
      .replace(/[^\p{L}\p{N} &.-]+/gu, '')
      .replace(/\s+/g, ' ')
      .replace(/^[. -]+|[. -]+$/g, '')
      .slice(0, 60);
  const day = date.toISOString().slice(0, 10);
  const parts = [part(sponsor) || 'Sponsor', part(event), day].filter(Boolean);
  return `${parts.join(' - ')}.${ext}`;
}

const row = (label, valueHtml) =>
  `<tr>` +
  `<td style="padding: 8px; border: 1px solid #e0d8c0; font-weight: bold; vertical-align: top; width: 110px;">${escapeHtml(label)}</td>` +
  `<td style="padding: 8px; border: 1px solid #e0d8c0;">${valueHtml}</td>` +
  `</tr>`;

/**
 * The staff notification for one uploaded logo. `driveUrl` is Google's link to
 * the filed copy; it is null when the upload to Drive failed.
 */
export function buildSponsorLogoEmail(data, { driveUrl, submittedAt = new Date() } = {}) {
  const email = escapeHtml(data.email);
  const where = driveUrl
    ? `<a href="${escapeHtml(driveUrl)}">Open in Google Drive</a>`
    : 'Not filed in Drive. See the sponsor_logos record.';
  const html = `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2c2c2c;">
  <h2 style="color: #8B6914;">Enjoy Senoia</h2>
  <p style="margin: 0; color: #888; font-size: 13px;">Senoia Downtown Development Authority</p>
  <h3 style="margin-bottom: 16px;">New sponsor logo</h3>
  <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">${[
    row('Sponsor', escapeHtml(data.sponsor)),
    row('Event', escapeHtml(data.event || 'Not given')),
    row('Contact', escapeHtml(data.contactName || 'Not given')),
    row('Email', `<a href="mailto:${email}">${email}</a>`),
    row('File', escapeHtml(data.fileName)),
    row('Logo', where),
    row('Submitted', escapeHtml(submittedAt.toISOString())),
  ].join('')}</table>
</div>`.trim();

  return {
    from: FROM,
    to: RECIPIENT,
    replyTo: data.email,
    subject: `Sponsor logo from ${oneLine(data.sponsor)}`,
    html,
  };
}
