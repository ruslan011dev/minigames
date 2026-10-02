import heartUrl from '../../assets/icons/heart.svg?url';
import starUrl from '../../assets/icons/star.svg?url';
import { ApiError, isAbortError } from '../../api/client';
import {
  getLibraryGames,
  LIBRARY_PAGE_SIZE,
  type GameCard,
  type LibraryGamesQuery,
} from '../../api/games';
import { createEmptyState, createErrorBanner } from '../../components/feedback/feedback';
import { snackbar } from '../../components/snackbar/snackbar';
import categoriesFile from '../../mock-data/categories.json';
import { formatCompactCount, formatRating } from '../../utils/format';
import { publicAssetUrl } from '../../utils/media';

export class LibraryCards {
  private panel: HTMLElement | null = null;
  private controller: AbortController | null = null;
  private query: LibraryGamesQuery = { category: 'all', sort: 'rating-desc' };
  private alive = true;
  private hadError = false;

  public render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'library-cards';
    section.setAttribute('aria-labelledby', 'library-games-title');

    const title = document.createElement('h2');
    title.id = 'library-games-title';
    title.className = 'visually-hidden';
    title.textContent = 'Games';

    const panel = document.createElement('div');
    panel.className = 'library-cards__panel';
    this.panel = panel;

    section.append(title, panel);
    this.showLoading();

    return section;
  }

  public load(query: LibraryGamesQuery): void {
    this.query = query;
    void this.fetchGames();
  }

  public destroy(): void {
    this.alive = false;
    this.controller?.abort();
  }

  private fetchGames = async (): Promise<void> => {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.showLoading();

    try {
      const games = await getLibraryGames(this.query, controller.signal);

      if (!this.alive || controller.signal.aborted) {
        return;
      }

      if (games.length === 0) {
        this.showEmpty();
        snackbar.show('No games to show right now.', 'warning');
        return;
      }

      this.showGames(games);

      if (this.hadError) {
        this.hadError = false;
        snackbar.show('Games loaded.', 'success');
      }
    } catch (error) {
      if (!this.alive || isAbortError(error)) {
        return;
      }

      this.hadError = true;
      const message = error instanceof ApiError ? error.message : 'Could not load games.';
      this.showError(message);
      snackbar.show(message, 'error');
    }
  };

  private showLoading(): void {
    if (!this.panel) {
      return;
    }

    this.panel.setAttribute('aria-busy', 'true');
    this.panel.replaceChildren(this.createSkeleton());
  }

  private showError(message: string): void {
    if (!this.panel) {
      return;
    }

    this.panel.removeAttribute('aria-busy');
    this.panel.replaceChildren(
      createErrorBanner(message, () => {
        void this.fetchGames();
      }),
    );
  }

  private showEmpty(): void {
    if (!this.panel) {
      return;
    }

    this.panel.removeAttribute('aria-busy');
    this.panel.replaceChildren(
      createEmptyState(
        'No games found',
        'Games will show up here when the library has titles to browse.',
      ),
    );
  }

  private showGames(games: GameCard[]): void {
    if (!this.panel) {
      return;
    }

    this.panel.removeAttribute('aria-busy');
    const list = document.createElement('ul');
    list.className = 'library-cards__list';
    list.append(...games.map((game) => this.createCard(game)));
    this.panel.replaceChildren(list);
  }

  private createSkeleton(): HTMLElement {
    const list = document.createElement('ul');
    list.className = 'library-cards__list';
    list.setAttribute('aria-hidden', 'true');

    for (let index = 0; index < LIBRARY_PAGE_SIZE; index += 1) {
      const item = document.createElement('li');
      item.className = 'library-cards__item';

      const card = document.createElement('div');
      card.className = 'library-card library-card--skeleton is-skeleton';
      item.append(card);
      list.append(item);
    }

    const status = document.createElement('p');
    status.className = 'visually-hidden';
    status.textContent = 'Loading games';

    const wrap = document.createElement('div');
    wrap.append(status, list);

    return wrap;
  }

  private createCard(game: GameCard): HTMLLIElement {
    const item = document.createElement('li');
    item.className = 'library-cards__item';

    const card = document.createElement('article');
    card.className = 'library-card';

    const cover = document.createElement('img');
    cover.className = 'library-card__cover';
    cover.src = publicAssetUrl(game.cardImage);
    cover.alt = '';

    card.append(cover, this.createBody(game));
    item.append(card);

    return item;
  }

  private createBody(game: GameCard): HTMLElement {
    const body = document.createElement('div');
    body.className = 'library-card__body';

    const heading = document.createElement('div');
    heading.className = 'library-card__heading';

    const title = document.createElement('h3');
    title.className = 'library-card__title';
    title.textContent = game.name;

    const badge = document.createElement('span');
    badge.className = 'library-card__badge';
    badge.textContent = categoryLabel(game.category);

    heading.append(title, badge);

    const price = document.createElement('p');
    price.className = 'library-card__price';
    price.textContent = game.price;

    if (game.price === 'Free') {
      price.classList.add('library-card__price--free');
    }

    const text = document.createElement('p');
    text.className = 'library-card__text';
    text.textContent = game.shortDescription;

    body.append(heading, price, text, this.createStats(game), this.createDetails(game));

    return body;
  }

  private createStats(game: GameCard): HTMLElement {
    const stats = document.createElement('div');
    stats.className = 'library-card__stats';
    const rating = formatRating(game.rating);
    const likes = formatCompactCount(game.likesCount);
    stats.append(
      this.createStat(starUrl, rating, 'Rating'),
      this.createStat(heartUrl, likes, 'Likes'),
    );

    return stats;
  }

  private createStat(iconUrl: string, value: string, name: string): HTMLElement {
    const stat = document.createElement('span');
    stat.className = 'library-card__stat';
    stat.setAttribute('aria-label', `${name} ${value}`);

    const icon = document.createElement('img');
    icon.src = iconUrl;
    icon.alt = '';

    const label = document.createElement('span');
    label.textContent = value;

    stat.append(icon, label);

    return stat;
  }

  private createDetails(game: GameCard): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'library-card__details';
    button.dataset.gameDetails = '';
    button.dataset.gameSlug = game.slug;
    button.textContent = 'Details';
    button.setAttribute('aria-label', `Details for ${game.name}`);

    return button;
  }
}

function categoryLabel(slug: string): string {
  return categoriesFile.data.find((item) => item.slug === slug)?.label ?? slug;
}
