import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

function envValue(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readFirebaseOptions(): FirebaseOptions | null {
  const apiKey = envValue(import.meta.env.VITE_FIREBASE_API_KEY);
  const authDomain = envValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  const projectId = envValue(import.meta.env.VITE_FIREBASE_PROJECT_ID);
  const appId = envValue(import.meta.env.VITE_FIREBASE_APP_ID);

  if (
    apiKey.length === 0 ||
    authDomain.length === 0 ||
    projectId.length === 0 ||
    appId.length === 0
  ) {
    return null;
  }

  const options: FirebaseOptions = {
    apiKey,
    authDomain,
    projectId,
    appId,
  };

  const storageBucket = envValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
  const messagingSenderId = envValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);

  if (storageBucket.length > 0) {
    options.storageBucket = storageBucket;
  }

  if (messagingSenderId.length > 0) {
    options.messagingSenderId = messagingSenderId;
  }

  return options;
}

const firebaseOptions = readFirebaseOptions();

export const firebaseApp: FirebaseApp | null = firebaseOptions
  ? initializeApp(firebaseOptions)
  : null;

export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
