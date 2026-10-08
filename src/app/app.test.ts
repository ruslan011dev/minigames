/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGameComments } from '../api/comments';
import { getFeaturedGames, getGame } from '../api/games';
import { getLeaderboard } from '../api/leaderboard';
import { authenticateWithEmail, signOutPreservedUser } from '../firebase/email-auth';
import { signInWithGoogle } from '../firebase/google-auth';
import { saveAppSession, type AppSession } from '../session/app-session';
import { snackbar } from '../components/snackbar/snackbar';
import { App } from './app';

vi.mock('../firebase/email-auth', () => {
  class AuthRequestError extends Error {
    readonly canceled: boolean;

    constructor(message: string, canceled = false) {
      super(message);
      this.name = 'AuthRequestError';
      this.canceled = canceled;
    }
  }

  return {
    AuthRequestError,
    authenticateWithEmail: vi.fn(),
    signOutPreservedUser: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../firebase/google-auth', () => ({
  signInWithGoogle: vi.fn(),
}));

vi.mock('../api/games', () => ({
  LIBRARY_PAGE_SIZE: 6,
  getFeaturedGames: vi.fn().mockResolvedValue([]),
  getLibraryGames: vi.fn().mockResolvedValue({ games: [], page: 1, totalPages: 1 }),
  getGame: vi.fn(),
  toggleGameFavorite: vi.fn(),
}));

vi.mock('../api/comments', () => ({
  COMMENT_TEXT_MAX: 500,
  getGameComments: vi.fn().mockResolvedValue({ comments: [], totalComments: 0 }),
  postGameComment: vi.fn(),
  toggleCommentLike: vi.fn(),
}));

vi.mock('../api/categories', () => ({
  getCategories: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/leaderboard', () => ({
  getLeaderboard: vi.fn().mockResolvedValue([]),
}));

const cleaners: Array<() => void> = [];

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

function session(authenticatedAt = Date.now()): AppSession {
  return {
    displayName: 'Ada',
    email: 'ada@example.com',
    authenticatedAt,
  };
}

function game() {
  return {
    slug: 'cat-mail-co',
    name: 'Cat Mail Co.',
    heroImage: '/heroes/cat.png',
    rating: 4.5,
    likesCount: 12,
    isLikedByCurrentUser: false,
    fullDescription: 'A cozy route.',
    specs: { genre: 'Cozy', players: '1', duration: '10 min', price: 'Free' },
    topRecords: [],
  };
}

function track(target: Document | Window, type: string): void {
  const original = target.addEventListener.bind(target);
  vi.spyOn(target, 'addEventListener').mockImplementation((event, listener, options) => {
    original(event, listener, options);
    if (event === type && typeof listener === 'function') {
      cleaners.push(() => target.removeEventListener(event, listener, options));
    }
  });
}

function start(path = '/'): App {
  window.history.replaceState(null, '', path);
  const root = document.createElement('div');
  document.body.append(root);
  const app = new App(root);
  app.start();
  return app;
}

async function gameOpen(): Promise<void> {
  const trigger = document.createElement('button');
  trigger.dataset.gameDetails = '';
  trigger.dataset.gameSlug = 'cat-mail-co';
  document.querySelector('.app')?.append(trigger);
  trigger.click();
  await vi.waitFor(() => {
    expect(document.querySelector('.details__title')?.textContent).toBe('Cat Mail Co.');
  });
}

describe('app', () => {
  beforeEach(() => {
    installStorage();
    track(document, 'visibilitychange');
    track(window, 'popstate');
    vi.mocked(getGame).mockResolvedValue(game());
    vi.mocked(getFeaturedGames).mockResolvedValue([
      { slug: 'game-1', name: 'Game 1', rating: 4, likesCount: 2, cardImage: '/cards/cat.png' },
    ]);
    vi.mocked(getLeaderboard).mockResolvedValue([
      {
        rank: 1,
        playerName: 'Ada',
        gamesPlayed: 1,
        totalScore: 10,
        streakDays: 1,
        favoriteGameSlug: 'game-1',
        favoriteGameName: 'Game 1',
      },
    ]);
    vi.mocked(getGameComments).mockResolvedValue({
      comments: [
        {
          commentId: 'comment-1',
          authorName: 'Rina',
          text: 'Cozy round.',
          likesCount: 1,
          isLikedByCurrentUser: false,
          createdAt: '2026-06-14T12:00:00.000Z',
        },
      ],
      totalComments: 1,
    });
    vi.mocked(signOutPreservedUser).mockResolvedValue(undefined);
    vi.spyOn(snackbar, 'show').mockImplementation(() => undefined);
    window.scrollTo = () => undefined;
  });

  afterEach(() => {
    for (const remove of cleaners) {
      remove();
    }
    cleaners.length = 0;
    document.body.replaceChildren();
    document.body.className = '';
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('opens the home page and moves between home and the library', async () => {
    start();
    expect(document.querySelector('.skip-link')?.textContent).toBe('Skip to content');
    expect(document.querySelector('[data-nav="home"]')?.getAttribute('aria-current')).toBe('page');

    document.querySelector<HTMLAnchorElement>('.header__nav [data-page="library"]')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('#library-title')?.textContent).toBe('Game Library');
    });
    expect(window.location.pathname).toBe('/library');

    document.querySelector<HTMLAnchorElement>('.header__nav [data-page="home"]')?.click();
    expect(window.location.pathname).toBe('/');
    expect(document.querySelector('.page--home')).not.toBeNull();
  });

  it('shows the missing page and returns home from it', async () => {
    start('/missing');
    expect(document.querySelector('#not-found-title')?.textContent).toBe('Page not found');
    document.querySelector<HTMLButtonElement>('.not-found__home')?.click();
    expect(window.location.pathname).toBe('/');
    expect(document.querySelector('.page--home')).not.toBeNull();
  });

  it('signs in, keeps an active session out of Auth, and signs out', async () => {
    vi.mocked(authenticateWithEmail).mockResolvedValue({
      displayName: 'Ada',
      email: 'ada@example.com',
      avatarUrl: null,
    });
    start();
    document.querySelector<HTMLButtonElement>('[data-auth="login"]')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector<HTMLDialogElement>('dialog.auth')?.open).toBe(true);
    });

    const email = document.querySelector<HTMLInputElement>('#auth-login-email');
    const password = document.querySelector<HTMLInputElement>('#auth-login-password');
    if (email && password) {
      email.value = 'ada@example.com';
      email.dispatchEvent(new Event('input'));
      password.value = 'secret';
      password.dispatchEvent(new Event('input'));
    }
    document.querySelector<HTMLButtonElement>('#auth-panel-login .auth__submit')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('.header__name')?.textContent).toBe('Ada');
    });
    expect(snackbar.show).toHaveBeenCalledWith('Signed in.', 'success');

    document.querySelector<HTMLButtonElement>('[data-auth="login"]')?.click();
    expect(snackbar.show).toHaveBeenCalledWith('You are already signed in.', 'info');
    expect(document.querySelector<HTMLDialogElement>('dialog.auth')?.open).toBe(false);

    document.querySelector<HTMLButtonElement>('.header__logout')?.click();
    await vi.waitFor(() => {
      expect(snackbar.show).toHaveBeenCalledWith('Signed out.', 'success');
    });
    expect(document.querySelector('.header__user')?.hasAttribute('hidden')).toBe(true);
  });

  it('creates an account and signs in with Google', async () => {
    vi.mocked(authenticateWithEmail).mockResolvedValue({
      displayName: 'Ada1',
      email: 'ada@example.com',
      avatarUrl: null,
    });
    start();
    document.querySelector<HTMLButtonElement>('[data-auth="register"]')?.click();
    await vi.waitFor(() =>
      expect(document.querySelector('#auth-panel-register:not([hidden])')).not.toBeNull(),
    );
    const type = (id: string, value: string): void => {
      const input = document.querySelector<HTMLInputElement>(`#${id}`);
      if (!input) {
        return;
      }
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    type('auth-register-username', 'Ada1');
    type('auth-register-email', 'ada@example.com');
    type('auth-register-password', 'Abcde1!');
    type('auth-register-confirm', 'Abcde1!');
    document.querySelector<HTMLButtonElement>('#auth-panel-register .auth__submit')?.click();
    await vi.waitFor(() => {
      expect(snackbar.show).toHaveBeenCalledWith('Account created.', 'success');
    });

    vi.mocked(signInWithGoogle).mockResolvedValue({
      displayName: 'Ada',
      email: 'ada@example.com',
      avatarUrl: null,
    });
    document.querySelector<HTMLButtonElement>('.header__logout')?.click();
    await vi.waitFor(() => {
      expect(snackbar.show).toHaveBeenCalledWith('Signed out.', 'success');
    });
    document.querySelector<HTMLButtonElement>('[data-auth="login"]')?.click();
    document.querySelector<HTMLButtonElement>('.auth__google')?.click();
    await vi.waitFor(() => {
      expect(snackbar.show).toHaveBeenCalledWith('Signed in with Google.', 'success');
    });
  });

  it('expires a stored session and removes an auth URL from a signed-in visit', async () => {
    saveAppSession({ displayName: 'Ada', email: 'ada@example.com' }, Date.now() - 6 * 60 * 1000);
    start();
    await vi.waitFor(() => {
      expect(snackbar.show).toHaveBeenCalledWith(
        'Your session has expired. Sign in again.',
        'warning',
      );
    });
    expect(signOutPreservedUser).toHaveBeenCalled();

    document.body.replaceChildren();
    saveAppSession(session());
    start('/?auth=login');
    await vi.waitFor(() => {
      expect(snackbar.show).toHaveBeenCalledWith('You are already signed in.', 'info');
    });
    expect(window.location.search).not.toContain('auth=');
    expect(document.querySelector<HTMLDialogElement>('dialog.auth')?.open).toBe(false);
    expect(document.querySelector('.header__name')?.textContent).toBe('Ada');
  });

  it('asks a guest to sign in before a favorite, comment, or like', async () => {
    start();
    await gameOpen();
    document.querySelector<HTMLButtonElement>('.details__favorite')?.click();
    await vi.waitFor(() => {
      expect(snackbar.show).toHaveBeenCalledWith('Sign in to save favorites.', 'warning');
    });
    expect(document.querySelector<HTMLDialogElement>('dialog.auth')?.open).toBe(true);

    window.history.back();
    await gameOpen();
    const field = document.querySelector('textarea');
    if (field) {
      field.disabled = false;
      field.value = 'Hello';
    }
    document
      .querySelector('.details__composer')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(snackbar.show).toHaveBeenCalledWith('Sign in to write a comment.', 'warning');
    });

    window.history.back();
    await gameOpen();
    document.querySelector<HTMLButtonElement>('.details__like')?.click();
    expect(snackbar.show).toHaveBeenCalledWith('Sign in to like a comment.', 'warning');
  });

  it('reports a session that cannot be saved and a sign-out that fails', async () => {
    vi.mocked(authenticateWithEmail).mockResolvedValue({
      displayName: 'Ada',
      email: 'ada@example.com',
      avatarUrl: null,
    });
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('full');
      },
      removeItem: () => undefined,
    });
    start();
    document.querySelector<HTMLButtonElement>('[data-auth="login"]')?.click();
    await vi.waitFor(() =>
      expect(document.querySelector<HTMLDialogElement>('dialog.auth')?.open).toBe(true),
    );
    const email = document.querySelector<HTMLInputElement>('#auth-login-email');
    const password = document.querySelector<HTMLInputElement>('#auth-login-password');
    if (email && password) {
      email.value = 'ada@example.com';
      email.dispatchEvent(new Event('input'));
      password.value = 'secret';
      password.dispatchEvent(new Event('input'));
    }
    document.querySelector<HTMLButtonElement>('#auth-panel-login .auth__submit')?.click();
    await vi.waitFor(() => {
      expect(snackbar.show).toHaveBeenCalledWith('Could not save the session.', 'error');
    });

    installStorage();
    saveAppSession(session());
    document.body.replaceChildren();
    vi.mocked(signOutPreservedUser).mockRejectedValue(new Error('offline'));
    start();
    document.querySelector<HTMLButtonElement>('.header__logout')?.click();
    await vi.waitFor(() => {
      expect(snackbar.show).toHaveBeenCalledWith('Could not sign out of the account.', 'error');
    });
  });

  it('checks the session when the page becomes visible and ignores a hidden page', async () => {
    const calls = vi.mocked(signOutPreservedUser).mock.calls.length;
    start();
    await Promise.resolve();
    const afterStart = vi.mocked(signOutPreservedUser).mock.calls.length;
    expect(afterStart).toBeGreaterThan(calls);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(vi.mocked(signOutPreservedUser).mock.calls.length).toBe(afterStart);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(vi.mocked(signOutPreservedUser).mock.calls.length).toBe(afterStart);
  });

  it('ignores a details trigger without a slug and a link that is not a page', () => {
    start();
    const trigger = document.createElement('button');
    trigger.dataset.gameDetails = '';
    document.querySelector('.app')?.append(trigger);
    trigger.click();
    expect(getGame).not.toHaveBeenCalled();

    const link = document.createElement('a');
    link.href = '/nope';
    link.dataset.page = 'nope';
    document.querySelector('.app')?.append(link);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
