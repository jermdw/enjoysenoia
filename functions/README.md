# Cloud Functions

Four functions: `submitContactMessage` (the `/contact` page),
`submitSponsorLogo` (the `/sponsor-logo` page; see *Sponsor logo uploads* below)
and `submitVolunteerSignup` / `cancelVolunteerSignup` (the `/volunteer/:eventSlug`
shift board; see *Volunteer sign-ups* below).
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

The function uploads to Drive as a regular Google account, not a service
account: service accounts have no storage quota, so they cannot own files in a
normal folder, and the DDA has no Workspace shared drive. The OAuth scope is
`drive.file`, so the token can only reach the folder this app creates.

One-time setup (pick the Google account that will own the logos; it shares the
folder with Melissa and anyone else, and should be a stable account, not one
somebody might close):

1. **Enable the Drive API:**
   `gcloud services enable drive.googleapis.com --project enjoysenoia`
2. **OAuth consent screen.** Google Cloud console > APIs & Services > OAuth
   consent screen (Google Auth platform). User type *External*, app name
   "Enjoy Senoia logo upload", add `https://www.googleapis.com/auth/drive.file`
   as the only scope, then **publish the app to production**. In *Testing* mode
   Google expires the refresh token after 7 days. `drive.file` is not a
   sensitive scope, so publishing needs no Google review.
3. **OAuth client.** Credentials > Create credentials > OAuth client ID >
   *Desktop app*. Note the client ID and secret.
4. **Authorise once.** `npm --prefix functions install`, then
   `cd functions && node driveSetup.mjs <client ID> <client secret>`. Open the
   URL it prints and sign in as the owning account. It creates a "Sponsor
   Logos" folder in that account's Drive and prints the refresh token and the
   folder ID. (An "unverified app" warning on the sign-in page is expected for a
   private app: *Advanced > Go to ... (unsafe)*.)
5. **Share the folder** with Melissa and whoever else needs the logos.
6. **Store the secrets** the script printed (the CLI prompts for each value):
   `firebase functions:secrets:set DRIVE_CLIENT_ID --project enjoysenoia`, and
   the same for `DRIVE_CLIENT_SECRET` and `DRIVE_REFRESH_TOKEN`.
7. **Deploy.** `firebase deploy --only functions --project enjoysenoia`. It asks
   for `SPONSOR_LOGO_FOLDER_ID` the first time (or put it in `functions/.env`).
   Functions are not deployed by CI, so merging the site change alone leaves the
   page showing "we could not save your logo" until this is done.
8. **Ticket Tailor.** In each event's confirmation email add something like:
   *"Sponsoring with us for the first time, or has your logo changed? Please
   send it here: https://www.enjoysenoia.com/sponsor-logo?event=Senoia+Porchfest"*.
   `?event=` is optional and prefills the event field.

If uploads start failing with `invalid_grant` in the function logs, the token
was revoked or went unused for about six months: re-run step 4 and update
`DRIVE_REFRESH_TOKEN`.

## Volunteer sign-ups

`/volunteer/:eventSlug` is a shift board, ported from the Senoia Car Show's
volunteer system. Volunteers have no account, so the page calls
`submitVolunteerSignup`, which has the same protections as the contact form
(App Check token consumed, honeypot, fill time, 10 sign-ups per IP per hour),
then takes a spot inside a Firestore transaction that re-checks capacity and the
event's `signupOpen` switch. It writes `volunteer_signups` (name, email, phone,
note, a random `cancelToken`), emails the volunteer a confirmation with a cancel
link, and emails info@enjoysenoia.com. Emails are best-effort: a failed send
never undoes a sign-up. `cancelVolunteerSignup` (the `/volunteer-cancel?token=`
page) releases the spot, floored at zero.

Data: `volunteer_events/{eventSlug}` (`name`, `intro`, `signupOpen`),
`volunteer_events/{eventSlug}/shifts/{id}` (`role`, `time`, `note`, `spotsTotal`,
`spotsFilled`, `sortOrder`; public read, counts only) and `volunteer_signups`
(admin read only; no client creates). Staff manage all of it in the admin portal's
**Volunteers** tab. An event gets a board when staff tick "Link volunteer
sign-up" on it in the Events tab (`volunteer_enabled` on the event's Firestore
patch; `volunteer_url` in `data/event_overrides.json` is the built-in default).

**Sign-ups stay closed until staff open them**: a missing event document, or
`signupOpen: false`, makes the function refuse. Rules and functions are not
deployed by CI; deploy both with `--project enjoysenoia` before the page goes
live: `firebase deploy --only firestore:rules,functions --project enjoysenoia`.
