// Run with: cd functions && npm test   (or: node --test functions/contactEmail.test.js)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildContactEmail, escapeHtml, validateContact, FROM, RECIPIENT } from './contactEmail.js';

const valid = { name: ' Jane Doe ', email: ' Jane@Example.com ', message: ' Hello there, a question. ' };

test('valid input is trimmed and the email lowercased', () => {
  assert.deepEqual(validateContact(valid), {
    ok: true,
    value: { name: 'Jane Doe', email: 'jane@example.com', message: 'Hello there, a question.' },
  });
});

test('each bad field is reported on its own', () => {
  const r = validateContact({ name: 'J', email: 'nope', message: 'short' });
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ['email', 'message', 'name']);
});

test('over-long values are rejected', () => {
  assert.equal(validateContact({ ...valid, name: 'x'.repeat(121) }).ok, false);
  assert.equal(validateContact({ ...valid, message: 'x'.repeat(5001) }).ok, false);
});

test('non-string and missing input never throws', () => {
  for (const bad of [null, undefined, 'str', 42, [], { name: 1, email: {}, message: [] }]) {
    assert.equal(validateContact(bad).ok, false);
  }
});

test('subject names the sender and can never carry a header break', () => {
  const mail = buildContactEmail({ ...valid, name: 'Eve\r\nBcc: x@evil.test', email: 'e@example.com', message: 'hi there friend' });
  assert.equal(mail.subject, 'Contact form message from Eve Bcc: x@evil.test');
  assert.doesNotMatch(mail.subject, /[\r\n]/);
});

test('every field is HTML-escaped in the body', () => {
  const mail = buildContactEmail({
    name: '<script>alert(1)</script>',
    email: 'a@example.com',
    message: '<img src=x onerror=alert(1)>\nsecond & line',
  });
  assert.doesNotMatch(mail.html, /<script>|<img/);
  assert.match(mail.html, /&lt;script&gt;/);
  assert.match(mail.html, /second &amp; line/);
  assert.match(mail.html, /<br>/);
});

test('from is the verified domain, reply-to is the visitor, to is the shared inbox', () => {
  const mail = buildContactEmail({ name: 'Jane', email: 'jane@example.com', message: 'a real message' }, new Date('2026-09-21T19:24:12.396Z'));
  assert.equal(mail.from, FROM);
  assert.equal(mail.to, RECIPIENT);
  assert.equal(mail.replyTo, 'jane@example.com');
  assert.match(mail.html, /2026-09-21T19:24:12\.396Z/);
  assert.match(mail.html, /Contact form message/);
});

test('escapeHtml tolerates null', () => {
  assert.equal(escapeHtml(null), '');
});
