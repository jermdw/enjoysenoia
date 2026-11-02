// Run with: cd functions && npm test   (or: node --test functions/redCarpet.test.js)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PHOTO_RE,
  TOKEN_RE,
  buildRedCarpetLinkEmail,
  emailHash,
  linkUrl,
  photoPath,
  validateLinkRequest,
} from './redCarpet.js';

test('the email is trimmed and lowercased', () => {
  assert.deepEqual(validateLinkRequest({ email: ' Guest@Example.COM ' }), { ok: true, email: 'guest@example.com' });
});

test('a missing or malformed email is refused', () => {
  assert.equal(validateLinkRequest({}).ok, false);
  assert.equal(validateLinkRequest({ email: 'not-an-email' }).ok, false);
  assert.equal(validateLinkRequest({ email: 42 }).ok, false);
  assert.equal(validateLinkRequest(null).ok, false);
});

test('the hash ignores case and surrounding space, like the import script', () => {
  assert.equal(emailHash(' Guest@Example.com'), emailHash('guest@example.com'));
  // sha256("guest@example.com"); the Python script must produce the same.
  assert.equal(emailHash('guest@example.com'), '513935c4d2db2d2d984dff1d68397f6e2ac8c4e5c48c92bd98e02bdc90b7aefe');
});

test('tokens and photo numbers only match their own shape', () => {
  assert.ok(TOKEN_RE.test('a'.repeat(48)));
  assert.ok(!TOKEN_RE.test('A'.repeat(48)));
  assert.ok(!TOKEN_RE.test('a'.repeat(47)));
  assert.ok(PHOTO_RE.test('123'));
  assert.ok(!PHOTO_RE.test('../123'));
  assert.ok(!PHOTO_RE.test('123.jpg'));
});

test('photo paths stay under the private prefix', () => {
  assert.equal(photoPath('123', 'full'), 'private/masquerade-2026/red-carpet/full/123.jpg');
  assert.equal(photoPath('123', 'anything'), 'private/masquerade-2026/red-carpet/thumb/123.jpg');
});

test('the link email goes to the guest and carries the link', () => {
  const token = 'b'.repeat(48);
  const mail = buildRedCarpetLinkEmail({
    to: 'guest@example.com',
    token,
    expiresAt: new Date('2026-11-13T15:00:00Z'),
  });
  assert.equal(mail.to, 'guest@example.com');
  assert.ok(mail.html.includes(linkUrl(token)));
  assert.ok(mail.html.includes('November 13'));
  assert.ok(mail.html.includes('Melissa Prosser'));
});
