/**
 * The Tour of Homes BMW silent auction (christmas.enjoysenoia.com/auction).
 *
 * BMW of South Atlanta lends three cars, each seating four, for a chauffeured
 * Candlelight Tour of Homes: winners start at the Stone Lodge at Marimac Lakes
 * with champagne and hors d'oeuvres, then are driven home to home. Each car is
 * its own auction ("lot"). Only Tour of Homes ticket holders may bid.
 *
 *   1. requestAuctionLink: a would-be bidder enters name, email and phone. The
 *      function asks Ticket Tailor for completed Tour of Homes orders bought
 *      with that email. If there are any, it records the bidder and emails a
 *      bidding link carrying a random token. If not, it emails that address a
 *      "we couldn't find your tickets" note instead. Either way the page gets
 *      the same answer, so the form cannot be used to learn who bought tickets,
 *      and only the inbox's owner can bid under that address.
 *   2. The link opens /auction?t=<token>. The page keeps the token and sends it
 *      with every bid; placeAuctionBid checks it, then takes the bid in a
 *      transaction on the lot that re-checks the minimum and the close time.
 *   3. The bidder is emailed a confirmation, and whoever they outbid is told.
 *   4. After close, staff take payment from the winners (Auction tab in /admin).
 *
 * Only hashes of tokens are stored. No Firebase imports, so the unit test can
 * load this on its own.
 */
import { createHash } from 'node:crypto';
import { SENDER_DOMAIN, escapeHtml } from './contactEmail.js';

export const FROM = `Christmas in Senoia <website@${SENDER_DOMAIN}>`;
export const REPLY_TO = 'info@enjoysenoia.com';
export const SITE_URL = 'https://christmas.enjoysenoia.com';
export const TICKETS_URL = 'https://buytickets.at/senoiadda/2477581';

/**
 * The Tour of Homes in Ticket Tailor. Its public page is buytickets.at/
 * senoiadda/2477581, and the API names events ev_<that number>. If that ever
 * stops matching, no one gets a bidding link, and the function logs it.
 */
export const TICKET_EVENT_ID = 'ev_2477581';
// The emulator may point at a local stand-in (TICKET_TAILOR_API_BASE in
// functions/.env.local), so a test never queries real orders.
export const TICKET_TAILOR_API =
  (process.env.FUNCTIONS_EMULATOR === 'true' && process.env.TICKET_TAILOR_API_BASE) || 'https://api.tickettailor.com/v1';

export const LOTS = 'auction_lots';
export const BIDS = 'auction_bids';
export const BIDDERS = 'auction_bidders';
export const LINKS = 'auction_links';
// Long enough to last the whole auction from the day bidding opens.
export const LINK_TTL_MS = 45 * 24 * 60 * 60 * 1000;
// A typo guard, not a cap on generosity: staff can raise it here.
export const MAX_BID = 25000;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const TOKEN_RE = /^[a-f0-9]{48}$/;
export const LOT_ID_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
export const emailHash = (email) => sha256(normalizeEmail(email));

const clean = (value, max) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '');

/** Returns { ok: true, value: { name, email, phone } } or { ok: false, errors }. */
export function validateLinkRequest(input) {
  const name = clean(input?.name, 120);
  const email = normalizeEmail(input?.email);
  const phone = clean(input?.phone, 40);
  const errors = {};
  if (name.length < 2) errors.name = 'Please enter your name.';
  if (!EMAIL_RE.test(email) || email.length > 254) errors.email = 'Please enter a valid email address.';
  if ((phone.match(/\d/g) || []).length < 10) errors.phone = 'Please enter a phone number we can reach you at.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { name, email, phone } };
}

/** Returns { ok: true, value: { token, lotId, amount } } or { ok: false, message }. */
export function validateBid(input) {
  const token = typeof input?.token === 'string' ? input.token.trim() : '';
  const lotId = typeof input?.lotId === 'string' ? input.lotId : '';
  const amount = input?.amount;
  if (!TOKEN_RE.test(token)) return { ok: false, message: 'Your bidding link is not valid. Ask for a new one.' };
  if (!LOT_ID_RE.test(lotId)) return { ok: false, message: 'That car is not in this auction.' };
  if (!Number.isInteger(amount) || amount < 1) return { ok: false, message: 'Bids are in whole dollars.' };
  if (amount > MAX_BID) {
    return { ok: false, message: `Bids over $${MAX_BID.toLocaleString('en-US')} need a word with us first: email ${REPLY_TO}.` };
  }
  return { ok: true, value: { token, lotId, amount } };
}

/** The smallest bid a lot will take next. */
export const minimumBid = (lot) =>
  typeof lot.highBid === 'number' ? lot.highBid + lot.increment : lot.openingBid;

/**
 * Why a lot can't take a bid right now, or null if it can. `now` in ms.
 * A lot staff haven't opened (or have paused) is closed, and so is one past
 * its closing time, whatever its switch says.
 */
export function lotClosedReason(lot, now) {
  if (!lot || lot.open !== true) return 'Bidding on this car is not open.';
  const closesAt = lot.closesAt?.toMillis?.() ?? NaN;
  if (!Number.isFinite(closesAt) || now >= closesAt) return 'Bidding on this car has closed.';
  return null;
}

/**
 * How many valid Tour of Homes tickets a page of Ticket Tailor orders holds
 * for this buyer. The API is already filtered by email, event and status; the
 * checks are repeated so a filter that is ignored or loosened can't let anyone
 * else through.
 */
export function countTickets(body, email, eventId = TICKET_EVENT_ID) {
  const want = normalizeEmail(email);
  const orders = Array.isArray(body?.data) ? body.data : [];
  let count = 0;
  for (const order of orders) {
    if (order?.status && order.status !== 'completed') continue;
    if (normalizeEmail(order?.buyer_details?.email) !== want) continue;
    for (const ticket of order.issued_tickets || []) {
      if (ticket?.status === 'valid' && ticket?.event_id === eventId) count += 1;
    }
  }
  return count;
}

/** The Ticket Tailor request for one buyer's completed Tour of Homes orders. */
export function ordersUrl(email, eventId = TICKET_EVENT_ID) {
  const params = new URLSearchParams({ email, event_id: eventId, status: 'completed', limit: '100' });
  return `${TICKET_TAILOR_API}/orders?${params}`;
}

/** Basic auth with the key as the username and no password, as Ticket Tailor documents. */
export const ticketTailorAuth = (apiKey) => `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;

export const linkUrl = (token) => `${SITE_URL}/auction?t=${token}`;
export const dollars = (n) => `$${Number(n).toLocaleString('en-US')}`;

const closeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
export const formatClose = (date) => closeFormat.format(date);

function wrap(inner) {
  return `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1d1a17;">
  <h2 style="color: #8b1e23; margin-bottom: 4px;">Christmas in Senoia</h2>
  <p style="margin: 0; color: #4d463f; font-size: 13px;">Candlelight Tour of Homes &middot; Chauffeured BMW Silent Auction</p>
  ${inner}
  <p style="font-size: 13px; color: #4d463f; margin-top: 28px;">Proceeds benefit the Senoia Downtown Development Authority. Cars courtesy of BMW of South Atlanta. Questions? Reply to this email.</p>
</div>`.trim();
}

const button = (href, label) =>
  `<p style="margin: 28px 0;"><a href="${escapeHtml(href)}" style="background: #8b1e23; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">${escapeHtml(label)}</a></p>`;

/** The bidding link, sent once Ticket Tailor shows tickets for the address. */
export function buildAuctionLinkEmail({ to, name, token }) {
  const html = wrap(`
  <h3 style="margin-bottom: 16px;">Your bidding link</h3>
  <p>Hi ${escapeHtml(name)}, we found your Tour of Homes tickets. Use this button to bid on a chauffeured BMW for the Candlelight Tour of Homes:</p>
  ${button(linkUrl(token), 'Open the auction')}
  <p style="font-size: 13px; color: #4d463f;">This link signs you in to bid, so please don't forward it. Lost it? Ask for a new one at <a href="${SITE_URL}/auction">christmas.enjoysenoia.com/auction</a>.</p>`);
  return { from: FROM, to, replyTo: REPLY_TO, subject: 'Your bidding link: Tour of Homes BMW auction', html };
}

/**
 * Sent instead of a link when Ticket Tailor has no tickets for the address.
 * No name in it: whoever typed this address may not own the inbox.
 */
export function buildNoTicketsEmail({ to }) {
  const html = wrap(`
  <h3 style="margin-bottom: 16px;">We couldn't find your tickets</h3>
  <p>Someone asked for a bidding link for this address, but we couldn't find Tour of Homes tickets bought with it. The auction is open to ticket holders.</p>
  <p>If you bought tickets with a different email, ask again with that address. If you don't have tickets yet:</p>
  ${button(TICKETS_URL, 'Buy Tour of Homes tickets')}
  <p style="font-size: 13px; color: #4d463f;">Then ask for your link again at <a href="${SITE_URL}/auction">christmas.enjoysenoia.com/auction</a>. If you didn't ask for this, you can ignore it.</p>`);
  return { from: FROM, to, replyTo: REPLY_TO, subject: 'Tour of Homes BMW auction: tickets not found', html };
}

export function buildBidConfirmationEmail({ to, name, lotTitle, amount, closesAt }) {
  const html = wrap(`
  <h3 style="margin-bottom: 16px;">You're the high bidder</h3>
  <p>Hi ${escapeHtml(name)}, your bid of <strong>${dollars(amount)}</strong> on <strong>${escapeHtml(lotTitle)}</strong> is in, and it's the high bid.</p>
  <p>Bidding closes ${escapeHtml(formatClose(closesAt))}. We'll email you if someone outbids you.</p>
  ${button(`${SITE_URL}/auction`, 'See the auction')}`);
  return { from: FROM, to, replyTo: REPLY_TO, subject: `Bid received: ${dollars(amount)} on ${lotTitle}`, html };
}

export function buildOutbidEmail({ to, name, lotTitle, newHigh, nextMinimum, closesAt }) {
  const html = wrap(`
  <h3 style="margin-bottom: 16px;">You've been outbid</h3>
  <p>Hi ${escapeHtml(name)}, someone bid <strong>${dollars(newHigh)}</strong> on <strong>${escapeHtml(lotTitle)}</strong>. To take it back, bid ${dollars(nextMinimum)} or more before ${escapeHtml(formatClose(closesAt))}.</p>
  ${button(`${SITE_URL}/auction`, 'Bid again')}`);
  return { from: FROM, to, replyTo: REPLY_TO, subject: `Outbid on ${lotTitle}`, html };
}
