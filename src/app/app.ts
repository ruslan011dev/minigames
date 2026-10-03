import { AuthDialog } from '../components/auth/auth';
import { GameDetailsDialog } from '../components/game-details/game-details';
import { Footer } from '../components/footer/footer';
import { Header } from '../components/header/header';
import { HomePage } from '../pages/home/home-page';
import { LibraryPage } from '../pages/library/library-page';
import { isPageId, type Page, type PageId } from '../types/page';

export class App {
  private readonly root: HTMLElement;
  private content: HTMLElement | null = null;
  private currentPage: Page | null = null;
  private pageId: PageId = 'home';
  private header: Header | null = null;
  private auth: AuthDialog | null = null;
  private details: GameDetailsDialog | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  public start(): void {
    this.root.replaceChildren(this.createLayout());
    this.renderPage(new HomePage());
  }

  private createLayout(): HTMLElement {
    const app = document.createElement('div');
    app.className = 'app';

    this.auth = new AuthDialog();
    this.details = new GameDetailsDialog();
    this.header = new Header((mode) => this.auth?.open(mode));

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
    );
    app.addEventListener('click', this.onLinkClick);

    return app;
  }

  private onLinkClick = (event: MouseEvent): void => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest('[data-game-details]')) {
      this.details?.open();
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

    if (this.pageId === pageId) {
      return;
    }

    this.pageId = pageId;
    this.header?.setCurrentPage(pageId);
    window.scrollTo(0, 0);
    this.renderPage(pageId === 'home' ? new HomePage() : new LibraryPage());
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
