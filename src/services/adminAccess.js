/**
 * Who counts as an administrator.
 *
 * Authentication alone is not authorization: a signed-in Firebase account is
 * not necessarily a DDA administrator. This mirrors the `isAdmin()` function in
 * firestore.rules and storage.rules — keep the three in step. Firebase Rules
 * remain the enforcement point; this check decides what the portal renders.
 *
 * Preferred setup is the custom `admin` claim, set with the Firebase Admin SDK:
 *   admin.auth().setCustomUserClaims(uid, { admin: true })
 * The email list is the fallback the rules already accept.
 */
export const ADMIN_EMAILS = [
  'jermdw@gmail.com',
  'welcome@enjoysenoia.com',
  'treasurer@enjoysenoia.com',
  'webmaster@enjoysenoia.com',
];

/**
 * Resolves true only for an account carrying the `admin` claim or an
 * allowlisted email. Forces a token refresh so a claim granted during the
 * session is picked up without signing out.
 */
export async function isAuthorizedAdmin(user) {
  if (!user) return false;

  try {
    const token = await user.getIdTokenResult(true);
    if (token?.claims?.admin === true) return true;
  } catch (err) {
    console.warn('Could not read admin claim:', err);
  }

  return ADMIN_EMAILS.includes((user.email || '').toLowerCase());
}
