// Run with: cd functions && npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_BYTES, buildSponsorLogoEmail, driveFileName, validateSponsorLogo } from './sponsorLogo.js';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const b64 = (buf) => buf.toString('base64');
const valid = {
  sponsor: ' Acme Plumbing ',
  contactName: 'Jane',
  email: ' Jane@Example.com ',
  event: 'Porchfest',
  fileName: 'logo.PNG',
  fileBase64: b64(PNG),
};

test('valid input is trimmed, the email lowercased and the file decoded', () => {
  const r = validateSponsorLogo(valid);
  assert.equal(r.ok, true);
  assert.equal(r.value.sponsor, 'Acme Plumbing');
  assert.equal(r.value.email, 'jane@example.com');
  assert.equal(r.value.ext, 'png');
  assert.deepEqual(r.value.bytes, PNG);
});

test('each bad field is reported on its own', () => {
  const r = validateSponsorLogo({ ...valid, sponsor: 'A', email: 'nope', fileName: 'x.exe' });
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ['email', 'file', 'sponsor']);
});

test('a file whose bytes do not match its extension is rejected', () => {
  const r = validateSponsorLogo({ ...valid, fileBase64: b64(Buffer.from('MZ\x90\x00 not a png')) });
  assert.equal(r.ok, false);
  assert.ok(r.errors.file);
});

test('svg, pdf, jpeg and webp are recognised by content', () => {
  const ok = (fileName, buf) => validateSponsorLogo({ ...valid, fileName, fileBase64: b64(buf) }).ok;
  assert.equal(ok('a.svg', Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>')), true);
  assert.equal(ok('a.pdf', Buffer.from('%PDF-1.7\n...')), true);
  assert.equal(ok('a.jpg', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0])), true);
  assert.equal(ok('a.webp', Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'latin1')), true);
  assert.equal(ok('a.svg', Buffer.from('<html><script>alert(1)</script></html>')), false);
});

test('an empty or over-size file is rejected', () => {
  assert.equal(validateSponsorLogo({ ...valid, fileBase64: '' }).ok, false);
  const big = Buffer.concat([PNG, Buffer.alloc(MAX_BYTES)]);
  assert.equal(validateSponsorLogo({ ...valid, fileBase64: b64(big) }).ok, false);
});

test('non-string and missing input never throws', () => {
  for (const bad of [null, undefined, 'str', 42, [], { sponsor: 1, email: {}, fileBase64: [] }]) {
    assert.equal(validateSponsorLogo(bad).ok, false);
  }
});

test('the Drive file name keeps only safe characters', () => {
  const name = driveFileName(
    { sponsor: 'Acme/Plumbing: "Best"\r\n<b>', event: '../Porchfest', ext: 'png' },
    new Date('2026-10-15T12:00:00Z')
  );
  assert.equal(name, 'AcmePlumbing Best b - Porchfest - 2026-10-15.png');
  assert.equal(driveFileName({ sponsor: '///', event: '', ext: 'svg' }, new Date('2026-10-15T00:00:00Z')), 'Sponsor - 2026-10-15.svg');
});

test('the staff email escapes everything the sponsor typed', () => {
  const mail = buildSponsorLogoEmail(
    { sponsor: '<img src=x onerror=1>', contactName: '', email: 'a@b.co', event: '', fileName: 'x"y.png' },
    { driveUrl: 'https://drive.google.com/file/d/1/view' }
  );
  assert.ok(!mail.html.includes('<img'));
  assert.ok(mail.html.includes('Open in Google Drive'));
  assert.equal(mail.replyTo, 'a@b.co');
  assert.ok(!/[\r\n]/.test(mail.subject));
});
