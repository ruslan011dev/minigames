import chevronBackwardUrl from '../../assets/icons/chevron_backward.svg?url';
import chevronForwardUrl from '../../assets/icons/chevron_forward.svg?url';

const MOBILE_PAGE_LIMIT = 3;

export class LibraryPagination {
  private page = 1;
  private pageCount = 1;
  private list: HTMLUListElement | null = null;

  constructor(private readonly onChange: (page: number) => void) {}

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

  public setState(page: number, pageCount: number): void {
    this.page = page;
    this.pageCount = pageCount;
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
    return Array.from({ length: this.pageCount }, (_, index) => {
      const page = index + 1;
      const item = document.createElement('li');
      item.className = 'library-pagination__item';

      if (page > MOBILE_PAGE_LIMIT) {
        item.classList.add('library-pagination__item--compact-hidden');
      }

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

    const blocked = direction === 'previous' ? this.page === 1 : this.page === this.pageCount;
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
}
