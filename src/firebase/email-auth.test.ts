import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { APP_SESSION_STORAGE_KEY, saveAppSession } from '../session/app-session';

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
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}));

function installStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem(key: string): string | null {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    },
    removeItem(key: string): void {
      store.delete(key);
    },
  });
  return store;
}

function user(fields: {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}): Awaited<ReturnType<typeof signInWithEmailAndPassword>> {
  return { user: fields } as Awaited<ReturnType<typeof signInWithEmailAndPassword>>;
}

describe('email authentication', () => {
  beforeEach(() => {
    authState.current = { kind: 'auth' };
    installStorage();
    vi.mocked(signOut).mockResolvedValue();
    vi.mocked(updateProfile).mockResolvedValue();
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, next) => {
      const unsubscribe = vi.fn();
      queueMicrotask(() => {
        if (typeof next === 'function') {
          next(null);
        }
      });
      return unsubscribe;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('signs in and fills a missing name or email from the request', async () => {
    const { authenticateWithEmail } = await import('./email-auth');
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue(
      user({
        displayName: 'Ada',
        email: 'ada@example.com',
        photoURL: 'https://cdn.example/a.png',
      }),
    );

    await expect(
      authenticateWithEmail({ mode: 'login', email: 'ada@example.com', password: 'secret' }),
    ).resolves.toEqual({
      displayName: 'Ada',
      email: 'ada@example.com',
      avatarUrl: 'https://cdn.example/a.png',
    });
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      authState.current,
      'ada@example.com',
      'secret',
    );

    vi.mocked(signInWithEmailAndPassword).mockResolvedValue(
      user({ displayName: null, email: null, photoURL: null }),
    );
    await expect(
      authenticateWithEmail({ mode: 'login', email: 'ada@example.com', password: 'secret' }),
    ).resolves.toEqual({
      displayName: '',
      email: 'ada@example.com',
      avatarUrl: null,
    });
  });

  it('registers with the chosen username', async () => {
    const { authenticateWithEmail } = await import('./email-auth');
    const credential = user({
      displayName: null,
      email: null,
      photoURL: 'https://cdn.example/a.png',
    });
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(credential);

    await expect(
      authenticateWithEmail({
        mode: 'register',
        username: 'Ada',
        email: 'ada@example.com',
        password: 'secret',
      }),
    ).resolves.toEqual({
      displayName: 'Ada',
      email: 'ada@example.com',
      avatarUrl: 'https://cdn.example/a.png',
    });
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      authState.current,
      'ada@example.com',
      'secret',
    );
    expect(updateProfile).toHaveBeenCalledWith(credential.user, { displayName: 'Ada' });
  });

  it('reports that authentication is not configured', async () => {
    authState.current = null;
    const { authenticateWithEmail } = await import('./email-auth');

    await expect(
      authenticateWithEmail({ mode: 'login', email: 'ada@example.com', password: 'secret' }),
    ).rejects.toMatchObject({
      name: 'AuthRequestError',
      message: 'Authentication is not configured.',
      canceled: false,
    });
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it.each([
    ['auth/invalid-credential', 'Email or password is incorrect.'],
    ['auth/wrong-password', 'Email or password is incorrect.'],
    ['auth/user-not-found', 'Email or password is incorrect.'],
    ['auth/invalid-login-credentials', 'Email or password is incorrect.'],
    ['auth/email-already-in-use', 'An account with this email already exists.'],
    ['auth/too-many-requests', 'Too many attempts. Try again later.'],
    ['auth/network-request-failed', 'Network error. Check your connection and try again.'],
    ['auth/invalid-email', 'Enter a valid email address.'],
    [
      'auth/weak-password',
      'Password must include an uppercase letter, a digit, and a special character.',
    ],
  ] as const)('maps %s to a readable message', async (code, message) => {
    const { authenticateWithEmail } = await import('./email-auth');
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(new FirebaseError(code, 'failed'));

    await expect(
      authenticateWithEmail({ mode: 'login', email: 'ada@example.com', password: 'secret' }),
    ).rejects.toMatchObject({ message, canceled: false });
  });

  it('uses a generic message when the failure has no Firebase code', async () => {
    const { authenticateWithEmail } = await import('./email-auth');
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(new Error('offline'));
    await expect(
      authenticateWithEmail({ mode: 'login', email: 'ada@example.com', password: 'secret' }),
    ).rejects.toMatchObject({ message: 'Could not sign in.' });

    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(
      new FirebaseError('auth/internal-error', 'failed'),
    );
    await expect(
      authenticateWithEmail({ mode: 'login', email: 'ada@example.com', password: 'secret' }),
    ).rejects.toMatchObject({ message: 'Could not sign in.' });

    vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(
      new FirebaseError('auth/internal-error', 'failed'),
    );
    await expect(
      authenticateWithEmail({
        mode: 'register',
        username: 'Ada',
        email: 'ada@example.com',
        password: 'secret',
      }),
    ).rejects.toMatchObject({ message: 'Could not create the account.' });

    vi.mocked(createUserWithEmailAndPassword).mockRejectedValue('nope');
    await expect(
      authenticateWithEmail({
        mode: 'register',
        username: 'Ada',
        email: 'ada@example.com',
        password: 'secret',
      }),
    ).rejects.toMatchObject({ message: 'Could not create the account.' });
  });

  it('signs out a restored Firebase user only when the app session is not active', async () => {
    const { signOutPreservedUser } = await import('./email-auth');
    const store = installStorage();

    await signOutPreservedUser();
    expect(onAuthStateChanged).toHaveBeenCalledWith(authState.current, expect.any(Function));
    expect(signOut).toHaveBeenCalledWith(authState.current);

    saveAppSession({ displayName: 'Ada', email: 'ada@example.com' }, Date.now());
    vi.mocked(signOut).mockClear();
    await signOutPreservedUser();
    expect(signOut).not.toHaveBeenCalled();
    expect(store.has(APP_SESSION_STORAGE_KEY)).toBe(true);

    authState.current = null;
    vi.mocked(onAuthStateChanged).mockClear();
    await signOutPreservedUser();
    expect(onAuthStateChanged).not.toHaveBeenCalled();
  });
});
