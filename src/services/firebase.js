import { initializeApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Configuration comes from the environment. A production build that is missing
// any of it fails loudly rather than silently pointing at a placeholder project
// where nothing a visitor submits would be stored.
const requiredConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const missingKeys = Object.entries(requiredConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0 && import.meta.env.PROD) {
  throw new Error(
    `Missing Firebase configuration: ${missingKeys.join(', ')}. Set the matching VITE_FIREBASE_* environment variables before building.`
  );
}

if (missingKeys.length > 0) {
  console.warn(
    `Firebase is running in local preview mode; ${missingKeys.join(', ')} are unset, so reads and writes will fail.`
  );
}

const firebaseConfig = {
  ...requiredConfig,
  apiKey: requiredConfig.apiKey || 'preview-mode-unconfigured',
  projectId: requiredConfig.projectId || 'enjoysenoia-preview'
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApps()[0];

// App Check attaches a reCAPTCHA Enterprise token to Firestore and Storage
// requests so Firebase can tell the real site from scripts replaying the
// public web config. The site key is public. It is skipped (not thrown on)
// when unset so local previews and builds without it keep working; turn on
// enforcement in the console only once tokens are flowing.
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (isFirstInit && recaptchaSiteKey) {
  if (import.meta.env.DEV) {
    // Lets localhost through App Check; the console prints the token to register.
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true
  });
} else if (!recaptchaSiteKey) {
  console.warn('VITE_RECAPTCHA_SITE_KEY is unset; App Check is off, so requests carry no attestation token.');
}

export const db = getFirestore(app);

// Local development against the emulators, so testing writes never touches
// the live project (PR previews share it). Opt in per service in .env.local,
// dev builds only:
//   VITE_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
//   VITE_AUTH_EMULATOR_HOST=127.0.0.1:9099
//   VITE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
const emulatorHost = (name) => {
  const value = import.meta.env.DEV && import.meta.env[name];
  if (!value) return null;
  const [host, port] = value.split(':');
  return [host, Number(port)];
};
const firestoreEmulator = emulatorHost('VITE_FIRESTORE_EMULATOR_HOST');
if (isFirstInit && firestoreEmulator) connectFirestoreEmulator(db, ...firestoreEmulator);

export const auth = getAuth(app);
export const storage = getStorage(app);

const authEmulator = emulatorHost('VITE_AUTH_EMULATOR_HOST');
if (isFirstInit && authEmulator) {
  connectAuthEmulator(auth, `http://${authEmulator[0]}:${authEmulator[1]}`, { disableWarnings: true });
}
const storageEmulator = emulatorHost('VITE_STORAGE_EMULATOR_HOST');
if (isFirstInit && storageEmulator) connectStorageEmulator(storage, ...storageEmulator);
export default app;
