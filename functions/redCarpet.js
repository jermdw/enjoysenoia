/**
 * Red Carpet photo downloads for Masquerade guests (thehalloweenmasquerade.com/red-carpet).
 *
 * The photographer (Melissa Prosser Photography) did not want her whole shoot
 * open to the public, so the high-res files are kept behind a magic link:
 *
 *   1. A guest enters the email they bought tickets with. requestRedCarpetLink
 *      looks the address up in `masquerade_photo_guests` (filled from the Ticket
 *      Tailor export by scripts/import_red_carpet_guests.py) and, if it is
 *      there, emails a link carrying a random token. The reply is the same
 *      either way, so the form cannot be used to learn who bought tickets.
 *   2. The link opens /red-carpet?t=<token>. redCarpetPhotos checks the token on
 *      every request and streams the thumbnails and print files from the
 *      private/ prefix in Storage, which storage.rules keeps closed to everyone.
 *
 * Guests pick their own photos from the full Red Carpet set; nothing ties a
 * photo to a buyer. Only hashes are stored: the guest list holds sha256 of each
 * address and a link holds sha256 of its token.
 *
 * No Firebase imports, so the unit test can load this on its own.
 */
import { createHash } from 'node:crypto';
import { escapeHtml } from './contactEmail.js';

export const FROM = 'The Halloween Masquerade <website@info.enjoysenoia.com>';
export const REPLY_TO = 'info@enjoysenoia.com';
export const SITE_URL = 'https://thehalloweenmasquerade.com';

export const GUESTS = 'masquerade_photo_guests';
export const LINKS = 'red_carpet_links';
export const STORAGE_PREFIX = 'private/masquerade-2026/red-carpet';
export const LINK_TTL_MS = 14 * 24 * 60 * 60 * 1000;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const TOKEN_RE = /^[a-f0-9]{48}$/;
// The photographer's file number (mppmediadowntherabbithole<n>.JPG). It goes
// into a Storage path, so nothing but digits.
export const PHOTO_RE = /^\d{1,4}$/;

export const sha256 = (value) => createHash('sha256').update(value).digest('hex');

/** Must match normalize() in scripts/import_red_carpet_guests.py. */
export const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

export const emailHash = (email) => sha256(normalizeEmail(email));

/** Returns { ok: true, email } or { ok: false }. */
export function validateLinkRequest(input) {
  const email = normalizeEmail(input?.email);
  if (!EMAIL_RE.test(email) || email.length > 254) return { ok: false };
  return { ok: true, email };
}

export const linkUrl = (token) => `${SITE_URL}/red-carpet?t=${token}`;

/** Storage path of one photo; `size` is 'thumb' or 'full'. */
export const photoPath = (n, size) => `${STORAGE_PREFIX}/${size === 'full' ? 'full' : 'thumb'}/${n}.jpg`;

/** The name a print file downloads as. */
export const downloadName = (n) => `masquerade-2026-red-carpet-${n}.jpg`;

/** The magic-link email. */
export function buildRedCarpetLinkEmail({ to, token, expiresAt }) {
  const url = escapeHtml(linkUrl(token));
  const until = expiresAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
  const html = `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2c2c2c;">
  <h2 style="color: #8B1A1A;">The Halloween Masquerade</h2>
  <p style="margin: 0; color: #888; font-size: 13px;">Down the Rabbit Hole &middot; October 24, 2026</p>
  <h3 style="margin-bottom: 16px;">Your Red Carpet photos</h3>
  <p>Thank you for joining us! Use the button below to see the Red Carpet photos and download a full-resolution, print-ready copy of any you're in.</p>
  <p style="margin: 28px 0;">
    <a href="${url}" style="background: #8B1A1A; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 2px;">See the Red Carpet photos</a>
  </p>
  <p style="font-size: 13px; color: #666;">This link works until ${escapeHtml(until)}. After that, ask for a new one at <a href="${SITE_URL}/red-carpet">thehalloweenmasquerade.com/red-carpet</a>. Feel free to share it with your party, but please don't post it publicly.</p>
  <p style="font-size: 13px; color: #666;">Photographs &copy; 2026 Melissa Prosser Photography, LLC. For personal use.</p>
</div>`.trim();
  return {
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: 'Your Red Carpet photos from the Halloween Masquerade',
    html,
  };
}
