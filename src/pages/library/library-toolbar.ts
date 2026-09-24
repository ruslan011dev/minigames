import checkUrl from '../../assets/icons/check.svg?url';
import chevronUrl from '../../assets/icons/chevron-down.svg?url';
import categoriesFile from '../../mock-data/categories.json';

type Category = {
  slug: string;
  label: string;
  isDefault: boolean;
};

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

export class LibraryToolbar {
  private readonly categories: Category[] = categoriesFile.data;
  private activeCategory = this.categories.find((item) => item.isDefault)?.slug ?? 'all';
  private activeSort = DEFAULT_SORT;
  private open = false;
  private sortButton: HTMLButtonElement | null = null;
  private sortLabel: HTMLElement | null = null;
  private sortMenu: HTMLUListElement | null = null;

  public render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'library-toolbar';
    section.setAttribute('aria-label', 'Filter and sort');
    section.append(this.createFilters(), this.createSort());

    return section;
  }

  public destroy(): void {
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  private createFilters(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'library-toolbar__filters';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Categories');

    this.categories.forEach((category) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'library-chip';
      chip.textContent = category.label;
      chip.setAttribute('aria-pressed', String(category.slug === this.activeCategory));

      if (category.slug === this.activeCategory) {
        chip.classList.add('library-chip--active');
      }

      chip.addEventListener('click', () => {
        this.activeCategory = category.slug;
        group.querySelectorAll<HTMLButtonElement>('.library-chip').forEach((item) => {
          const selected = item === chip;
          item.classList.toggle('library-chip--active', selected);
          item.setAttribute('aria-pressed', String(selected));
        });
      });

      group.append(chip);
    });

    return group;
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
      this.setOpen(false);
    });

    item.append(button);

    return item;
  }

  private markSortOption(button: HTMLButtonElement, selected: boolean): void {
    button.classList.toggle('library-sort__option--selected', selected);
    button.setAttribute('aria-selected', String(selected));
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

    this.destroy();
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
