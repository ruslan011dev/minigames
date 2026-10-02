import type { Page } from '../../types/page';
import { libraryPageCount } from './library-catalog';
import { LibraryCards } from './library-cards';
import { LibraryPagination } from './library-pagination';
import { LibraryToolbar } from './library-toolbar';

const INITIAL_PAGE_COUNT = libraryPageCount('all');

export class LibraryPage implements Page {
  private toolbar: LibraryToolbar | null = null;
  private cards: LibraryCards | null = null;
  private pagination: LibraryPagination | null = null;

  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--library';

    this.cards = new LibraryCards();
    this.toolbar = new LibraryToolbar((query) => {
      this.pagination?.setState(1, INITIAL_PAGE_COUNT);
      this.cards?.load(query);
    });
    this.pagination = new LibraryPagination(() => undefined);

    page.append(
      this.createIntro(),
      this.toolbar.render(),
      this.cards.render(),
      this.pagination.render(INITIAL_PAGE_COUNT),
    );

    return page;
  }

  public destroy(): void {
    this.cards?.destroy();
    this.toolbar?.destroy();
    this.toolbar = null;
    this.cards = null;
    this.pagination = null;
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
