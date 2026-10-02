import checkUrl from '../../assets/icons/check.svg?url';
import chevronUrl from '../../assets/icons/chevron-down.svg?url';
import { ApiError, isAbortError } from '../../api/client';
import { getCategories, type Category } from '../../api/categories';
import { createEmptyState, createErrorBanner } from '../../components/feedback/feedback';
import { snackbar } from '../../components/snackbar/snackbar';

type SortOption = {
  id: string;
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { id: 'rating-asc', label: 'Rating ↑' },
  { id: 'rating-desc', label: 'Rating ↓' },
  { id: 'name-asc', label: 'Name A→Z' },
  { id: 'name-desc', label: 'Name Z→A' },
];

const DEFAULT_SORT = 'rating-desc';
const SKELETON_CHIPS = 4;

export type LibraryQuery = {
  category: string;
  sort: string;
};

export class LibraryToolbar {
  private categories: Category[] = [];
  private activeCategory = 'all';
  private activeSort = DEFAULT_SORT;
  private open = false;
  private filters: HTMLElement | null = null;
  private sortButton: HTMLButtonElement | null = null;
  private sortLabel: HTMLElement | null = null;
  private sortMenu: HTMLUListElement | null = null;
  private controller: AbortController | null = null;
  private alive = true;
  private hadError = false;

  constructor(private readonly onChange?: (query: LibraryQuery) => void) {}

  public getQuery(): LibraryQuery {
    return {
      category: this.activeCategory,
      sort: this.activeSort,
    };
  }

  public render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'library-toolbar';
    section.setAttribute('aria-labelledby', 'library-filters-title');

    const title = document.createElement('h2');
    title.id = 'library-filters-title';
    title.className = 'visually-hidden';
    title.textContent = 'Filter and sort';

    section.append(title, this.createFilters(), this.createSort());
    void this.loadCategories();

    return section;
  }

  public destroy(): void {
    this.alive = false;
    this.controller?.abort();
    this.unbindMenu();
  }

  private createFilters(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'library-toolbar__filters';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Categories');
    this.filters = group;
    this.showCategoryLoading();

    return group;
  }

  private loadCategories = async (): Promise<void> => {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.showCategoryLoading();

    try {
      const categories = await getCategories(controller.signal);

      if (!this.alive || controller.signal.aborted) {
        return;
      }

      this.categories = categories;

      if (categories.length === 0) {
        this.showCategoryEmpty();
        snackbar.show('No categories right now.', 'warning');
        return;
      }

      this.activeCategory = categories.find((item) => item.isDefault)?.slug ?? 'all';
      this.renderChips();
      this.emit();

      if (this.hadError) {
        this.hadError = false;
        snackbar.show('Categories loaded.', 'success');
      }
    } catch (error) {
      if (!this.alive || isAbortError(error)) {
        return;
      }

      this.hadError = true;
      const message = error instanceof ApiError ? error.message : 'Could not load categories.';
      this.showCategoryError(message);
      snackbar.show(message, 'error');
    }
  };

  private showCategoryLoading(): void {
    if (!this.filters) {
      return;
    }

    this.filters.setAttribute('aria-busy', 'true');
    const status = document.createElement('p');
    status.className = 'visually-hidden';
    status.textContent = 'Loading categories';

    const chips = document.createDocumentFragment();

    for (let index = 0; index < SKELETON_CHIPS; index += 1) {
      const chip = document.createElement('span');
      chip.className = 'library-chip library-chip--skeleton is-skeleton';
      chip.setAttribute('aria-hidden', 'true');
      chips.append(chip);
    }

    this.filters.replaceChildren(status, chips);
  }

  private showCategoryError(message: string): void {
    if (!this.filters) {
      return;
    }

    this.filters.removeAttribute('aria-busy');
    this.filters.replaceChildren(
      createErrorBanner(message, () => {
        void this.loadCategories();
      }),
    );
  }

  private showCategoryEmpty(): void {
    if (!this.filters) {
      return;
    }

    this.filters.removeAttribute('aria-busy');
    this.filters.replaceChildren(
      createEmptyState('No categories', 'Filters will show up here when categories are available.'),
    );
  }

  private renderChips(): void {
    if (!this.filters) {
      return;
    }

    this.filters.removeAttribute('aria-busy');
    this.filters.replaceChildren();

    this.categories.forEach((category) => {
      this.filters?.append(this.createChip(category));
    });
  }

  private createChip(category: Category): HTMLButtonElement {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'library-chip';
    chip.textContent = category.label;
    chip.dataset.category = category.slug;
    this.markChip(chip, category.slug === this.activeCategory);
    chip.addEventListener('click', () => {
      this.activeCategory = category.slug;
      this.filters?.querySelectorAll<HTMLButtonElement>('.library-chip').forEach((item) => {
        this.markChip(item, item.dataset.category === category.slug);
      });
      this.emit();
    });

    return chip;
  }

  private markChip(chip: HTMLButtonElement, selected: boolean): void {
    chip.classList.toggle('library-chip--active', selected);
    chip.setAttribute('aria-pressed', String(selected));
  }

  private createSort(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'library-sort';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'library-sort__button';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'library-sort-menu');

    const label = document.createElement('span');
    label.textContent = this.sortText();

    const icon = document.createElement('img');
    icon.className = 'library-sort__icon';
    icon.src = chevronUrl;
    icon.alt = '';

    button.append(label, icon);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      this.setOpen(!this.open);
    });

    const menu = document.createElement('ul');
    menu.className = 'library-sort__menu';
    menu.id = 'library-sort-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', 'Sort by');
    menu.hidden = true;

    SORT_OPTIONS.forEach((option) => {
      menu.append(this.createSortOption(option));
    });

    this.sortButton = button;
    this.sortLabel = label;
    this.sortMenu = menu;
    wrap.append(button, menu);

    return wrap;
  }

  private createSortOption(option: SortOption): HTMLLIElement {
    const item = document.createElement('li');
    item.className = 'library-sort__item';
    item.setAttribute('role', 'none');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'library-sort__option';
    button.setAttribute('role', 'option');
    button.dataset.sort = option.id;

    const check = document.createElement('img');
    check.className = 'library-sort__check';
    check.src = checkUrl;
    check.alt = '';

    const label = document.createElement('span');
    label.textContent = option.label;

    button.append(check, label);
    this.markSortOption(button, option.id === this.activeSort);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      this.activeSort = option.id;
      this.sortMenu
        ?.querySelectorAll<HTMLButtonElement>('.library-sort__option')
        .forEach((entry) => {
          this.markSortOption(entry, entry.dataset.sort === option.id);
        });
      if (this.sortLabel) {
        this.sortLabel.textContent = this.sortText();
      }
      this.emit();
      this.setOpen(false);
    });

    item.append(button);

    return item;
  }

  private markSortOption(button: HTMLButtonElement, selected: boolean): void {
    button.classList.toggle('library-sort__option--selected', selected);
    button.setAttribute('aria-selected', String(selected));
  }

  private emit(): void {
    this.onChange?.(this.getQuery());
  }

  private sortText(): string {
    const option = SORT_OPTIONS.find((item) => item.id === this.activeSort);
    return `Sort by: ${option?.label ?? 'Rating ↓'}`;
  }

  private setOpen(open: boolean): void {
    this.open = open;
    this.sortButton?.setAttribute('aria-expanded', String(open));

    if (this.sortMenu) {
      this.sortMenu.hidden = !open;
    }

    if (open) {
      document.addEventListener('click', this.onDocumentClick);
      document.addEventListener('keydown', this.onKeyDown);
      return;
    }

    this.unbindMenu();
  }

  private unbindMenu(): void {
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  private onDocumentClick = (): void => {
    this.setOpen(false);
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.setOpen(false);
      this.sortButton?.focus();
    }
  };
}
