import burgerUrl from '../../assets/icons/burger.svg?url';
import closeUrl from '../../assets/icons/close.svg?url';
import logoUrl from '../../assets/icons/logo.png';
import personUrl from '../../assets/icons/person.svg?url';
import type { AppSession } from '../../session/app-session';
import { profileInitials, profileLabel } from '../../session/app-session';
import type { PageId } from '../../types/page';
import type { AuthMode } from '../auth/auth';

type NavItem = {
  label: string;
  target: PageId;
  navId?: PageId;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', target: 'home', navId: 'home' },
  { label: 'Library', target: 'library', navId: 'library' },
  { label: 'Tournaments', target: 'home' },
  { label: 'Community', target: 'home' },
];

const TABLET_MAX_WIDTH = 768;

interface ProfileAvatar {
  root: HTMLSpanElement;
  image: HTMLImageElement;
  initials: HTMLElement;
  icon: HTMLImageElement;
}

export class Header {
  private root: HTMLElement | null = null;
  private burger: HTMLButtonElement | null = null;
  private menu: HTMLDialogElement | null = null;
  private headerUser: HTMLElement | null = null;
  private headerName: HTMLElement | null = null;
  private headerAvatar: ProfileAvatar | null = null;
  private menuUser: HTMLElement | null = null;
  private menuName: HTMLElement | null = null;
  private menuAvatar: ProfileAvatar | null = null;

  constructor(
    private readonly onOpenAuth: (mode: AuthMode) => void,
    private readonly onLogout?: () => void,
  ) {}

  public render(): HTMLElement {
    const header = document.createElement('header');
    header.className = 'header';

    const inner = document.createElement('div');
    inner.className = 'header__inner';

    this.menu = this.createMenu();
    inner.append(this.createLogo(), this.createNav(), this.createActions());
    header.append(inner, this.menu);
    this.root = header;
    this.setCurrentPage('home');
    this.bindEvents();

    return header;
  }

  public setCurrentPage(page: PageId | null): void {
    this.root?.querySelectorAll<HTMLAnchorElement>('[data-nav]').forEach((link) => {
      if (link.dataset.nav === page) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  public dismissMenu(): void {
    this.closeMenu();
  }

  public setSession(session: AppSession | null): void {
    const signedIn = session !== null;
    const label = session ? profileLabel(session.displayName, session.email) : '';

    this.root?.querySelectorAll<HTMLElement>('[data-guest]').forEach((control) => {
      control.hidden = signedIn;
    });

    if (this.headerUser) {
      this.headerUser.hidden = !signedIn;
    }

    if (this.menuUser) {
      this.menuUser.hidden = !signedIn;
    }

    if (this.headerName) {
      this.headerName.textContent = label;
    }

    if (this.menuName) {
      this.menuName.textContent = label;
    }

    const avatarUrl = session?.avatarUrl;
    if (this.headerAvatar) {
      this.paintAvatar(this.headerAvatar, label, avatarUrl);
    }
    if (this.menuAvatar) {
      this.paintAvatar(this.menuAvatar, label, avatarUrl);
    }
  }

  private createLogo(): HTMLAnchorElement {
    const logo = document.createElement('a');
    logo.className = 'header__logo';
    logo.href = '/';
    logo.dataset.page = 'home';
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
    link.href = item.target === 'library' ? '/library' : '/';
    link.dataset.page = item.target;
    link.textContent = item.label;

    if (item.navId) {
      link.dataset.nav = item.navId;
    }

    li.append(link);
    return li;
  }

  private createActions(): HTMLDivElement {
    const actions = document.createElement('div');
    actions.className = 'header__actions';

    const logIn = this.createAuthButton('Log In', 'header__btn header__btn--outline', 'login');
    const signUp = this.createAuthButton('Sign Up', 'header__btn header__btn--primary', 'register');
    const user = this.createUserBlock('header');
    this.headerUser = user.root;
    this.headerName = user.name;
    this.headerAvatar = user.avatar;

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
    actions.append(logIn, signUp, user.root, this.burger);

    return actions;
  }

  private createAuthButton(label: string, className: string, mode: AuthMode): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.dataset.auth = mode;
    button.dataset.guest = 'true';
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
    const user = this.createUserBlock('menu');
    this.menuUser = user.root;
    this.menuName = user.name;
    this.menuAvatar = user.avatar;
    actions.append(
      this.createAuthButton('Log In', 'header__btn header__btn--outline menu__btn', 'login'),
      this.createAuthButton('Sign Up', 'header__btn header__btn--primary menu__btn', 'register'),
      user.root,
    );

    menu.append(top, nav, actions);

    return menu;
  }

  private createUserBlock(place: 'header' | 'menu'): {
    root: HTMLDivElement;
    name: HTMLElement;
    avatar: ProfileAvatar;
  } {
    const root = document.createElement('div');
    root.className = place === 'header' ? 'header__user' : 'menu__user';
    root.hidden = true;

    const identity = document.createElement('div');
    identity.className = 'header__identity';

    const avatar = this.createAvatar();
    const name = document.createElement(place === 'header' ? 'span' : 'p');
    name.className = place === 'header' ? 'header__name' : 'menu__name';
    identity.append(avatar.root, name);

    const logout = document.createElement('button');
    logout.type = 'button';
    logout.className =
      place === 'header'
        ? 'header__btn header__logout'
        : 'header__btn header__btn--outline menu__btn';
    logout.textContent = 'Log out';
    logout.addEventListener('click', () => {
      this.closeMenu();
      this.onLogout?.();
    });

    root.append(identity, logout);

    return { root, name, avatar };
  }

  private createAvatar(): ProfileAvatar {
    const root = document.createElement('span');
    root.className = 'header__avatar';
    root.setAttribute('aria-hidden', 'true');

    const image = document.createElement('img');
    image.className = 'header__avatar-image';
    image.alt = '';
    image.hidden = true;

    const initials = document.createElement('span');
    initials.className = 'header__avatar-initials';
    initials.hidden = true;

    const icon = document.createElement('img');
    icon.className = 'header__avatar-icon';
    icon.src = personUrl;
    icon.alt = '';
    icon.hidden = true;

    image.addEventListener('load', () => {
      if (!image.dataset.expected) {
        return;
      }

      image.hidden = false;
      initials.hidden = true;
      icon.hidden = true;
    });
    image.addEventListener('error', () => {
      if (!image.dataset.expected) {
        return;
      }

      image.hidden = true;
      this.showAvatarMark(initials, icon);
    });

    root.append(image, initials, icon);

    return { root, image, initials, icon };
  }

  private paintAvatar(avatar: ProfileAvatar, label: string, avatarUrl: string | undefined): void {
    const initials = profileInitials(label);
    avatar.initials.textContent = initials;
    avatar.image.dataset.expected = avatarUrl ?? '';
    avatar.image.hidden = true;
    this.showAvatarMark(avatar.initials, avatar.icon);

    if (!avatarUrl) {
      avatar.image.removeAttribute('src');
      return;
    }

    avatar.image.src = avatarUrl;
  }

  private showAvatarMark(initials: HTMLElement, icon: HTMLImageElement): void {
    const hasInitials = (initials.textContent ?? '').length > 0;
    initials.hidden = !hasInitials;
    icon.hidden = hasInitials;
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
    if (!this.menu?.open) {
      return;
    }

    this.onMenuClosed();
    this.menu.close();
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
