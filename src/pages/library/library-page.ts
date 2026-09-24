import type { Page } from '../../types/page';
import { LibraryCards } from './library-cards';
import { LibraryToolbar, type LibraryQuery } from './library-toolbar';

export class LibraryPage implements Page {
  private toolbar: LibraryToolbar | null = null;
  private cards: LibraryCards | null = null;
  private cardSection: HTMLElement | null = null;

  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--library';

    this.toolbar = new LibraryToolbar((query) => this.showGames(query));
    this.cards = new LibraryCards();
    this.cardSection = this.cards.render(
      this.toolbar.getQuery().category,
      this.toolbar.getQuery().sort,
    );

    page.append(this.createIntro(), this.toolbar.render(), this.cardSection);

    return page;
  }

  public destroy(): void {
    this.toolbar?.destroy();
    this.toolbar = null;
    this.cards = null;
    this.cardSection = null;
  }

  private showGames(query: LibraryQuery): void {
    if (!this.cards || !this.cardSection) {
      return;
    }

    this.cards.update(this.cardSection, query.category, query.sort);
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
