import type { Page } from '../../types/page';
import { libraryPageCount } from './library-catalog';
import { LibraryCards } from './library-cards';
import { LibraryPagination } from './library-pagination';
import { LibraryToolbar, type LibraryQuery } from './library-toolbar';

export class LibraryPage implements Page {
  private toolbar: LibraryToolbar | null = null;
  private cards: LibraryCards | null = null;
  private cardSection: HTMLElement | null = null;
  private pagination: LibraryPagination | null = null;
  private pageNumber = 1;

  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--library';

    this.toolbar = new LibraryToolbar((query) => {
      this.pageNumber = 1;
      this.showGames(query);
    });
    this.cards = new LibraryCards();
    this.pagination = new LibraryPagination((pageNumber) => {
      this.pageNumber = pageNumber;
      this.showGames(this.currentQuery());
    });

    const query = this.toolbar.getQuery();
    this.cardSection = this.cards.render(query.category, query.sort, this.pageNumber);

    page.append(
      this.createIntro(),
      this.toolbar.render(),
      this.cardSection,
      this.pagination.render(libraryPageCount(query.category)),
    );

    return page;
  }

  public destroy(): void {
    this.toolbar?.destroy();
    this.toolbar = null;
    this.cards = null;
    this.cardSection = null;
    this.pagination = null;
  }

  private showGames(query: LibraryQuery): void {
    if (!this.cards || !this.cardSection) {
      return;
    }

    const pageCount = libraryPageCount(query.category);
    if (this.pageNumber > pageCount) {
      this.pageNumber = 1;
    }

    this.pagination?.setState(this.pageNumber, pageCount);
    this.cards.update(this.cardSection, query.category, query.sort, this.pageNumber);
  }

  private currentQuery(): LibraryQuery {
    return this.toolbar?.getQuery() ?? { category: 'all', sort: null };
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
