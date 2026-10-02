import type { Page } from '../../types/page';
import { LibraryCards } from './library-cards';
import { LibraryPagination } from './library-pagination';
import type { LibraryQuery } from './library-toolbar';
import { LibraryToolbar } from './library-toolbar';

export type LibraryLocation = LibraryQuery & {
  page: number;
};

export class LibraryPage implements Page {
  private toolbar: LibraryToolbar | null = null;
  private cards: LibraryCards | null = null;
  private pagination: LibraryPagination | null = null;
  private totalPages = 1;
  private loaded: LibraryLocation;

  constructor(
    private readonly initial: LibraryLocation,
    private readonly onNavigate: (query: LibraryLocation) => void,
  ) {
    this.loaded = initial;
  }

  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--library';

    this.cards = new LibraryCards((result) => {
      this.totalPages = result.totalPages;
      this.pagination?.setState(result.page, result.totalPages);
    });
    this.toolbar = new LibraryToolbar(this.initial, (query) => {
      this.onNavigate({ ...query, page: 1 });
    });
    this.pagination = new LibraryPagination((pageNumber) => {
      const query = this.toolbar?.getQuery();

      if (!query) {
        return;
      }

      this.onNavigate({ ...query, page: pageNumber });
    });

    page.append(
      this.createIntro(),
      this.toolbar.render(),
      this.cards.render(),
      this.pagination.render(this.totalPages),
    );
    this.pagination.setState(this.initial.page, this.totalPages);
    this.cards.load({
      category: this.initial.category,
      sort: this.initial.sort,
      page: this.initial.page,
    });

    return page;
  }

  public sync(query: LibraryLocation): void {
    const same =
      this.loaded.category === query.category &&
      this.loaded.sort === query.sort &&
      this.loaded.page === query.page;

    this.loaded = query;
    this.toolbar?.setQuery(query);
    this.pagination?.setState(query.page, this.totalPages);

    if (same) {
      return;
    }

    this.cards?.load({
      category: query.category,
      sort: query.sort,
      page: query.page,
    });
  }

  public destroy(): void {
    this.cards?.destroy();
    this.toolbar?.destroy();
    this.pagination?.destroy();
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
