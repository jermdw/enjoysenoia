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
 * submitSponsorLogo: the sponsor logo upload page (/sponsor-logo), linked from
 * the Ticket Tailor confirmation email. Same protections as above. The file is
 * validated (type, size, magic bytes), filed in a shared Google Drive folder and
 * announced to staff by email; a metadata record goes in `sponsor_logos`.
 *
 * submitVolunteerSignup / cancelVolunteerSignup: the volunteer shift board
 * (/volunteer/:eventSlug). Volunteers have no account, so every write goes
 * through these (the Admin SDK bypasses rules after validating). The shift's
 * `spotsFilled` only changes inside a transaction that re-checks state.
 *
 * The contact message is written to `contact_messages` BEFORE the email is attempted,
 * so a failed send never loses someone's enquiry. The collection has no rules
 * block, so clients cannot read or write it; only this function can.
 */
import { createHash, randomBytes } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { auth, drive } from '@googleapis/drive';
import { Readable } from 'node:stream';
import { Resend } from 'resend';
import { buildContactEmail, validateContact } from './contactEmail.js';
import { FILE_TYPES, buildSponsorLogoEmail, driveFileName, validateSponsorLogo } from './sponsorLogo.js';
import {
  buildVolunteerCancelEmail,
  buildVolunteerConfirmationEmail,
  buildVolunteerStaffEmail,
  validateVolunteerSignup,
} from './volunteerSignup.js';

initializeApp();

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
// ID of the shared Drive folder logos are filed in (the last part of its URL).
// Share that folder with this function's runtime service account.
const SPONSOR_LOGO_FOLDER_ID = defineString('SPONSOR_LOGO_FOLDER_ID');

const MIN_FILL_MS = 3000;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const LOGO_RATE_LIMIT = 10;
const VOLUNTEER_RATE_LIMIT = 10;

/**
 * Allows RATE_LIMIT submissions per IP per hour. One small document per hashed
 * IP, updated in a transaction, so it needs no composite index and stores no
 * raw address.
 */
async function takeRateLimitSlot(db, ipHash, collection = 'contact_rate', limit = RATE_LIMIT) {
  const ref = db.collection(collection).doc(ipHash);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.exists ? snap.data() : null;
    const windowStart = data?.windowStart?.toMillis?.() ?? 0;
    if (data && now - windowStart < RATE_WINDOW_MS) {
      if (data.count >= limit) return false;
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

export const submitSponsorLogo = onCall(
  {
    region: 'us-central1',
    enforceAppCheck: true,
    consumeAppCheckToken: true,
    secrets: [RESEND_API_KEY],
    maxInstances: 5,
    // Room for a ~7 MB file as base64.
    memory: '512MiB',
  },
  async (request) => {
    const body = request.data && typeof request.data === 'object' ? request.data : {};

    if (typeof body.website === 'string' && body.website.trim() !== '') return { ok: true };

    if (typeof body.elapsedMs !== 'number' || body.elapsedMs < MIN_FILL_MS) {
      throw new HttpsError('failed-precondition', 'Please take a moment and try sending again.');
    }

    const checked = validateSponsorLogo(body);
    if (!checked.ok) {
      throw new HttpsError('invalid-argument', 'Please check the form and try again.', { fields: checked.errors });
    }
    const { bytes, ...data } = checked.value;

    const db = getFirestore();
    const ip = request.rawRequest?.ip || 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex');
    if (!(await takeRateLimitSlot(db, ipHash, 'sponsor_logo_rate', LOGO_RATE_LIMIT))) {
      throw new HttpsError('resource-exhausted', 'Too many uploads from this connection. Please try again later.');
    }

    const submittedAt = new Date();
    const record = db.collection('sponsor_logos').doc();
    let driveUrl = null;
    try {
      const client = drive({ version: 'v3', auth: new auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/drive'] }) });
      const res = await client.files.create({
        requestBody: {
          name: driveFileName(data, submittedAt),
          parents: [SPONSOR_LOGO_FOLDER_ID.value()],
          description: `Uploaded by ${data.contactName || 'unknown'} <${data.email}> for ${data.event || 'no event given'}`,
        },
        media: { mimeType: FILE_TYPES[data.ext].mime, body: Readable.from(bytes) },
        fields: 'id, webViewLink',
        supportsAllDrives: true,
      });
      driveUrl = res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view`;
      await record.set({ ...data, createdAt: Timestamp.fromDate(submittedAt), ipHash, driveFileId: res.data.id, driveStatus: 'filed' });
    } catch (err) {
      // The file is not kept anywhere else, so tell the sponsor honestly and
      // leave a record staff can follow up from.
      console.error(`submitSponsorLogo(${record.id}): Drive upload FAILED`, err);
      await record
        .set({ ...data, createdAt: Timestamp.fromDate(submittedAt), ipHash, driveStatus: 'failed', driveError: String(err?.message || err).slice(0, 500) })
        .catch(() => {});
      throw new HttpsError('unavailable', 'We could not save your logo right now.');
    }

    // A failed notification must not fail an upload that is already filed.
    try {
      const mail = buildSponsorLogoEmail(data, { driveUrl, submittedAt });
      const { error } = await new Resend(RESEND_API_KEY.value()).emails.send({
        from: mail.from,
        to: mail.to,
        replyTo: mail.replyTo,
        subject: mail.subject,
        html: mail.html,
      });
      if (error) throw new Error(error.message || 'Resend rejected the message');
    } catch (err) {
      console.error(`submitSponsorLogo(${record.id}): staff email NOT sent`, err);
    }

    return { ok: true };
  }
);

const CLOSED_MESSAGE = 'Volunteer sign-ups are closed.';

/** Best-effort send: a failed email never undoes a sign-up that is committed. */
async function sendBestEffort(label, mail) {
  try {
    const { error } = await new Resend(RESEND_API_KEY.value()).emails.send({
      from: mail.from,
      to: mail.to,
      replyTo: mail.replyTo,
      subject: mail.subject,
      html: mail.html,
    });
    if (error) throw new Error(error.message || 'Resend rejected the message');
  } catch (err) {
    console.error(`${label}: email to ${mail.to} NOT sent`, err);
  }
}

export const submitVolunteerSignup = onCall(
  {
    region: 'us-central1',
    enforceAppCheck: true,
    consumeAppCheckToken: true,
    secrets: [RESEND_API_KEY],
    maxInstances: 5,
  },
  async (request) => {
    const body = request.data && typeof request.data === 'object' ? request.data : {};

    if (typeof body.website === 'string' && body.website.trim() !== '') return { ok: true };

    if (typeof body.elapsedMs !== 'number' || body.elapsedMs < MIN_FILL_MS) {
      throw new HttpsError('failed-precondition', 'Please take a moment and try signing up again.');
    }

    const checked = validateVolunteerSignup(body);
    if (!checked.ok) {
      throw new HttpsError('invalid-argument', 'Please check the form and try again.', { fields: checked.errors });
    }
    const data = checked.value;

    const db = getFirestore();
    const ip = request.rawRequest?.ip || 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex');
    if (!(await takeRateLimitSlot(db, ipHash, 'volunteer_rate', VOLUNTEER_RATE_LIMIT))) {
      throw new HttpsError('resource-exhausted', 'Too many sign-ups from this connection. Please try again later.');
    }

    const eventRef = db.doc(`volunteer_events/${data.eventSlug}`);
    const shiftRef = db.doc(`volunteer_events/${data.eventSlug}/shifts/${data.shiftId}`);
    const signupRef = db.collection('volunteer_signups').doc();
    const cancelToken = randomBytes(24).toString('hex');

    const { shift, eventName } = await db.runTransaction(async (tx) => {
      const [eventSnap, shiftSnap] = await Promise.all([tx.get(eventRef), tx.get(shiftRef)]);
      // A missing event document means sign-ups were never opened.
      if (!eventSnap.exists || eventSnap.data().signupOpen !== true) {
        throw new HttpsError('failed-precondition', CLOSED_MESSAGE);
      }
      if (!shiftSnap.exists) throw new HttpsError('not-found', 'That shift is no longer available.');
      const s = shiftSnap.data();
      if ((s.spotsFilled ?? 0) >= s.spotsTotal) {
        throw new HttpsError('failed-precondition', 'Sorry, that shift just filled up.');
      }
      // Duplicate emails are allowed on purpose: households share addresses,
      // and one person may take several slots.
      tx.create(signupRef, {
        eventSlug: data.eventSlug,
        shiftId: data.shiftId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        note: data.note,
        cancelToken,
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        ipHash,
      });
      tx.update(shiftRef, { spotsFilled: FieldValue.increment(1) });
      return { shift: s, eventName: eventSnap.data().name || 'event' };
    });

    await Promise.all([
      sendBestEffort(
        `submitVolunteerSignup(${signupRef.id})`,
        buildVolunteerConfirmationEmail({ signup: data, shift, eventName, cancelToken })
      ),
      sendBestEffort(
        `submitVolunteerSignup(${signupRef.id}) staff`,
        buildVolunteerStaffEmail({ kind: 'signup', signup: data, shift, eventName })
      ),
    ]);

    return { ok: true };
  }
);

export const cancelVolunteerSignup = onCall(
  {
    region: 'us-central1',
    enforceAppCheck: true,
    consumeAppCheckToken: true,
    secrets: [RESEND_API_KEY],
    maxInstances: 5,
  },
  async (request) => {
    const token = typeof request.data?.token === 'string' ? request.data.token.trim() : '';
    if (!/^[a-f0-9]{48}$/.test(token)) {
      throw new HttpsError('not-found', 'This cancellation link is not valid.');
    }

    const db = getFirestore();
    const found = await db.collection('volunteer_signups').where('cancelToken', '==', token).limit(1).get();
    if (found.empty) throw new HttpsError('not-found', 'This cancellation link is not valid.');
    const signupRef = found.docs[0].ref;

    const signup = await db.runTransaction(async (tx) => {
      const s = (await tx.get(signupRef)).data();
      if (s.status !== 'active') {
        throw new HttpsError('failed-precondition', 'This sign-up was already cancelled.');
      }
      // An admin may have deleted the shift; the cancellation must still work.
      const shiftRef = db.doc(`volunteer_events/${s.eventSlug}/shifts/${s.shiftId}`);
      const shiftSnap = await tx.get(shiftRef);
      tx.update(signupRef, { status: 'cancelled', cancelledAt: FieldValue.serverTimestamp() });
      if (shiftSnap.exists) {
        // Floored: a shift deleted and re-created with spotsFilled: 0 while
        // this sign-up stayed active must not go negative.
        tx.update(shiftRef, { spotsFilled: Math.max(0, (shiftSnap.data().spotsFilled ?? 0) - 1) });
      }
      return s;
    });

    const [shiftSnap, eventSnap] = await Promise.all([
      db.doc(`volunteer_events/${signup.eventSlug}/shifts/${signup.shiftId}`).get(),
      db.doc(`volunteer_events/${signup.eventSlug}`).get(),
    ]);
    const shift = shiftSnap.data();
    const eventName = eventSnap.data()?.name || 'event';
    await Promise.all([
      sendBestEffort(
        `cancelVolunteerSignup(${signupRef.id})`,
        buildVolunteerCancelEmail({ signup, shift, eventName, eventSlug: signup.eventSlug })
      ),
      sendBestEffort(
        `cancelVolunteerSignup(${signupRef.id}) staff`,
        buildVolunteerStaffEmail({
          kind: 'cancel',
          signup,
          shift: shift ?? { role: 'a deleted shift', time: '' },
          eventName,
        })
      ),
    ]);

    return { ok: true };
  }
);
