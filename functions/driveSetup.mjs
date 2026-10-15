/**
 * One-time Drive authorisation for the sponsor logo upload.
 *
 *   cd functions && node driveSetup.mjs <OAuth client ID> <OAuth client secret>
 *
 * Opens a Google sign-in URL; sign in as the account that should OWN the logos
 * (it will be able to share the folder with staff). Then creates a "Sponsor
 * Logos" folder in that account's Drive and prints the refresh token and folder
 * ID to store (see README). Needs a "Desktop app" OAuth client from the Google
 * Cloud console. Scope is drive.file: the token can only reach files and
 * folders this app creates, never the rest of the account's Drive.
 */
import http from 'node:http';
import { auth, drive } from '@googleapis/drive';

const [clientId, clientSecret] = process.argv.slice(2);
if (!clientId || !clientSecret) {
  console.error('Usage: node driveSetup.mjs <OAuth client ID> <OAuth client secret>');
  process.exit(1);
}

const server = http.createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const redirectUri = `http://127.0.0.1:${server.address().port}`;
const oauth = new auth.OAuth2(clientId, clientSecret, redirectUri);

const url = oauth.generateAuthUrl({
  access_type: 'offline',
  // Without this Google omits the refresh token on a repeat authorisation.
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive.file'],
});
console.log(`\nOpen this URL and sign in as the account that will own the logos:\n\n${url}\n`);

const code = await new Promise((resolve, reject) => {
  server.on('request', (req, res) => {
    const params = new URL(req.url, redirectUri).searchParams;
    res.end(params.get('code') ? 'Authorised. You can close this tab.' : 'Authorisation failed. Return to the terminal.');
    if (params.get('code')) resolve(params.get('code'));
    else if (params.get('error')) reject(new Error(params.get('error')));
  });
});
server.close();

const { tokens } = await oauth.getToken(code);
if (!tokens.refresh_token) {
  console.error('Google did not return a refresh token. Remove this app at myaccount.google.com/permissions and run again.');
  process.exit(1);
}
oauth.setCredentials(tokens);

const folder = await drive({ version: 'v3', auth: oauth }).files.create({
  requestBody: { name: 'Sponsor Logos', mimeType: 'application/vnd.google-apps.folder' },
  fields: 'id, webViewLink',
});

console.log(`
Done. A folder named "Sponsor Logos" now exists in that account's Drive:
  ${folder.data.webViewLink}
Share it with Melissa and anyone else who needs the logos.

Store these (the CLI prompts for each value, so nothing lands in your shell history):
  firebase functions:secrets:set DRIVE_CLIENT_ID --project enjoysenoia       -> ${clientId}
  firebase functions:secrets:set DRIVE_CLIENT_SECRET --project enjoysenoia   -> the client secret you passed in
  firebase functions:secrets:set DRIVE_REFRESH_TOKEN --project enjoysenoia   -> ${tokens.refresh_token}

and set the folder ID when deploying (or in functions/.env):
  SPONSOR_LOGO_FOLDER_ID=${folder.data.id}
`);
