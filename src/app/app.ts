import { AuthDialog, type AuthMode } from '../components/auth/auth';
import {
  authenticateWithEmail,
  AuthRequestError,
  type EmailAuthRequest,
  signOutPreservedUser,
} from '../firebase/email-auth';
import { signInWithGoogle } from '../firebase/google-auth';
import {
  clearAppSession,
  profileLabel,
  readAppSession,
  saveAppSession,
  type AppSession,
  type SessionProfile,
  type SessionRead,
} from '../session/app-session';
import { GameDetailsDialog } from '../components/game-details/game-details';
import { Footer } from '../components/footer/footer';
import { Header } from '../components/header/header';
import { snackbar } from '../components/snackbar/snackbar';
import { HomePage } from '../pages/home/home-page';
import { NotFoundPage } from '../pages/not-found/not-found-page';
import { DEFAULT_LIBRARY_CATEGORY, DEFAULT_LIBRARY_SORT } from '../pages/library/library-query';
import { type LibraryLocation, LibraryPage } from '../pages/library/library-page';
import { type AppLocation, homeLocation, Router } from '../router/router';
import { isPageId, type Page, type PageId } from '../types/page';

export class App {
  private readonly root: HTMLElement;
  private readonly router: Router;
  private content: HTMLElement | null = null;
  private currentPage: Page | null = null;
  private library: LibraryPage | null = null;
  private libraryKey = '';
  private pageId: PageId | 'not-found' = 'home';
  private header: Header | null = null;
  private auth: AuthDialog | null = null;
  private details: GameDetailsDialog | null = null;
  private startupSettled = false;
  private shownAt: number | null = null;

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
      (request) => this.authenticate(request),
      () => this.signInWithGoogleAccount(),
    );
    this.details = new GameDetailsDialog(
      () => this.router.dismissDialog(),
      () => this.sessionForAction('Sign in to save favorites.'),
      () => this.sessionForAction('Sign in to write a comment.'),
    );
    this.header = new Header(
      (mode) => this.openAuth(mode),
      () => {
        void this.logout();
      },
    );

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
    document.addEventListener('visibilitychange', this.onPageActive);

    return app;
  }

  private async authenticate(request: EmailAuthRequest): Promise<void> {
    const profile = await authenticateWithEmail(request);
    await this.keepSession(profile);
    snackbar.show(request.mode === 'login' ? 'Signed in.' : 'Account created.', 'success');
  }

  private async signInWithGoogleAccount(): Promise<void> {
    const profile = await signInWithGoogle();
    await this.keepSession(profile);
    snackbar.show('Signed in with Google.', 'success');
  }

  private async keepSession(profile: SessionProfile): Promise<void> {
    try {
      const session = saveAppSession(profile);
      this.showSession(session);
    } catch {
      await signOutPreservedUser().catch(() => undefined);
      throw new AuthRequestError('Could not save the session.');
    }
  }

  private async logout(): Promise<void> {
    clearAppSession();
    this.showSession(null);

    try {
      await signOutPreservedUser();
      snackbar.show('Signed out.', 'success');
    } catch {
      snackbar.show('Could not sign out of the account.', 'error');
    }
  }

  private onPageActive = (): void => {
    if (document.visibilityState !== 'visible') {
      return;
    }

    this.enforceSession();
  };

  private enforceSession(): SessionRead {
    const startup = !this.startupSettled;
    this.startupSettled = true;
    const result = readAppSession();

    if (result.status === 'active') {
      this.showSession(result.session);
      return result;
    }

    if (result.status === 'expired') {
      this.showSession(null);
      snackbar.show('Your session has expired. Sign in again.', 'warning');
    } else if (result.status === 'invalid') {
      this.showSession(null);
    }

    if (startup || result.status === 'expired' || result.status === 'invalid') {
      void signOutPreservedUser().catch(() => {
        snackbar.show('Could not sign out of the account.', 'error');
      });
    }

    return result;
  }

  private sessionForAction(guestMessage: string): AppSession | null {
    const result = this.enforceSession();

    if (result.status === 'active') {
      return result.session;
    }

    this.openAuth('login');
    snackbar.show(
      result.status === 'expired' ? 'Your session has expired. Sign in again.' : guestMessage,
      'warning',
    );
    return null;
  }

  private showSession(session: AppSession | null): void {
    if (session === null) {
      if (this.shownAt === null) {
        return;
      }

      this.shownAt = null;
      this.header?.setSession(null);
      return;
    }

    if (this.shownAt === session.authenticatedAt) {
      return;
    }

    this.shownAt = session.authenticatedAt;
    this.header?.setSession(session);
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
    this.enforceSession();
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
    this.enforceSession();
    this.header?.dismissMenu();

    if (readAppSession().status === 'active') {
      snackbar.show('You are already signed in.', 'info');
      return;
    }

    this.router.navigate({
      ...this.router.current(),
      dialog: { kind: 'auth', mode },
    });
  }

  private openGame(slug: string): void {
    this.enforceSession();
    this.router.navigate({
      ...this.router.current(),
      dialog: { kind: 'game', slug },
    });
  }

  private onLibraryNavigate = (query: LibraryLocation): void => {
    this.enforceSession();
    this.router.navigate({
      ...this.router.current(),
      page: 'library',
      category: query.category,
      sort: query.sort,
      pageNumber: query.page,
    });
  };

  private apply(location: AppLocation): AppLocation {
    this.enforceSession();
    const next = this.allowAuth(location);
    this.syncPage(next);
    this.syncDialog(next);
    return next;
  }

  private allowAuth(location: AppLocation): AppLocation {
    if (location.dialog.kind !== 'auth' || readAppSession().status !== 'active') {
      return location;
    }

    snackbar.show('You are already signed in.', 'info');
    return { ...location, dialog: { kind: 'none' } };
  }

  private syncPage(location: AppLocation): void {
    if (location.page === 'not-found') {
      this.header?.setCurrentPage(null);

      if (this.currentPage && this.pageId === 'not-found') {
        return;
      }

      this.pageId = 'not-found';
      this.library = null;
      this.libraryKey = '';
      this.header?.dismissMenu();
      window.scrollTo(0, 0);
      this.renderPage(new NotFoundPage(() => this.openPage('home')));
      return;
    }

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
      const session = readAppSession();
      const email = session.status === 'active' ? session.session.email : null;
      const name =
        session.status === 'active'
          ? profileLabel(session.session.displayName, session.session.email)
          : '';
      this.details?.open(location.dialog.slug, email, name);
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
//
