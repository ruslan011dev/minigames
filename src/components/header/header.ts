export class Header {
  public render(): HTMLElement {
    const header = document.createElement('header');
    header.className = 'header';

    const inner = document.createElement('div');
    inner.className = 'header__inner container';

    inner.append(this.createLogo(), this.createNav(), this.createActions());
    header.append(inner);

    return header;
  }

  private createLogo(): HTMLAnchorElement {
    const logo = document.createElement('a');
    logo.className = 'header__logo';
    logo.href = '/';
    logo.setAttribute('aria-label', 'MiniGames home');
    logo.textContent = 'MiniGames';

    return logo;
  }

  private createNav(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'header__nav';
    nav.setAttribute('aria-label', 'Main');

    const list = document.createElement('ul');
    list.className = 'header__nav-list';

    list.append(
      this.createNavItem('Home', '/', true),
      this.createNavItem('Library', '/library', false),
    );
    nav.append(list);

    return nav;
  }

  private createNavItem(label: string, href: string, current: boolean): HTMLLIElement {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'header__nav-link';
    link.href = href;
    link.textContent = label;

    if (current) {
      link.setAttribute('aria-current', 'page');
    }

    item.append(link);
    return item;
  }

  private createActions(): HTMLDivElement {
    const actions = document.createElement('div');
    actions.className = 'header__actions';

    const burger = document.createElement('button');
    burger.type = 'button';
    burger.className = 'header__burger';
    burger.setAttribute('aria-label', 'Open menu');
    burger.setAttribute('aria-expanded', 'false');

    for (let i = 0; i < 3; i += 1) {
      burger.append(document.createElement('span'));
    }

    const signIn = document.createElement('button');
    signIn.type = 'button';
    signIn.className = 'header__sign-in';
    signIn.dataset.action = 'open-auth';
    signIn.textContent = 'Sign in';

    actions.append(signIn, burger);

    return actions;
  }
}
