import type { Page } from '../../types/page';

export class NotFoundPage implements Page {
  constructor(private readonly onHome: () => void) {}

  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--not-found';

    const section = document.createElement('section');
    section.className = 'not-found';
    section.setAttribute('aria-labelledby', 'not-found-title');

    const title = document.createElement('h1');
    title.id = 'not-found-title';
    title.className = 'not-found__title';
    title.textContent = 'Page not found';

    const text = document.createElement('p');
    text.className = 'not-found__text';
    text.textContent = 'The requested URL does not exist.';

    const home = document.createElement('button');
    home.type = 'button';
    home.className = 'not-found__home';
    home.textContent = 'Return to Home Page';
    home.addEventListener('click', () => this.onHome());

    section.append(title, text, home);
    page.append(section);

    return page;
  }
}
