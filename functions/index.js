/**
 * Cloud Functions for enjoysenoia.com.
 *
 * submitContactMessage: the public contact form. Spam protection, in order:
 *   1. App Check, enforced on this function only. The reCAPTCHA Enterprise
 *      token the site already attaches is verified here and CONSUMED, so a
 *      captured token cannot be replayed. (Firestore enforcement stays off on
 *      purpose; see the App Check notes in the repo's memory/README.)
 *   2. A honeypot field real visitors never see.
 *   3. A minimum fill time.
 *   4. A per-IP rate limit.
 *   5. Server-side validation and HTML escaping.
 *
 * The message is written to `contact_messages` BEFORE the email is attempted,
 * so a failed send never loses someone's enquiry. The collection has no rules
 * block, so clients cannot read or write it; only this function can.
 */
import { createHash } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { Resend } from 'resend';
import { buildContactEmail, validateContact } from './contactEmail.js';

initializeApp();

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

const MIN_FILL_MS = 3000;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Allows RATE_LIMIT submissions per IP per hour. One small document per hashed
 * IP, updated in a transaction, so it needs no composite index and stores no
 * raw address.
 */
async function takeRateLimitSlot(db, ipHash) {
  const ref = db.collection('contact_rate').doc(ipHash);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.exists ? snap.data() : null;
    const windowStart = data?.windowStart?.toMillis?.() ?? 0;
    if (data && now - windowStart < RATE_WINDOW_MS) {
      if (data.count >= RATE_LIMIT) return false;
      tx.update(ref, { count: FieldValue.increment(1) });
    } else {
      tx.set(ref, { count: 1, windowStart: Timestamp.fromMillis(now) });
    }
    return true;
  });
}

export const submitContactMessage = onCall(
  {
    region: 'us-central1',
    enforceAppCheck: true,
    consumeAppCheckToken: true,
    secrets: [RESEND_API_KEY],
    maxInstances: 5,
  },
  async (request) => {
    const body = request.data && typeof request.data === 'object' ? request.data : {};

    // A bot that fills the hidden field is told it worked, and nothing is
    // stored or sent, so it learns nothing to adapt to.
    if (typeof body.website === 'string' && body.website.trim() !== '') return { ok: true };

    // Too fast to be a person. Reported honestly: a real visitor on an
    // autofilled form can trip this, and should simply try again.
    if (typeof body.elapsedMs !== 'number' || body.elapsedMs < MIN_FILL_MS) {
      throw new HttpsError('failed-precondition', 'Please take a moment and try sending again.');
    }

    const checked = validateContact(body);
    if (!checked.ok) {
      throw new HttpsError('invalid-argument', 'Please check the form and try again.', { fields: checked.errors });
    }

    const db = getFirestore();
    const ip = request.rawRequest?.ip || 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex');
    if (!(await takeRateLimitSlot(db, ipHash))) {
      throw new HttpsError('resource-exhausted', 'Too many messages from this connection. Please try again later.');
    }

    const submittedAt = new Date();
    const ref = await db.collection('contact_messages').add({
      ...checked.value,
      createdAt: Timestamp.fromDate(submittedAt),
      ipHash,
      emailStatus: 'pending',
    });

    try {
      const mail = buildContactEmail(checked.value, submittedAt);
      const { error } = await new Resend(RESEND_API_KEY.value()).emails.send({
        from: mail.from,
        to: mail.to,
        replyTo: mail.replyTo,
        subject: mail.subject,
        html: mail.html,
      });
      if (error) throw new Error(error.message || 'Resend rejected the message');
      await ref.update({ emailStatus: 'sent' });
    } catch (err) {
      // Loud, and recorded on the document that still holds the enquiry.
      console.error(`submitContactMessage(${ref.id}): email NOT sent`, err);
      await ref.update({ emailStatus: 'failed', emailError: String(err?.message || err).slice(0, 500) });
      throw new HttpsError('unavailable', 'We could not send your message right now.');
    }

    return { ok: true };
  }
);
