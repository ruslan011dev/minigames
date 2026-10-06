export const APP_SESSION_STORAGE_KEY = 'minigames:minigames-f07b2:app-session';

export const APP_SESSION_LIFETIME_MS = 5 * 60 * 1000;

const FALLBACK_PROFILE_NAME = 'Player';

export interface AppSession {
  displayName: string;
  email: string;
  authenticatedAt: number;
  avatarUrl?: string;
}

export interface SessionProfile {
  displayName: string;
  email: string;
  avatarUrl?: string | null;
}

export type SessionRead =
  | { status: 'anonymous' }
  | { status: 'active'; session: AppSession }
  | { status: 'expired' }
  | { status: 'invalid' };

export function profileLabel(displayName: string, email: string): string {
  const name = displayName.trim();
  if (name.length > 0) {
    return name;
  }

  const localPart = email.split('@')[0]?.trim() ?? '';
  if (localPart.length > 0) {
    return localPart;
  }

  return FALLBACK_PROFILE_NAME;
}

export function saveAppSession(profile: SessionProfile, authenticatedAt = Date.now()): AppSession {
  const session: AppSession = {
    displayName: profile.displayName,
    email: profile.email,
    authenticatedAt,
  };

  if (profile.avatarUrl) {
    session.avatarUrl = profile.avatarUrl;
  }

  localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function readAppSession(now = Date.now()): SessionRead {
  const raw = readStoredSession();
  if (raw === null) {
    return { status: 'anonymous' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearAppSession();
    return { status: 'invalid' };
  }

  if (!isAppSession(parsed)) {
    clearAppSession();
    return { status: 'invalid' };
  }

  if (now - parsed.authenticatedAt >= APP_SESSION_LIFETIME_MS) {
    clearAppSession();
    return { status: 'expired' };
  }

  return { status: 'active', session: parsed };
}

export function clearAppSession(): void {
  localStorage.removeItem(APP_SESSION_STORAGE_KEY);
}

function readStoredSession(): string | null {
  try {
    return localStorage.getItem(APP_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function isAppSession(value: unknown): value is AppSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const session = value as Record<string, unknown>;
  if (typeof session.displayName !== 'string' || typeof session.email !== 'string') {
    return false;
  }

  if (typeof session.authenticatedAt !== 'number' || !Number.isFinite(session.authenticatedAt)) {
    return false;
  }

  if (session.email.trim().length === 0) {
    return false;
  }

  return session.avatarUrl === undefined || typeof session.avatarUrl === 'string';
}
