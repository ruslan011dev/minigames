import githubUrl from '../../assets/icons/github-icon.svg?url';
import logoUrl from '../../assets/icons/logo.png';
import messageUrl from '../../assets/icons/massage.svg?url';
import rsLogoUrl from '../../assets/icons/rs-logo-container.svg?url';
import shareUrl from '../../assets/icons/share.svg?url';
import wifiUrl from '../../assets/icons/wifi.svg?url';
import type { PageId } from '../../types/page';

type LinkItem = {
  label: string;
  page: PageId;
};

const EXPLORE_LINKS: LinkItem[] = [
  { label: 'Home', page: 'home' },
  { label: 'Library', page: 'library' },
  { label: 'Categories', page: 'home' },
  { label: 'Tournaments', page: 'home' },
];

const COMPANY_LINKS: LinkItem[] = [
  { label: 'About Us', page: 'home' },
  { label: 'Contact', page: 'home' },
  { label: 'Privacy Policy', page: 'home' },
  { label: 'Terms of Service', page: 'home' },
];

const SOCIAL_LINKS: { label: string; icon: string; page?: PageId; href?: string }[] = [
  { label: 'Share', icon: shareUrl, page: 'home' },
  { label: 'Chat', icon: messageUrl, href: 'mailto:developers@minigames.com' },
  { label: 'RSS', icon: wifiUrl, page: 'home' },
];

export class Footer {
  public render(): HTMLElement {
    const footer = document.createElement('footer');
    footer.className = 'footer';

    const top = document.createElement('div');
    top.className = 'footer__top';
    top.append(this.createBrand(), this.createColumns());

    footer.append(top, this.createBottom());

    return footer;
  }

  private createBrand(): HTMLElement {
    const brand = document.createElement('div');
    brand.className = 'footer__brand';

    const logo = document.createElement('a');
    logo.className = 'footer__logo';
    logo.href = '/';
    logo.dataset.page = 'home';
    logo.setAttribute('aria-label', 'MiniGames home');

    const image = document.createElement('img');
    image.className = 'footer__logo-icon';
    image.src = logoUrl;
    image.alt = '';
    image.width = 32;
    image.height = 32;

    const name = document.createElement('span');
    name.className = 'footer__logo-text';
    name.textContent = 'MiniGames';

    logo.append(image, name);

    const text = document.createElement('p');
    text.className = 'footer__tagline';
    text.textContent =
      'Take a short break and have fun. Hundreds of curated casual mini-games right in your web browser. No download required.';

    brand.append(logo, text);

    return brand;
  }

  private createColumns(): HTMLElement {
    const columns = document.createElement('div');
    columns.className = 'footer__columns';
    columns.append(
      this.createLinkColumn('Explore', EXPLORE_LINKS),
      this.createLinkColumn('Company', COMPANY_LINKS),
      this.createCommunity(),
    );

    return columns;
  }

  private createLinkColumn(title: string, items: LinkItem[]): HTMLElement {
    const column = document.createElement('nav');
    column.className = 'footer__column';

    const heading = document.createElement('h2');
    heading.id = `footer-${title.toLowerCase()}`;
    heading.className = 'footer__heading';
    heading.textContent = title;
    column.setAttribute('aria-labelledby', heading.id);

    const list = document.createElement('ul');
    list.className = 'footer__list';

    items.forEach((item) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'footer__link';
      link.href = item.page === 'library' ? '/library' : '/';
      link.dataset.page = item.page;
      link.textContent = item.label;
      li.append(link);
      list.append(li);
    });

    column.append(heading, list);

    return column;
  }

  private createCommunity(): HTMLElement {
    const column = document.createElement('nav');
    column.className = 'footer__column footer__column--social';

    const heading = document.createElement('h2');
    heading.id = 'footer-community';
    heading.className = 'footer__heading';
    heading.textContent = 'Community';
    column.setAttribute('aria-labelledby', heading.id);

    const list = document.createElement('ul');
    list.className = 'footer__social';

    SOCIAL_LINKS.forEach((item) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'footer__social-link';
      link.href = item.href ?? '/';
      if (item.page) {
        link.dataset.page = item.page;
      }
      link.setAttribute('aria-label', item.label);

      const icon = document.createElement('img');
      icon.src = item.icon;
      icon.alt = '';

      link.append(icon);
      li.append(link);
      list.append(li);
    });

    column.append(heading, list);

    return column;
  }

  private createBottom(): HTMLElement {
    const bottom = document.createElement('div');
    bottom.className = 'footer__bottom';

    const copy = document.createElement('p');
    copy.className = 'footer__copy';
    copy.textContent = '© 2026 MiniGames. All rights reserved.';

    const rs = document.createElement('a');
    rs.className = 'footer__credit';
    rs.href = 'https://rs.school';
    rs.target = '_blank';
    rs.rel = 'noreferrer noopener';

    const rsIcon = document.createElement('img');
    rsIcon.src = rsLogoUrl;
    rsIcon.alt = '';

    const rsLabel = document.createElement('span');
    rsLabel.textContent = 'RS School';

    rs.append(rsIcon, rsLabel);

    const github = document.createElement('a');
    github.className = 'footer__credit';
    github.href = 'https://github.com/rolling-scopes-school';
    github.target = '_blank';
    github.rel = 'noreferrer noopener';

    const githubIcon = document.createElement('img');
    githubIcon.src = githubUrl;
    githubIcon.alt = '';

    const githubLabel = document.createElement('span');
    githubLabel.textContent = '@student-nickname';

    github.append(githubIcon, githubLabel);

    const love = document.createElement('p');
    love.className = 'footer__love';
    love.textContent = 'Designed with love';

    bottom.append(copy, rs, github, love);

    return bottom;
  }
}
