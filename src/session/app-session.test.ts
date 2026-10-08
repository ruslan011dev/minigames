import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  APP_SESSION_LIFETIME_MS,
  APP_SESSION_STORAGE_KEY,
  clearAppSession,
  commentAuthorName,
  profileInitials,
  profileLabel,
  readAppSession,
  saveAppSession,
} from './app-session';

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

describe('profile labels and initials', () => {
  it('uses the trimmed name, then the email local part, then Player', () => {
    expect(profileLabel('  Ada  ', 'ada@example.com')).toBe('Ada');
    expect(profileLabel('   ', 'ada@example.com')).toBe('ada');
    expect(profileLabel(' ', ' @example.com')).toBe('Player');
  });

  it('keeps a comment author only when the chosen name is 2-30 characters', () => {
    expect(commentAuthorName('Ada', 'forest@example.com')).toBe('Ada');
    expect(commentAuthorName('A', 'forest@example.com')).toBe('forest');
    expect(commentAuthorName('A', `x${'@example.com'}`)).toBe('Player');
    expect(commentAuthorName('A'.repeat(31), 'forest@example.com')).toBe('forest');
  });

  it('builds initials from the first alphanumeric characters of up to two words', () => {
    expect(profileInitials('Ada Lovelace King')).toBe('AL');
    expect(profileInitials('  иван   петров ')).toBe('ИП');
    expect(profileInitials('?Ada')).toBe('A');
    expect(profileInitials('--- ---')).toBe('');
  });
});

describe('app session storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores an active session and omits a missing avatar', () => {
    const store = installStorage();
    const saved = saveAppSession(
      { displayName: 'Ada', email: 'ada@example.com', avatarUrl: null },
      1_000,
    );

    expect(saved).toEqual({ displayName: 'Ada', email: 'ada@example.com', authenticatedAt: 1_000 });
    expect(JSON.parse(store.get(APP_SESSION_STORAGE_KEY) ?? '')).toEqual(saved);
    expect(readAppSession(1_000)).toEqual({ status: 'active', session: saved });
  });

  it('keeps a present avatar url', () => {
    installStorage();
    const saved = saveAppSession(
      { displayName: 'Ada', email: 'ada@example.com', avatarUrl: 'https://cdn.example/a.png' },
      1_000,
    );

    expect(readAppSession(1_000)).toEqual({ status: 'active', session: saved });
  });

  it('returns anonymous when nothing is stored or storage cannot be read', () => {
    installStorage();
    expect(readAppSession()).toEqual({ status: 'anonymous' });

    vi.stubGlobal('localStorage', {
      getItem(): string | null {
        throw new Error('blocked');
      },
      setItem(): void {
        return undefined;
      },
      removeItem(): void {
        return undefined;
      },
    });
    expect(readAppSession()).toEqual({ status: 'anonymous' });
  });

  it('clears an expired session once its lifetime has elapsed', () => {
    const store = installStorage();
    saveAppSession({ displayName: 'Ada', email: 'ada@example.com' }, 1_000);

    expect(readAppSession(1_000 + APP_SESSION_LIFETIME_MS - 1).status).toBe('active');
    expect(readAppSession(1_000 + APP_SESSION_LIFETIME_MS)).toEqual({ status: 'expired' });
    expect(store.has(APP_SESSION_STORAGE_KEY)).toBe(false);
  });

  it('clears invalid json and a session that fails the shape check', () => {
    const store = installStorage();
    store.set(APP_SESSION_STORAGE_KEY, '{');
    expect(readAppSession()).toEqual({ status: 'invalid' });
    expect(store.has(APP_SESSION_STORAGE_KEY)).toBe(false);

    store.set(APP_SESSION_STORAGE_KEY, 'null');
    expect(readAppSession()).toEqual({ status: 'invalid' });

    store.set(APP_SESSION_STORAGE_KEY, 'true');
    expect(readAppSession()).toEqual({ status: 'invalid' });

    store.set(
      APP_SESSION_STORAGE_KEY,
      JSON.stringify({ displayName: 1, email: 'ada@example.com', authenticatedAt: 1 }),
    );
    expect(readAppSession()).toEqual({ status: 'invalid' });

    store.set(
      APP_SESSION_STORAGE_KEY,
      JSON.stringify({ displayName: 'Ada', email: '   ', authenticatedAt: 1 }),
    );
    expect(readAppSession()).toEqual({ status: 'invalid' });

    store.set(
      APP_SESSION_STORAGE_KEY,
      JSON.stringify({ displayName: 'Ada', email: 'ada@example.com', authenticatedAt: Number.NaN }),
    );
    expect(readAppSession()).toEqual({ status: 'invalid' });

    store.set(
      APP_SESSION_STORAGE_KEY,
      JSON.stringify({
        displayName: 'Ada',
        email: 'ada@example.com',
        authenticatedAt: 1,
        avatarUrl: 4,
      }),
    );
    expect(readAppSession()).toEqual({ status: 'invalid' });
  });

  it('removes only the app session key', () => {
    const store = installStorage();
    store.set(APP_SESSION_STORAGE_KEY, '{}');
    store.set('other', 'kept');

    clearAppSession();

    expect(store.has(APP_SESSION_STORAGE_KEY)).toBe(false);
    expect(store.get('other')).toBe('kept');
  });
});
