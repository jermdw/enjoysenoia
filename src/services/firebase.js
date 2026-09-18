import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
