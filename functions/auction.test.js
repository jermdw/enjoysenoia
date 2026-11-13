// Run with: cd functions && npm test   (or: node --test functions/auction.test.js)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MAX_BID,
  TICKET_EVENT_ID,
  buildAuctionLinkEmail,
  buildNoTicketsEmail,
  buildOutbidEmail,
  countTickets,
  linkUrl,
  lotClosedReason,
  minimumBid,
  ordersUrl,
  ticketTailorAuth,
  validateBid,
  validateLinkRequest,
} from './auction.js';

const token = 'a'.repeat(48);
const ts = (ms) => ({ toMillis: () => ms });

test('a link request is trimmed and the email lowercased', () => {
  const r = validateLinkRequest({ name: '  Jane   Doe ', email: ' Jane@Example.COM ', phone: '(770) 555-0100' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, { name: 'Jane Doe', email: 'jane@example.com', phone: '(770) 555-0100' });
});

test('a link request needs a name, an email and a ten-digit phone', () => {
  const r = validateLinkRequest({ name: 'J', email: 'nope', phone: '555-0100' });
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ['email', 'name', 'phone']);
});

test('bids are whole dollars, on a real lot id, with a valid token', () => {
  assert.equal(validateBid({ token, lotId: 'car-1', amount: 250 }).ok, true);
  assert.equal(validateBid({ token, lotId: 'car-1', amount: 250.5 }).ok, false);
  assert.equal(validateBid({ token, lotId: 'car-1', amount: '250' }).ok, false);
  assert.equal(validateBid({ token, lotId: 'car-1', amount: 0 }).ok, false);
  assert.equal(validateBid({ token, lotId: 'car-1', amount: MAX_BID + 1 }).ok, false);
  assert.equal(validateBid({ token, lotId: '../x', amount: 250 }).ok, false);
  assert.equal(validateBid({ token: 'short', lotId: 'car-1', amount: 250 }).ok, false);
});

test('the first bid must meet the opening bid; later ones beat the high bid by the increment', () => {
  assert.equal(minimumBid({ openingBid: 200, increment: 25, highBid: null }), 200);
  assert.equal(minimumBid({ openingBid: 200, increment: 25 }), 200);
  assert.equal(minimumBid({ openingBid: 200, increment: 25, highBid: 200 }), 225);
});

test('a lot takes bids only while switched open and before its closing time', () => {
  const now = 1_000_000;
  assert.equal(lotClosedReason({ open: true, closesAt: ts(now + 1) }, now), null);
  assert.match(lotClosedReason({ open: false, closesAt: ts(now + 1) }, now), /not open/);
  assert.match(lotClosedReason({ open: true, closesAt: ts(now) }, now), /closed/);
  assert.match(lotClosedReason({ open: true }, now), /closed/);
  assert.match(lotClosedReason(null, now), /not open/);
});

test('tickets are counted only for this buyer, this event, completed orders and valid tickets', () => {
  const ticket = (over = {}) => ({ status: 'valid', event_id: TICKET_EVENT_ID, ...over });
  const body = {
    data: [
      { status: 'completed', buyer_details: { email: 'Jane@Example.com' }, issued_tickets: [ticket(), ticket(), ticket({ status: 'voided' })] },
      { status: 'completed', buyer_details: { email: 'jane@example.com' }, issued_tickets: [ticket({ event_id: 'ev_1' })] },
      { status: 'canceled', buyer_details: { email: 'jane@example.com' }, issued_tickets: [ticket()] },
      { status: 'completed', buyer_details: { email: 'someone@else.com' }, issued_tickets: [ticket()] },
    ],
  };
  assert.equal(countTickets(body, 'jane@example.com'), 2);
  assert.equal(countTickets({}, 'jane@example.com'), 0);
  // A key that hides personal data returns no buyer email: nothing matches.
  assert.equal(countTickets({ data: [{ status: 'completed', buyer_details: {}, issued_tickets: [ticket()] }] }, 'jane@example.com'), 0);
});

test('the Ticket Tailor request filters by buyer, event and status, with key-only basic auth', () => {
  const url = new URL(ordersUrl('jane+toh@example.com'));
  assert.equal(url.origin + url.pathname, 'https://api.tickettailor.com/v1/orders');
  assert.equal(url.searchParams.get('email'), 'jane+toh@example.com');
  assert.equal(url.searchParams.get('event_id'), TICKET_EVENT_ID);
  assert.equal(url.searchParams.get('status'), 'completed');
  assert.equal(ticketTailorAuth('sk_test'), `Basic ${Buffer.from('sk_test:').toString('base64')}`);
});

test('emails escape names and carry the bidding link', () => {
  const mail = buildAuctionLinkEmail({ to: 'jane@example.com', name: '<Jane>', token });
  assert.ok(mail.html.includes('&lt;Jane&gt;'));
  assert.ok(!mail.html.includes('<Jane>'));
  assert.ok(mail.html.includes(linkUrl(token)));
  const none = buildNoTicketsEmail({ to: 'x@example.com' });
  assert.ok(!none.html.includes('?t='));
  assert.ok(!none.html.includes('Hi '), 'no requester-typed name in an email to an unverified inbox');
  const outbid = buildOutbidEmail({
    to: 'jane@example.com', name: 'Jane', lotTitle: 'Car 1', newHigh: 300, nextMinimum: 325,
    closesAt: new Date('2026-12-07T01:00:00Z'),
  });
  assert.ok(outbid.html.includes('$325'));
  assert.ok(outbid.html.includes('December 6'));
});
