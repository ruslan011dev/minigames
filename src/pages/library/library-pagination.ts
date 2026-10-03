import chevronBackwardUrl from '../../assets/icons/chevron_backward.svg?url';
import chevronForwardUrl from '../../assets/icons/chevron_forward.svg?url';

const MOBILE_MAX_WIDTH = 375;
const MOBILE_PAGE_LIMIT = 3;
const WIDE_PAGE_LIMIT = 4;

export class LibraryPagination {
  private page = 1;
  private pageCount = 1;
  private list: HTMLUListElement | null = null;
  private readonly mobileQuery = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);

  constructor(private readonly onChange: (page: number) => void) {
    this.mobileQuery.addEventListener('change', this.onViewportChange);
  }

  public render(pageCount: number): HTMLElement {
    this.pageCount = pageCount;

    const nav = document.createElement('nav');
    nav.className = 'library-pagination';
    nav.setAttribute('aria-label', 'Pagination');

    const list = document.createElement('ul');
    list.className = 'library-pagination__list';
    this.list = list;
    this.fillList();
    nav.append(list);

    return nav;
  }

  public destroy(): void {
    this.mobileQuery.removeEventListener('change', this.onViewportChange);
  }

  public setState(page: number, pageCount: number): void {
    this.page = page;
    this.pageCount = Math.max(pageCount, 1);
    this.fillList();
  }

  private fillList(): void {
    if (!this.list) {
      return;
    }

    this.list.replaceChildren(
      this.createStep('previous'),
      ...this.createPages(),
      this.createStep('next'),
    );
  }

  private createPages(): HTMLLIElement[] {
    return visiblePages(this.page, this.pageCount, this.pageLimit()).map((page) => {
      const item = document.createElement('li');
      item.className = 'library-pagination__item';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'library-pagination__button';
      button.textContent = String(page);

      if (page === this.page) {
        button.classList.add('library-pagination__button--current');
        button.setAttribute('aria-current', 'page');
      }

      button.addEventListener('click', () => this.select(page));
      item.append(button);

      return item;
    });
  }

  private createStep(direction: 'previous' | 'next'): HTMLLIElement {
    const item = document.createElement('li');
    item.className = 'library-pagination__item';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'library-pagination__button';
    button.setAttribute('aria-label', direction === 'previous' ? 'Previous page' : 'Next page');

    const icon = document.createElement('img');
    icon.src = direction === 'previous' ? chevronBackwardUrl : chevronForwardUrl;
    icon.alt = '';
    button.append(icon);

    const blocked = direction === 'previous' ? this.page <= 1 : this.page >= this.pageCount;
    button.disabled = blocked;
    button.addEventListener('click', () => {
      this.select(direction === 'previous' ? this.page - 1 : this.page + 1);
    });

    item.append(button);

    return item;
  }

  private select(page: number): void {
    if (page < 1 || page > this.pageCount || page === this.page) {
      return;
    }

    this.page = page;
    this.fillList();
    this.onChange(page);
  }

  private pageLimit(): number {
    return this.mobileQuery.matches ? MOBILE_PAGE_LIMIT : WIDE_PAGE_LIMIT;
  }

  private onViewportChange = (): void => {
    this.fillList();
  };
}

export function visiblePages(current: number, total: number, limit: number): number[] {
  const pageCount = Math.max(total, 1);
  const size = Math.max(limit, 1);

  if (pageCount <= size) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const half = Math.floor((size - 1) / 2);
  let start = current - half;

  if (start < 1) {
    start = 1;
  }

  if (start + size - 1 > pageCount) {
    start = pageCount - size + 1;
  }

  return Array.from({ length: size }, (_, index) => start + index);
}
