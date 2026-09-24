import type { Page } from '../../types/page';
import { LibraryToolbar } from './library-toolbar';

export class LibraryPage implements Page {
  private toolbar: LibraryToolbar | null = null;

  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--library';

    this.toolbar = new LibraryToolbar();
    page.append(this.createIntro(), this.toolbar.render());

    return page;
  }

  public destroy(): void {
    this.toolbar?.destroy();
    this.toolbar = null;
  }

  private createIntro(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'library-intro';
    section.setAttribute('aria-labelledby', 'library-title');

    const title = document.createElement('h1');
    title.id = 'library-title';
    title.className = 'library-intro__title';
    title.textContent = 'Game Library';

    const text = document.createElement('p');
    text.className = 'library-intro__text';
    text.textContent = 'Browse our collection of casual mini-games';

    section.append(title, text);

    return section;
  }
}
