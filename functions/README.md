# Cloud Functions

Currently one function, `submitContactMessage`, behind the `/contact` page.
It is **not** deployed by CI (`deploy.yml` only deploys Hosting).

## One-time setup

1. **Sending domain.** In Resend, add `updates.enjoysenoia.com` and add the DNS
   records it shows (at GoDaddy) until it reads *Verified*. The sender is
   `Enjoy Senoia <website@updates.enjoysenoia.com>`; change `SENDER_DOMAIN` in
   `contactEmail.js` if you pick another. Use a subdomain so the records do not
   touch the apex SPF/MX that mail already relies on.
2. **API key.** A Resend key that can send from that domain:
   `firebase functions:secrets:set RESEND_API_KEY --project enjoysenoia`
3. **Deploy.**
   `npm --prefix functions install && firebase deploy --only functions --project enjoysenoia`
   (always pass `--project`; the CLI default resolves to another project).
   The deploying account needs Cloud Functions Admin, Cloud Build and Secret
   Manager access; the project owner has these.
4. **App Check.** The function enforces App Check, so the site must be built
   with `VITE_RECAPTCHA_SITE_KEY` (it already is in CI). Local development needs
   the App Check debug token registered, as for Firestore.

## Recipient

`RECIPIENT` in `contactEmail.js` (currently `info@enjoysenoia.com`).

## Reading what was sent

Every message is stored in Firestore `contact_messages` before the email is
attempted, with `emailStatus` of `sent` or `failed`. Only the Firebase console
and the Admin SDK can read it; no client rules exist for it.

## Tests

`cd functions && npm test`
