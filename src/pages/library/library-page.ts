import type { Page } from '../../types/page';
import { LibraryCards } from './library-cards';
import { LibraryPagination } from './library-pagination';
import { LibraryToolbar } from './library-toolbar';

export class LibraryPage implements Page {
  private toolbar: LibraryToolbar | null = null;
  private cards: LibraryCards | null = null;
  private pagination: LibraryPagination | null = null;
  private pageNumber = 1;
  private totalPages = 1;

  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--library';

    this.cards = new LibraryCards((result) => {
      this.pageNumber = result.page;
      this.totalPages = result.totalPages;
      this.pagination?.setState(result.page, result.totalPages);
    });
    this.toolbar = new LibraryToolbar((query) => {
      this.pageNumber = 1;
      this.pagination?.setState(1, this.totalPages);
      this.cards?.load({ ...query, page: 1 });
    });
    this.pagination = new LibraryPagination((pageNumber) => {
      this.pageNumber = pageNumber;
      this.loadGames();
    });

    page.append(
      this.createIntro(),
      this.toolbar.render(),
      this.cards.render(),
      this.pagination.render(this.totalPages),
    );

    return page;
  }

  public destroy(): void {
    this.cards?.destroy();
    this.toolbar?.destroy();
    this.pagination?.destroy();
    this.toolbar = null;
    this.cards = null;
    this.pagination = null;
  }

  private loadGames(): void {
    const query = this.toolbar?.getQuery();

    if (!query) {
      return;
    }

    this.cards?.load({ ...query, page: this.pageNumber });
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
