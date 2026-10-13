# Cloud Functions

Currently one function, `submitContactMessage`, behind the `/contact` page.
It is **not** deployed by CI (`deploy.yml` only deploys Hosting).

## One-time setup

1. **Sending domain.** `info.enjoysenoia.com` is added and verified in Resend.
   The sender is `Enjoy Senoia <website@info.enjoysenoia.com>`; change
   `SENDER_DOMAIN` in `contactEmail.js` to use another verified domain. It is a
   subdomain so its records do not touch the apex SPF/MX that mail already
   relies on.
2. **API key.** In Resend, *API Keys → Create API Key*, permission *Sending
   access*, domain `info.enjoysenoia.com`. Then store it as a secret. The CLI
   prompts for the value, so it never lands in your shell history or this repo:
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
