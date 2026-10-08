/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { homeLocation, Router, type AppLocation } from './router';

const popstateCleaners: Array<() => void> = [];

function visit(path: string): void {
  window.history.replaceState(null, '', path);
}

function listen(): Router {
  const router = new Router((location) => location);
  router.start();
  return router;
}

describe('router', () => {
  beforeEach(() => {
    visit('/');
    const original = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      original(type, listener, options);
      if (type === 'popstate') {
        popstateCleaners.push(() => {
          window.removeEventListener(type, listener, options);
        });
      }
    });
  });

  afterEach(() => {
    for (const remove of popstateCleaners) {
      remove();
    }
    popstateCleaners.length = 0;
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('starts on the home defaults', () => {
    expect(homeLocation()).toEqual({
      page: 'home',
      category: 'all',
      sort: 'rating-desc',
      pageNumber: 1,
      dialog: { kind: 'none' },
    });
    expect(listen().current()).toEqual(homeLocation());
    expect(window.location.pathname).toBe('/');
  });

  it('reads home, library, and not-found paths', () => {
    visit('/home/');
    expect(listen().current().page).toBe('home');

    visit('/index.html');
    expect(listen().current().page).toBe('home');

    visit('/library///');
    expect(listen().current().page).toBe('library');

    visit('/missing?kept=1#gone');
    const router = listen();
    expect(router.current()).toMatchObject({
      page: 'not-found',
      category: 'all',
      sort: 'rating-desc',
      pageNumber: 1,
      dialog: { kind: 'none' },
    });
    expect(`${window.location.pathname}${window.location.search}`).toBe('/missing?kept=1');
    expect(window.location.hash).toBe('');
  });

  it('reads library filters, page numbers, and the open dialog', () => {
    visit('/library?category=&sort=nope&page=0&auth=login&game=cat%20mail');
    expect(listen().current()).toMatchObject({
      page: 'library',
      category: 'all',
      sort: 'rating-desc',
      pageNumber: 1,
      dialog: { kind: 'game', slug: 'cat mail' },
    });

    visit('/library?category=cozy&sort=name-asc&page=3&auth=register');
    expect(listen().current()).toMatchObject({
      page: 'library',
      category: 'cozy',
      sort: 'name-asc',
      pageNumber: 3,
      dialog: { kind: 'auth', mode: 'register' },
    });

    visit('/?page=1.5&auth=nope');
    expect(listen().current()).toMatchObject({ pageNumber: 1, dialog: { kind: 'none' } });

    visit('/?page=2');
    expect(listen().current().pageNumber).toBe(2);
  });

  it('pushes a new library URL and ignores a repeated location', () => {
    const onChange = vi.fn((location: AppLocation) => location);
    const router = new Router(onChange);
    router.start();
    const length = window.history.length;

    const next: AppLocation = {
      ...homeLocation(),
      page: 'library',
      category: 'cozy',
      sort: 'name-desc',
      pageNumber: 4,
      dialog: { kind: 'game', slug: 'a/b' },
    };
    router.navigate(next);

    expect(router.current()).toEqual(next);
    expect(window.location.pathname).toBe('/library');
    expect(window.location.search).toBe('?category=cozy&sort=name-desc&page=4&game=a%2Fb');
    expect(window.history.length).toBe(length + 1);
    expect(onChange).toHaveBeenCalledTimes(2);

    router.navigate({ ...next });
    expect(window.history.length).toBe(length + 1);
    expect(onChange).toHaveBeenCalledTimes(2);

    router.navigate({ ...homeLocation(), dialog: { kind: 'auth', mode: 'login' } });
    router.navigate({ ...homeLocation(), dialog: { kind: 'auth', mode: 'register' } });
    expect(window.location.search).toBe('?auth=register');
    const registered = window.history.length;
    router.navigate({ ...homeLocation(), dialog: { kind: 'auth', mode: 'register' } });
    expect(window.history.length).toBe(registered);

    router.navigate(homeLocation());
    expect(window.location.search).toBe('');
    const homeLength = window.history.length;
    router.navigate(homeLocation());
    expect(window.history.length).toBe(homeLength);

    router.navigate({ ...homeLocation(), dialog: { kind: 'game', slug: 'one' } });
    router.navigate({ ...homeLocation(), dialog: { kind: 'game', slug: 'two' } });
    expect(window.location.search).toBe('?game=two');
  });

  it('keeps the passed location when navigate does not apply the callback result', () => {
    const router = new Router(() => homeLocation());
    router.start();
    const next: AppLocation = {
      ...homeLocation(),
      dialog: { kind: 'auth', mode: 'login' },
    };

    router.navigate(next);

    expect(router.current()).toEqual(next);
    expect(window.location.search).toBe('?auth=login');
  });

  it('remembers a dialog above the page URL when the app starts', () => {
    visit('/library?category=cozy&sort=rating-asc&page=2&game=cat-mail-co');
    const length = window.history.length;
    listen();

    expect(window.location.search).toContain('game=cat-mail-co');
    expect(window.history.length).toBe(length + 1);

    window.history.back();
    expect(window.location.pathname).toBe('/library');
    expect(window.location.search).toBe('?category=cozy&sort=rating-asc&page=2');
  });

  it('drops only the auth parameter when a signed-in session revises the route', () => {
    visit('/library?category=cozy&sort=name-asc&page=2&auth=login#saved');
    const length = window.history.length;
    const router = new Router((location) => ({ ...location, dialog: { kind: 'none' } }));
    router.start();

    expect(router.current().dialog).toEqual({ kind: 'none' });
    expect(window.location.pathname).toBe('/library');
    expect(window.location.search).toBe('?category=cozy&sort=name-asc&page=2');
    expect(window.location.hash).toBe('#saved');
    expect(window.history.length).toBe(length);
  });

  it('applies the revised location on the first visit', () => {
    const router = new Router(() => ({
      ...homeLocation(),
      page: 'library',
      category: 'cozy',
      sort: 'name-asc',
      pageNumber: 3,
    }));
    router.start();

    expect(router.current().page).toBe('library');
    expect(window.location.pathname).toBe('/library');
    expect(window.location.search).toBe('?category=cozy&sort=name-asc&page=3');
  });

  it('follows history when the user goes back or lands on an unknown path', () => {
    const router = listen();
    router.navigate({
      ...homeLocation(),
      page: 'library',
      category: 'cozy',
      sort: 'rating-desc',
      pageNumber: 1,
    });

    window.history.back();
    expect(router.current()).toEqual(homeLocation());
    expect(window.location.pathname).toBe('/');

    visit('/missing?kept=1');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(router.current().page).toBe('not-found');
    expect(`${window.location.pathname}${window.location.search}`).toBe('/missing?kept=1');
  });

  it('goes back to the page when a dialog is dismissed and does nothing without one', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const router = listen();

    vi.useFakeTimers();
    router.dismissDialog();
    vi.runAllTimers();
    expect(back).not.toHaveBeenCalled();

    router.navigate({ ...homeLocation(), dialog: { kind: 'game', slug: 'cat-mail-co' } });
    router.dismissDialog();
    expect(back).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(back).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('prefixes routes when the app is served from a subdirectory', async () => {
    vi.resetModules();
    vi.stubEnv('BASE_URL', '/minigames/');
    const { Router: Based } = await import('./router');
    visit('/minigames/library');
    const router = new Based((location) => location);
    router.start();

    expect(router.current().page).toBe('library');
    router.navigate({
      ...homeLocation(),
      page: 'library',
      category: 'cozy',
      sort: 'rating-desc',
      pageNumber: 1,
    });
    expect(window.location.pathname).toBe('/minigames/library');

    visit('/minigames');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(router.current().page).toBe('home');

    visit('/elsewhere');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(router.current().page).toBe('not-found');
  });

  it('adds a leading slash when the base has neither slash', async () => {
    vi.resetModules();
    vi.stubEnv('BASE_URL', 'minigames');
    const { Router: Based } = await import('./router');
    visit('/minigames/home');
    const router = new Based((location) => location);
    router.start();

    expect(router.current().page).toBe('home');
    expect(window.location.pathname).toBe('/minigames/');
  });
});
