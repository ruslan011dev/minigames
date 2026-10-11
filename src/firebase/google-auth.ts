import { FirebaseError } from 'firebase/app';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import type { SessionProfile } from '../session/app-session';
import { AuthRequestError } from './email-auth';
import { firebaseAuth } from './firebase';

export async function signInWithGoogle(): Promise<SessionProfile> {
  if (!firebaseAuth) {
    throw new AuthRequestError('Authentication is not configured.');
  }

  try {
    const credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    const email = credential.user.email ?? '';

    if (email.length === 0) {
      await signOut(firebaseAuth);
      throw new AuthRequestError('This Google account has no email address.');
    }

    return {
      displayName: credential.user.displayName ?? '',
      email,
      avatarUrl: credential.user.photoURL,
    };
  } catch (error) {
    if (error instanceof AuthRequestError) {
      throw error;
    }

    throw googleFailure(error);
  }
}

function googleFailure(error: unknown): AuthRequestError {
  if (!(error instanceof FirebaseError)) {
    return new AuthRequestError('Could not sign in with Google.');
  }

  switch (error.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return new AuthRequestError('Google sign-in was canceled.', true);
    case 'auth/popup-blocked':
      return new AuthRequestError('Allow pop-ups to sign in with Google.');
    case 'auth/account-exists-with-different-credential':
      return new AuthRequestError('An account with this email already exists. Sign in with email.');
    case 'auth/network-request-failed':
      return new AuthRequestError('Network error. Check your connection and try again.');
    default:
      return new AuthRequestError('Could not sign in with Google.');
  }
}
