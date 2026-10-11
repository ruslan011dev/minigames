import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { readAppSession, type SessionProfile } from '../session/app-session';
import { firebaseAuth } from './firebase';

export class AuthRequestError extends Error {
  readonly canceled: boolean;

  constructor(message: string, canceled = false) {
    super(message);
    this.name = 'AuthRequestError';
    this.canceled = canceled;
  }
}

export type EmailAuthRequest =
  | { mode: 'login'; email: string; password: string }
  | { mode: 'register'; username: string; email: string; password: string };

export async function authenticateWithEmail(request: EmailAuthRequest): Promise<SessionProfile> {
  if (!firebaseAuth) {
    throw new AuthRequestError('Authentication is not configured.');
  }

  try {
    if (request.mode === 'login') {
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        request.email,
        request.password,
      );

      return {
        displayName: credential.user.displayName ?? '',
        email: credential.user.email ?? request.email,
        avatarUrl: credential.user.photoURL,
      };
    }

    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      request.email,
      request.password,
    );
    await updateProfile(credential.user, { displayName: request.username });

    return {
      displayName: request.username,
      email: credential.user.email ?? request.email,
      avatarUrl: credential.user.photoURL,
    };
  } catch (error) {
    throw new AuthRequestError(messageForAuthError(error, request.mode));
  }
}

export async function signOutPreservedUser(): Promise<void> {
  if (!firebaseAuth) {
    return;
  }

  const auth = firebaseAuth;
  await new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      unsubscribe();
      resolve();
    });
  });
  if (readAppSession().status === 'active') {
    return;
  }

  await signOut(auth);
}

function messageForAuthError(error: unknown, mode: EmailAuthRequest['mode']): string {
  if (!(error instanceof FirebaseError)) {
    return mode === 'login' ? 'Could not sign in.' : 'Could not create the account.';
  }

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must include an uppercase letter, a digit, and a special character.';
    default:
      return mode === 'login' ? 'Could not sign in.' : 'Could not create the account.';
  }
}
