import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'app' })),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ name: 'auth' })),
}));

const FIREBASE_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
] as const;

function clearFirebaseEnv(): void {
  for (const key of FIREBASE_ENV) {
    vi.stubEnv(key, '');
  }
}

async function loadFirebase(): Promise<typeof import('./firebase')> {
  vi.resetModules();
  return import('./firebase');
}

describe('firebase setup', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('leaves the app unset when a required value is missing or blank', async () => {
    clearFirebaseEnv();
    vi.stubEnv('VITE_FIREBASE_API_KEY', '   ');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'test-app');

    const firebase = await loadFirebase();

    expect(firebase.firebaseApp).toBeNull();
    expect(firebase.firebaseAuth).toBeNull();
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it('initializes Auth from the required values and keeps optional ones when present', async () => {
    clearFirebaseEnv();
    vi.stubEnv('VITE_FIREBASE_API_KEY', ' test-key ');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'test-app');

    const required = await loadFirebase();

    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: 'test-key',
      authDomain: 'test.firebaseapp.com',
      projectId: 'test-project',
      appId: 'test-app',
    });
    expect(getAuth).toHaveBeenCalledWith(required.firebaseApp);
    expect(required.firebaseAuth).toEqual({ name: 'auth' });

    vi.mocked(initializeApp).mockClear();
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', ' test-bucket ');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123');
    await loadFirebase();

    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: 'test-key',
      authDomain: 'test.firebaseapp.com',
      projectId: 'test-project',
      appId: 'test-app',
      storageBucket: 'test-bucket',
      messagingSenderId: '123',
    });
  });
});
