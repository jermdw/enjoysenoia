# Cloud Functions

Two functions: `submitContactMessage` (the `/contact` page) and
`submitSponsorLogo` (the `/sponsor-logo` page; see *Sponsor logo uploads* below).
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
3. **Let the function verify App Check tokens.** The function runs as the
   default compute service account, which cannot verify App Check tokens until
   it is granted the verifier role. Without it every submission fails with a
   401 before any of the function's code runs (the log says
   `Permission 'firebaseappcheck.appCheckTokens.verify' denied`). One time:

   ```bash
   gcloud projects add-iam-policy-binding enjoysenoia \
     --member="serviceAccount:719218412135-compute@developer.gserviceaccount.com" \
     --role="roles/firebaseappcheck.tokenVerifier"
   ```

   The account is `<project number>-compute@developer.gserviceaccount.com`;
   confirm it with `gcloud functions describe submitContactMessage --gen2
   --region us-central1 --project enjoysenoia --format='value(serviceConfig.serviceAccountEmail)'`.
4. **Deploy.**
   `npm --prefix functions install && firebase deploy --only functions --project enjoysenoia`
   (always pass `--project`; the CLI default resolves to another project).
   The deploying account needs Cloud Functions Admin, Cloud Build and Secret
   Manager access; the project owner has these.
5. **App Check.** The function enforces App Check, so the site must be built
   with `VITE_RECAPTCHA_SITE_KEY` (it already is in CI). Local development needs
   the App Check debug token registered, as for Firestore.

   **PR preview channels cannot send.** The reCAPTCHA key's allowed domains
   cover `enjoysenoia.com` and `enjoysenoia.web.app` (and their subdomains), but
   a preview host such as `enjoysenoia--pr49-xyz.web.app` is a sibling of those,
   not a subdomain, so the browser fails with `appCheck/recaptcha-error` before
   any request is made. The page loads and validates on a preview; test sending
   on `www.enjoysenoia.com/contact` after merge. Adding `web.app` itself would
   let any Firebase site mint tokens for this key, so don't.

## Recipient

`RECIPIENT` in `contactEmail.js` (currently `info@enjoysenoia.com`).

## Reading what was sent

Every message is stored in Firestore `contact_messages` before the email is
attempted, with `emailStatus` of `sent` or `failed`. Only the Firebase console
and the Admin SDK can read it; no client rules exist for it.

## Tests

`cd functions && npm test`

## Sponsor logo uploads

`/sponsor-logo` is where event sponsors send their logo. The link goes in the
Ticket Tailor confirmation email. The page calls `submitSponsorLogo`, which has
the same protections as the contact form (App Check token consumed, honeypot,
fill time, 10 uploads per IP per hour), checks the file (png, jpg, webp, svg,
pdf, eps or ai; 7 MB; the first bytes must match the extension), files it in a
Google Drive folder as `Sponsor - Event - date.ext`, writes a record to
Firestore `sponsor_logos` (no client rules; console and Admin SDK only) and
emails info@enjoysenoia.com through Resend. A failed email does not fail the
upload. If Drive fails the sponsor is told to email the logo instead, and the
record is left with `driveStatus: 'failed'`.

One-time setup:

1. **A shared drive.** In Google Drive create a *shared drive* (for example
   "Sponsor Logos") and add Melissa and whoever else needs the logos as members.
   A normal My Drive folder will not work: service accounts have no storage
   quota of their own, so uploads into a person's folder are refused. Create a
   folder inside it if you want, and copy its ID from the URL
   (`drive.google.com/drive/folders/<ID>`).
2. **Let the function write to it.** Add the function's runtime service account
   (`<project number>-compute@developer.gserviceaccount.com`, as in step 3
   above) to the shared drive as *Content manager*.
3. **Enable the Drive API** on the `enjoysenoia` project:
   `gcloud services enable drive.googleapis.com --project enjoysenoia`
4. **Deploy.** `firebase deploy --only functions --project enjoysenoia`. The CLI
   asks for `SPONSOR_LOGO_FOLDER_ID` the first time; paste the folder ID. (To
   skip the prompt put `SPONSOR_LOGO_FOLDER_ID=<ID>` in `functions/.env`.)
   Functions are not deployed by CI, so merging the site change alone leaves the
   page showing "we could not save your logo" until this is done.
5. **Ticket Tailor.** In each event's confirmation email add something like:
   *"Sponsoring with us for the first time, or has your logo changed? Please
   send it here: https://www.enjoysenoia.com/sponsor-logo?event=Senoia+Porchfest"*.
   `?event=` is optional and prefills the event field.
