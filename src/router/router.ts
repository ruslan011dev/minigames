import type { AuthMode } from '../components/auth/auth';
import {
  DEFAULT_LIBRARY_CATEGORY,
  DEFAULT_LIBRARY_SORT,
  isLibrarySort,
} from '../pages/library/library-query';
import type { PageId } from '../types/page';

export type RouteDialog =
  { kind: 'none' } | { kind: 'game'; slug: string } | { kind: 'auth'; mode: AuthMode };

export type AppLocation = {
  page: PageId;
  category: string;
  sort: string;
  pageNumber: number;
  dialog: RouteDialog;
};

export function homeLocation(): AppLocation {
  return {
    page: 'home',
    category: DEFAULT_LIBRARY_CATEGORY,
    sort: DEFAULT_LIBRARY_SORT,
    pageNumber: 1,
    dialog: { kind: 'none' },
  };
}

export class Router {
  private location: AppLocation = homeLocation();

  constructor(private readonly onChange: (location: AppLocation) => void) {}

  public start(): void {
    window.addEventListener('popstate', this.onPop);
    const next = readLocation() ?? homeLocation();
    this.location = next;
    this.remember(next);
    this.onChange(next);
  }

  public current(): AppLocation {
    return this.location;
  }

  public navigate(next: AppLocation): void {
    if (sameLocation(this.location, next)) {
      return;
    }

    this.location = next;
    window.history.pushState(null, '', href(next));
    this.onChange(next);
  }

  public dismissDialog(): void {
    if (this.location.dialog.kind === 'none') {
      return;
    }

    window.setTimeout(() => {
      window.history.back();
    }, 0);
  }

  private remember(location: AppLocation): void {
    const current = href(location);

    if (location.dialog.kind === 'none') {
      window.history.replaceState(null, '', current);
      return;
    }

    const under = href({ ...location, dialog: { kind: 'none' } });
    window.history.replaceState(null, '', under);
    window.history.pushState(null, '', current);
  }

  private onPop = (): void => {
    const next = readLocation();

    if (!next) {
      return;
    }

    this.location = next;
    this.onChange(next);
  };
}

function readLocation(): AppLocation | null {
  const page = readPage(window.location.pathname);

  if (!page) {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const sort = params.get('sort') ?? DEFAULT_LIBRARY_SORT;

  return {
    page,
    category: params.get('category') || DEFAULT_LIBRARY_CATEGORY,
    sort: isLibrarySort(sort) ? sort : DEFAULT_LIBRARY_SORT,
    pageNumber: readPageNumber(params.get('page')),
    dialog: readDialog(params),
  };
}

function readPage(pathname: string): PageId | null {
  const path = stripBase(pathname).replace(/\/+$/, '') || '/';

  if (path === '/' || path === '/home' || path === '/index.html') {
    return 'home';
  }

  if (path === '/library') {
    return 'library';
  }

  return null;
}

function readPageNumber(value: string | null): number {
  if (!value) {
    return 1;
  }

  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function readDialog(params: URLSearchParams): RouteDialog {
  const slug = params.get('game');

  if (slug) {
    return { kind: 'game', slug };
  }

  const auth = params.get('auth');

  if (auth === 'login' || auth === 'register') {
    return { kind: 'auth', mode: auth };
  }

  return { kind: 'none' };
}

function href(location: AppLocation): string {
  const path = location.page === 'library' ? '/library' : '/';
  const params = new URLSearchParams();

  if (location.page === 'library') {
    params.set('category', location.category);
    params.set('sort', location.sort);
    params.set('page', String(location.pageNumber));
  }

  if (location.dialog.kind === 'game') {
    params.set('game', location.dialog.slug);
  }

  if (location.dialog.kind === 'auth') {
    params.set('auth', location.dialog.mode);
  }

  const query = params.toString();
  const prefixed = `${basePrefix()}${path}`;

  return query ? `${prefixed}?${query}` : prefixed;
}

function sameLocation(left: AppLocation, right: AppLocation): boolean {
  return (
    left.page === right.page &&
    left.category === right.category &&
    left.sort === right.sort &&
    left.pageNumber === right.pageNumber &&
    sameDialog(left.dialog, right.dialog)
  );
}

function sameDialog(left: RouteDialog, right: RouteDialog): boolean {
  if (left.kind !== right.kind) {
    return false;
  }

  if (left.kind === 'game' && right.kind === 'game') {
    return left.slug === right.slug;
  }

  if (left.kind === 'auth' && right.kind === 'auth') {
    return left.mode === right.mode;
  }

  return true;
}

function basePrefix(): string {
  const base = import.meta.env.BASE_URL;

  if (base === './' || base === '.' || base === '/') {
    return '';
  }

  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function stripBase(pathname: string): string {
  const prefix = basePrefix();

  if (!prefix || !pathname.startsWith(prefix)) {
    return pathname;
  }

  const rest = pathname.slice(prefix.length);
  return rest === '' ? '/' : rest;
}
