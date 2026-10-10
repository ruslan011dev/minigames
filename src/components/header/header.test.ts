/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppSession } from '../../session/app-session';
import { Header } from './header';

function session(overrides: Partial<AppSession> = {}): AppSession {
  return {
    displayName: 'Ada Lovelace',
    email: 'ada@example.com',
    authenticatedAt: 1_000,
    ...overrides,
  };
}

function mount(onLogout?: () => void): {
  header: Header;
  onOpenAuth: ReturnType<typeof vi.fn>;
  root: HTMLElement;
} {
  const onOpenAuth = vi.fn();
  const header = new Header(onOpenAuth, onLogout);
  const root = header.render();
  document.body.append(root);
  return { header, onOpenAuth, root };
}

function guestButton(label: string): HTMLButtonElement | null {
  return (
    [...document.querySelectorAll<HTMLButtonElement>('[data-guest]')].find(
      (button) => button.textContent === label,
    ) ?? null
  );
}

function avatarImages(): HTMLImageElement[] {
  return [...document.querySelectorAll<HTMLImageElement>('.header__avatar-image')];
}

describe('header', () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.body.classList.remove('is-menu-open');
  });

  it('marks the current page and opens auth for a guest', () => {
    const { header, onOpenAuth } = mount();

    expect(document.querySelector('[data-nav="home"]')?.getAttribute('aria-current')).toBe('page');
    expect(document.querySelector('[data-nav="library"]')?.hasAttribute('aria-current')).toBe(
      false,
    );
    expect(document.querySelector<HTMLElement>('.header__user')?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('.menu__user')?.hidden).toBe(true);

    header.setCurrentPage('library');
    expect(document.querySelector('[data-nav="library"]')?.getAttribute('aria-current')).toBe(
      'page',
    );
    expect(document.querySelector('[data-nav="home"]')?.hasAttribute('aria-current')).toBe(false);
    expect(document.querySelector('.menu__link[data-nav="library"]')?.getAttribute('href')).toBe(
      '/library',
    );

    header.setCurrentPage(null);
    expect(document.querySelector('[aria-current="page"]')).toBeNull();

    guestButton('Log In')?.click();
    guestButton('Sign Up')?.click();
    expect(onOpenAuth).toHaveBeenNthCalledWith(1, 'login');
    expect(onOpenAuth).toHaveBeenNthCalledWith(2, 'register');
  });

  it('shows the profile name as text and initials in the header and menu', () => {
    const { header } = mount();
    header.setSession(session({ displayName: '<b>Ada Lovelace</b>' }));

    const names = [...document.querySelectorAll('.header__name, .menu__name')];
    expect(names.map((name) => name.textContent)).toEqual([
      '<b>Ada Lovelace</b>',
      '<b>Ada Lovelace</b>',
    ]);
    expect(names[0]?.querySelector('b')).toBeNull();
    expect(document.querySelector<HTMLElement>('.header__user')?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('.menu__user')?.hidden).toBe(false);
    expect(guestButton('Log In')?.hidden).toBe(true);
    expect(guestButton('Sign Up')?.hidden).toBe(true);

    const initials = [...document.querySelectorAll<HTMLElement>('.header__avatar-initials')];
    expect(initials.map((item) => item.textContent)).toEqual(['BL', 'BL']);
    expect(initials.every((item) => item.hidden === false)).toBe(true);
    expect(
      [...document.querySelectorAll<HTMLImageElement>('.header__avatar-icon')].every(
        (icon) => icon.hidden,
      ),
    ).toBe(true);

    header.setSession(session({ displayName: '   ', email: 'forest@example.com' }));
    expect(document.querySelector('.header__name')?.textContent).toBe('forest');
    expect(document.querySelector('.header__avatar-initials')?.textContent).toBe('F');

    header.setSession(session({ displayName: '---', email: 'ada@example.com' }));
    expect(document.querySelector('.header__name')?.textContent).toBe('---');
    expect(document.querySelector<HTMLElement>('.header__avatar-initials')?.hidden).toBe(true);
    expect(document.querySelector<HTMLImageElement>('.header__avatar-icon')?.hidden).toBe(false);

    header.setSession(session({ displayName: '   ', email: ' @example.com' }));
    expect(document.querySelector('.header__name')?.textContent).toBe('Player');

    header.setSession(null);
    expect(document.querySelector<HTMLElement>('.header__user')?.hidden).toBe(true);
    expect(guestButton('Log In')?.hidden).toBe(false);
  });

  it('shows a profile photo after it loads and falls back when it fails', () => {
    const { header } = mount();
    header.setSession(session({ avatarUrl: 'https://cdn.example/ada.png' }));

    const image = avatarImages()[0];
    expect(image?.hidden).toBe(true);
    expect(image?.getAttribute('src')).toBe('https://cdn.example/ada.png');
    image?.dispatchEvent(new Event('load'));
    expect(image?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('.header__avatar-initials')?.hidden).toBe(true);

    image?.dispatchEvent(new Event('error'));
    expect(image?.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('.header__avatar-initials')?.hidden).toBe(false);

    header.setSession(session());
    expect(image?.hasAttribute('src')).toBe(false);
    image?.dispatchEvent(new Event('load'));
    image?.dispatchEvent(new Event('error'));
    expect(image?.hidden).toBe(true);
  });

  it('opens and closes the mobile menu from the burger, close button, auth, and logout', () => {
    const onLogout = vi.fn();
    const { header, onOpenAuth } = mount(onLogout);
    const burger = document.querySelector<HTMLButtonElement>('.header__burger');

    burger?.click();
    expect(document.querySelector('dialog')?.open).toBe(true);
    expect(burger?.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.classList.contains('is-menu-open')).toBe(true);

    burger?.click();
    expect(document.querySelector('dialog')?.open).toBe(false);
    expect(burger?.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.classList.contains('is-menu-open')).toBe(false);

    burger?.click();
    document.querySelector<HTMLButtonElement>('.menu__close')?.click();
    expect(document.querySelector('dialog')?.open).toBe(false);

    burger?.click();
    document.querySelector<HTMLButtonElement>('.menu__actions [data-auth="login"]')?.click();
    expect(onOpenAuth).toHaveBeenCalledWith('login');
    expect(document.querySelector('dialog')?.open).toBe(false);

    burger?.click();
    document.querySelector<HTMLButtonElement>('.menu__user button')?.click();
    expect(onLogout).toHaveBeenCalledOnce();
    expect(document.querySelector('dialog')?.open).toBe(false);

    header.dismissMenu();
    expect(document.querySelector('dialog')?.open).toBe(false);
  });

  it('closes the menu when the window becomes wider than a tablet', () => {
    mount();
    document.querySelector<HTMLButtonElement>('.header__burger')?.click();
    expect(document.querySelector('dialog')?.open).toBe(true);

    window.innerWidth = 768;
    window.dispatchEvent(new Event('resize'));
    expect(document.querySelector('dialog')?.open).toBe(true);

    window.innerWidth = 769;
    window.dispatchEvent(new Event('resize'));
    expect(document.querySelector('dialog')?.open).toBe(false);
  });

  it('logs out from the header without a handler and still closes the menu', () => {
    const { header } = mount();
    header.setSession(session());
    document.querySelector<HTMLButtonElement>('.header__burger')?.click();
    document.querySelector<HTMLButtonElement>('.header__logout')?.click();
    expect(document.querySelector('dialog')?.open).toBe(false);
  });
});
