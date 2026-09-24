import type { Page } from '../../types/page';

export class LibraryPage implements Page {
  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--library';

    const section = document.createElement('section');
    section.className = 'library';
    section.setAttribute('aria-labelledby', 'library-title');

    const title = document.createElement('h1');
    title.id = 'library-title';
    title.className = 'library__title';
    title.textContent = 'Library';

    section.append(title);
    page.append(section);

    return page;
  }
}
