// Run with: cd functions && npm test   (or: node --test functions/volunteerSignup.test.js)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FROM,
  RECIPIENT,
  buildVolunteerCancelEmail,
  buildVolunteerConfirmationEmail,
  buildVolunteerStaffEmail,
  cancelUrl,
  validateVolunteerSignup,
} from './volunteerSignup.js';

const valid = {
  eventSlug: '2026-senoia-turkey-trot-5k',
  shiftId: 'abc123',
  firstName: ' Jane ',
  lastName: ' Doe ',
  email: ' Jane@Example.com ',
  phone: '(770) 555-0100',
  note: '',
};
const shift = { role: 'Early setup crew', time: 'Sat Nov 21, 6:00 AM' };

test('valid input is trimmed and the email lowercased', () => {
  const r = validateVolunteerSignup(valid);
  assert.equal(r.ok, true);
  assert.equal(r.value.firstName, 'Jane');
  assert.equal(r.value.email, 'jane@example.com');
});

test('each bad field is reported on its own', () => {
  const r = validateVolunteerSignup({ ...valid, firstName: '', email: 'nope', phone: '12' });
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ['email', 'firstName', 'phone']);
});

test('ids that could change a Firestore path are rejected', () => {
  assert.equal(validateVolunteerSignup({ ...valid, shiftId: 'a/b' }).ok, false);
  assert.equal(validateVolunteerSignup({ ...valid, eventSlug: '../x' }).ok, false);
  assert.equal(validateVolunteerSignup({ ...valid, shiftId: '' }).ok, false);
});

test('over-long values are rejected', () => {
  assert.equal(validateVolunteerSignup({ ...valid, lastName: 'x'.repeat(81) }).ok, false);
  assert.equal(validateVolunteerSignup({ ...valid, note: 'x'.repeat(501) }).ok, false);
});

test('non-string and missing input never throws', () => {
  for (const bad of [null, undefined, 'str', 42, [], { firstName: 1, email: {}, phone: [] }]) {
    assert.equal(validateVolunteerSignup(bad).ok, false);
  }
});

test('confirmation goes to the volunteer from the verified domain, with a cancel link', () => {
  const mail = buildVolunteerConfirmationEmail({
    signup: { firstName: 'Jane', email: 'jane@example.com' },
    shift,
    eventName: 'Turkey Trot',
    cancelToken: 'tok+/=',
  });
  assert.equal(mail.from, FROM);
  assert.equal(mail.to, 'jane@example.com');
  assert.equal(mail.replyTo, RECIPIENT);
  assert.match(mail.html, /volunteer-cancel\?token=tok%2B%2F%3D/);
  assert.equal(cancelUrl('abc'), 'https://www.enjoysenoia.com/volunteer-cancel?token=abc');
});

test('staff email escapes every field and keeps the subject on one line', () => {
  const mail = buildVolunteerStaffEmail({
    kind: 'signup',
    signup: {
      firstName: 'Eve\r\nBcc: x@evil.test',
      lastName: '<b>L</b>',
      email: 'e@example.com',
      phone: '1',
      note: '<script>alert(1)</script>\nsecond',
    },
    shift: { role: '<img src=x>', time: 't' },
    eventName: 'E',
  });
  assert.doesNotMatch(mail.subject, /[\r\n]/);
  assert.doesNotMatch(mail.html, /<script>|<img|<b>/);
  assert.match(mail.html, /<br>/);
  assert.equal(mail.to, RECIPIENT);
  assert.equal(mail.replyTo, 'e@example.com');
});

test('cancel email survives a shift that was deleted', () => {
  const mail = buildVolunteerCancelEmail({
    signup: { firstName: 'Jane', email: 'jane@example.com' },
    shift: undefined,
    eventName: 'Turkey Trot',
    eventSlug: 'x',
  });
  assert.match(mail.html, /a volunteer shift/);
});
