import burgerUrl from '../../assets/icons/burger.svg?url';
import closeUrl from '../../assets/icons/close.svg?url';
import logoUrl from '../../assets/icons/logo.png';
import type { AuthMode } from '../auth/auth';

type NavItem = {
  label: string;
  href: string;
  current?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', current: true },
  { label: 'Library', href: '/library' },
  { label: 'Tournaments', href: '/tournaments' },
  { label: 'Community', href: '/community' },
];

const TABLET_MAX_WIDTH = 768;

export class Header {
  private burger: HTMLButtonElement | null = null;
  private menu: HTMLDialogElement | null = null;

  constructor(private readonly onOpenAuth: (mode: AuthMode) => void) {}

  public render(): HTMLElement {
    const header = document.createElement('header');
    header.className = 'header';

    const inner = document.createElement('div');
    inner.className = 'header__inner';

    this.menu = this.createMenu();
    inner.append(this.createLogo(), this.createNav(), this.createActions());
    header.append(inner, this.menu);
    this.bindEvents();

    return header;
  }

  private createLogo(): HTMLAnchorElement {
    const logo = document.createElement('a');
    logo.className = 'header__logo';
    logo.href = '/';
    logo.setAttribute('aria-label', 'MiniGames home');

    const image = document.createElement('img');
    image.className = 'header__logo-icon';
    image.src = logoUrl;
    image.alt = '';
    image.width = 32;
    image.height = 32;

    const name = document.createElement('span');
    name.className = 'header__logo-text';
    name.textContent = 'MiniGames';

    logo.append(image, name);

    return logo;
  }

  private createNav(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'header__nav';
    nav.setAttribute('aria-label', 'Main');

    const list = document.createElement('ul');
    list.className = 'header__nav-list';

    NAV_ITEMS.forEach((item) => {
      list.append(this.createNavItem(item, 'header__nav-link'));
    });

    nav.append(list);

    return nav;
  }

  private createNavItem(item: NavItem, className: string): HTMLLIElement {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.className = className;
    link.href = item.href;
    link.textContent = item.label;

    if (item.current) {
      link.setAttribute('aria-current', 'page');
    }

    li.append(link);
    return li;
  }

  private createActions(): HTMLDivElement {
    const actions = document.createElement('div');
    actions.className = 'header__actions';

    const logIn = this.createAuthButton('Log In', 'header__btn header__btn--outline', 'login');
    const signUp = this.createAuthButton('Sign Up', 'header__btn header__btn--primary', 'register');

    this.burger = document.createElement('button');
    this.burger.type = 'button';
    this.burger.className = 'header__burger';
    this.burger.setAttribute('aria-label', 'Open menu');
    this.burger.setAttribute('aria-expanded', 'false');
    this.burger.setAttribute('aria-controls', 'mobile-menu');

    const burgerIcon = document.createElement('img');
    burgerIcon.src = burgerUrl;
    burgerIcon.alt = '';
    burgerIcon.width = 32;
    burgerIcon.height = 32;

    this.burger.append(burgerIcon);
    actions.append(logIn, signUp, this.burger);

    return actions;
  }

  private createAuthButton(label: string, className: string, mode: AuthMode): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.dataset.auth = mode;
    button.textContent = label;
    button.addEventListener('click', () => {
      this.closeMenu();
      this.onOpenAuth(mode);
    });

    return button;
  }

  private createMenu(): HTMLDialogElement {
    const menu = document.createElement('dialog');
    menu.className = 'menu';
    menu.id = 'mobile-menu';
    menu.setAttribute('aria-label', 'Menu');

    const top = document.createElement('div');
    top.className = 'menu__top';
    top.append(this.createLogo(), this.createCloseButton());

    const nav = document.createElement('nav');
    nav.className = 'menu__nav';
    nav.setAttribute('aria-label', 'Mobile');

    const list = document.createElement('ul');
    list.className = 'menu__list';

    NAV_ITEMS.forEach((item) => {
      list.append(this.createNavItem(item, 'menu__link'));
    });

    nav.append(list);

    const actions = document.createElement('div');
    actions.className = 'menu__actions';
    actions.append(
      this.createAuthButton('Log In', 'header__btn header__btn--outline menu__btn', 'login'),
      this.createAuthButton('Sign Up', 'header__btn header__btn--primary menu__btn', 'register'),
    );

    menu.append(top, nav, actions);

    return menu;
  }

  private createCloseButton(): HTMLButtonElement {
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'menu__close';
    close.setAttribute('aria-label', 'Close menu');

    const icon = document.createElement('img');
    icon.src = closeUrl;
    icon.alt = '';
    icon.width = 32;
    icon.height = 32;

    close.append(icon);

    return close;
  }

  private bindEvents(): void {
    this.burger?.addEventListener('click', this.toggleMenu);
    this.menu?.querySelector('.menu__close')?.addEventListener('click', this.closeMenu);
    this.menu?.addEventListener('close', this.onMenuClosed);
    window.addEventListener('resize', this.onResize);
  }

  private toggleMenu = (): void => {
    if (this.menu?.open) {
      this.closeMenu();
      return;
    }

    this.menu?.showModal();
    this.burger?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-menu-open');
  };

  private closeMenu = (): void => {
    if (this.menu?.open) {
      this.menu.close();
    }
  };

  private onMenuClosed = (): void => {
    this.burger?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-menu-open');
  };

  private onResize = (): void => {
    if (window.innerWidth > TABLET_MAX_WIDTH) {
      this.closeMenu();
    }
  };
}
