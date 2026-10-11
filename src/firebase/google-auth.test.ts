import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FirebaseError } from 'firebase/app';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const authState = vi.hoisted(() => ({
  current: { kind: 'auth' } as { kind: string } | null,
}));

vi.mock('./firebase', () => ({
  get firebaseAuth() {
    return authState.current;
  },
}));

vi.mock('firebase/app', () => ({
  FirebaseError: class FirebaseError extends Error {
    readonly code: string;

    constructor(code: string, message = '') {
      super(message);
      this.code = code;
      this.name = 'FirebaseError';
    }
  },
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class GoogleAuthProvider {},
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

function credential(fields: {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): Awaited<ReturnType<typeof signInWithPopup>> {
  return { user: fields } as Awaited<ReturnType<typeof signInWithPopup>>;
}

describe('Google authentication', () => {
  beforeEach(() => {
    authState.current = { kind: 'auth' };
    vi.mocked(signOut).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the Google profile', async () => {
    const { signInWithGoogle } = await import('./google-auth');
    vi.mocked(signInWithPopup).mockResolvedValue(
      credential({
        displayName: 'Ada',
        email: 'ada@example.com',
        photoURL: 'https://cdn.example/a.png',
      }),
    );

    await expect(signInWithGoogle()).resolves.toEqual({
      displayName: 'Ada',
      email: 'ada@example.com',
      avatarUrl: 'https://cdn.example/a.png',
    });
    expect(signInWithPopup).toHaveBeenCalledWith(authState.current, expect.any(GoogleAuthProvider));
  });

  it('signs out and rejects a Google account that has no email', async () => {
    const { signInWithGoogle } = await import('./google-auth');
    vi.mocked(signInWithPopup).mockResolvedValue(
      credential({ displayName: 'Ada', email: null, photoURL: null }),
    );

    await expect(signInWithGoogle()).rejects.toMatchObject({
      name: 'AuthRequestError',
      message: 'This Google account has no email address.',
      canceled: false,
    });
    expect(signOut).toHaveBeenCalledWith(authState.current);
  });

  it('reports that authentication is not configured', async () => {
    authState.current = null;
    const { signInWithGoogle } = await import('./google-auth');

    await expect(signInWithGoogle()).rejects.toMatchObject({
      message: 'Authentication is not configured.',
    });
    expect(signInWithPopup).not.toHaveBeenCalled();
  });

  it.each([
    ['auth/popup-closed-by-user', 'Google sign-in was canceled.', true],
    ['auth/cancelled-popup-request', 'Google sign-in was canceled.', true],
    ['auth/popup-blocked', 'Allow pop-ups to sign in with Google.', false],
    [
      'auth/account-exists-with-different-credential',
      'An account with this email already exists. Sign in with email.',
      false,
    ],
    ['auth/network-request-failed', 'Network error. Check your connection and try again.', false],
    ['auth/internal-error', 'Could not sign in with Google.', false],
  ] as const)('maps %s', async (code, message, canceled) => {
    const { signInWithGoogle } = await import('./google-auth');
    vi.mocked(signInWithPopup).mockRejectedValue(new FirebaseError(code, 'failed'));

    await expect(signInWithGoogle()).rejects.toMatchObject({ message, canceled });
  });

  it('uses a generic message for a non-Firebase failure', async () => {
    const { signInWithGoogle } = await import('./google-auth');
    vi.mocked(signInWithPopup).mockRejectedValue(new Error('offline'));

    await expect(signInWithGoogle()).rejects.toMatchObject({
      message: 'Could not sign in with Google.',
      canceled: false,
    });
  });

  it('keeps an empty display name as a blank string', async () => {
    const { signInWithGoogle } = await import('./google-auth');
    vi.mocked(signInWithPopup).mockResolvedValue(
      credential({ displayName: null, email: 'ada@example.com', photoURL: null }),
    );

    await expect(signInWithGoogle()).resolves.toEqual({
      displayName: '',
      email: 'ada@example.com',
      avatarUrl: null,
    });
  });
});
