import { AuthDialog, type AuthMode } from '../components/auth/auth';
import { GameDetailsDialog } from '../components/game-details/game-details';
import { Footer } from '../components/footer/footer';
import { Header } from '../components/header/header';
import { snackbar } from '../components/snackbar/snackbar';
import { HomePage } from '../pages/home/home-page';
import { DEFAULT_LIBRARY_CATEGORY, DEFAULT_LIBRARY_SORT } from '../pages/library/library-query';
import { LibraryPage, type LibraryLocation } from '../pages/library/library-page';
import { homeLocation, Router, type AppLocation } from '../router/router';
import { isPageId, type Page, type PageId } from '../types/page';

export class App {
  private readonly root: HTMLElement;
  private readonly router: Router;
  private content: HTMLElement | null = null;
  private currentPage: Page | null = null;
  private library: LibraryPage | null = null;
  private libraryKey = '';
  private pageId: PageId = 'home';
  private header: Header | null = null;
  private auth: AuthDialog | null = null;
  private details: GameDetailsDialog | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.router = new Router((location) => this.apply(location));
  }

  public start(): void {
    this.root.replaceChildren(this.createLayout());
    this.router.start();
  }

  private createLayout(): HTMLElement {
    const app = document.createElement('div');
    app.className = 'app';

    this.auth = new AuthDialog(
      () => this.router.dismissDialog(),
      (mode) => this.openAuth(mode),
    );
    this.details = new GameDetailsDialog(() => this.router.dismissDialog());
    this.header = new Header((mode) => this.openAuth(mode));

    const main = document.createElement('main');
    main.className = 'content';
    main.id = 'main-content';
    main.tabIndex = -1;
    this.content = main;

    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#main-content';
    skip.textContent = 'Skip to content';

    app.append(
      skip,
      this.header.render(),
      main,
      new Footer().render(),
      this.auth.render(),
      this.details.render(),
      snackbar.render(),
    );
    app.addEventListener('click', this.onLinkClick);

    return app;
  }

  private onLinkClick = (event: MouseEvent): void => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const detailsTrigger = target.closest('[data-game-details]');

    if (detailsTrigger instanceof HTMLElement) {
      const slug = detailsTrigger.dataset.gameSlug;

      if (slug) {
        this.openGame(slug);
      }

      return;
    }

    const link = target.closest('a[data-page]');

    if (!(link instanceof HTMLAnchorElement)) {
      return;
    }

    const page = link.dataset.page;

    if (!isPageId(page)) {
      return;
    }

    event.preventDefault();
    this.openPage(page);
  };

  private openPage(pageId: PageId): void {
    this.header?.dismissMenu();
    const current = this.router.current();

    if (pageId === 'library') {
      this.router.navigate({
        page: 'library',
        category: current.page === 'library' ? current.category : DEFAULT_LIBRARY_CATEGORY,
        sort: current.page === 'library' ? current.sort : DEFAULT_LIBRARY_SORT,
        pageNumber: current.page === 'library' ? current.pageNumber : 1,
        dialog: { kind: 'none' },
      });
      return;
    }

    this.router.navigate(homeLocation());
  }

  private openAuth(mode: AuthMode): void {
    this.header?.dismissMenu();
    this.router.navigate({
      ...this.router.current(),
      dialog: { kind: 'auth', mode },
    });
  }

  private openGame(slug: string): void {
    this.router.navigate({
      ...this.router.current(),
      dialog: { kind: 'game', slug },
    });
  }

  private onLibraryNavigate = (query: LibraryLocation): void => {
    this.router.navigate({
      ...this.router.current(),
      page: 'library',
      category: query.category,
      sort: query.sort,
      pageNumber: query.page,
    });
  };

  private apply(location: AppLocation): void {
    this.syncPage(location);
    this.syncDialog(location);
  }

  private syncPage(location: AppLocation): void {
    const key = `${location.category}|${location.sort}|${location.pageNumber}`;

    if (
      this.currentPage &&
      this.pageId === location.page &&
      location.page === 'library' &&
      this.library
    ) {
      this.header?.setCurrentPage('library');

      if (this.libraryKey !== key) {
        this.libraryKey = key;
        this.library.sync({
          category: location.category,
          sort: location.sort,
          page: location.pageNumber,
        });
      }

      return;
    }

    if (this.currentPage && this.pageId === location.page && location.page === 'home') {
      this.header?.setCurrentPage('home');
      return;
    }

    this.pageId = location.page;
    this.header?.setCurrentPage(location.page);
    this.header?.dismissMenu();
    window.scrollTo(0, 0);

    if (location.page === 'home') {
      this.library = null;
      this.libraryKey = '';
      this.renderPage(new HomePage());
      return;
    }

    this.libraryKey = key;
    const library = new LibraryPage(
      {
        category: location.category,
        sort: location.sort,
        page: location.pageNumber,
      },
      this.onLibraryNavigate,
    );
    this.library = library;
    this.renderPage(library);
  }

  private syncDialog(location: AppLocation): void {
    if (location.dialog.kind === 'game') {
      this.auth?.dismiss();
      this.details?.open(location.dialog.slug);
      return;
    }

    if (location.dialog.kind === 'auth') {
      this.details?.dismiss();
      this.auth?.open(location.dialog.mode);
      return;
    }

    this.details?.dismiss();
    this.auth?.dismiss();
  }

  private renderPage(page: Page): void {
    if (!this.content) {
      return;
    }

    this.currentPage?.destroy?.();
    this.currentPage = page;
    this.content.replaceChildren(page.render());
  }
}
