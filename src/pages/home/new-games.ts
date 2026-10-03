import { ApiError, isAbortError } from '../../api/client';
import { getFeaturedGames, type GameSummary } from '../../api/games';
import { createEmptyState, createErrorBanner } from '../../components/feedback/feedback';
import { snackbar } from '../../components/snackbar/snackbar';
import { formatCompactCount, formatRating } from '../../utils/format';
import { publicAssetUrl } from '../../utils/media';
import arrowLeftUrl from '../../assets/icons/arrow-left.svg?url';
import arrowRightUrl from '../../assets/icons/arrow-right.svg?url';
import heartUrl from '../../assets/icons/heart.svg?url';
import starUrl from '../../assets/icons/star.svg?url';

type CardSize = 'peek' | 'side' | 'active' | 'far';

const SWIPE_THRESHOLD = 40;
const SKELETON_ROLES: CardSize[] = ['peek', 'side', 'active', 'side', 'peek'];

export class NewGames {
  private games: GameSummary[] = [];
  private cards: HTMLLIElement[] = [];
  private activeIndex = 0;
  private swipeStart: number | null = null;
  private suppressClick = false;
  private panel: HTMLElement | null = null;
  private previousButton: HTMLButtonElement | null = null;
  private nextButton: HTMLButtonElement | null = null;
  private controller: AbortController | null = null;
  private alive = true;
  private hadError = false;

  public render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'new-games';
    section.setAttribute('aria-labelledby', 'new-games-title');

    const panel = document.createElement('div');
    panel.className = 'new-games__panel';
    this.panel = panel;

    section.append(this.createHeader(), panel);
    section.addEventListener('keydown', this.onKeyDown);
    this.showLoading();
    void this.load();

    return section;
  }

  public destroy(): void {
    this.alive = false;
    this.controller?.abort();
  }

  private load = async (): Promise<void> => {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.showLoading();

    try {
      const games = await getFeaturedGames(controller.signal);

      if (!this.alive || controller.signal.aborted) {
        return;
      }

      this.games = games;

      if (games.length === 0) {
        this.showEmpty();
        snackbar.show('No featured games right now.', 'warning');
        return;
      }

      this.activeIndex = Math.floor(games.length / 2);
      this.showGames();

      if (this.hadError) {
        this.hadError = false;
        snackbar.show('Featured games loaded.', 'success');
      }
    } catch (error) {
      if (!this.alive || isAbortError(error)) {
        return;
      }

      this.hadError = true;
      const message = error instanceof ApiError ? error.message : 'Could not load featured games.';
      this.showError(message);
      snackbar.show(message, 'error');
    }
  };

  private showLoading(): void {
    this.games = [];
    this.cards = [];
    this.setNavEnabled(false);

    if (!this.panel) {
      return;
    }

    this.panel.setAttribute('aria-busy', 'true');
    this.panel.replaceChildren(this.createSkeleton());
  }

  private showError(message: string): void {
    this.setNavEnabled(false);

    if (!this.panel) {
      return;
    }

    this.panel.removeAttribute('aria-busy');
    this.panel.replaceChildren(
      createErrorBanner(message, () => {
        void this.load();
      }),
    );
  }

  private showEmpty(): void {
    this.setNavEnabled(false);

    if (!this.panel) {
      return;
    }

    this.panel.removeAttribute('aria-busy');
    this.panel.replaceChildren(
      createEmptyState('No featured games', 'New games will show up here when they are available.'),
    );
  }

  private showGames(): void {
    this.setNavEnabled(true);

    if (!this.panel) {
      return;
    }

    this.panel.removeAttribute('aria-busy');
    const track = this.createTrack();
    this.panel.replaceChildren(track);
    this.updateCards();
  }

  private createSkeleton(): HTMLElement {
    const list = document.createElement('ul');
    list.className = 'new-games__track';
    list.setAttribute('aria-hidden', 'true');

    SKELETON_ROLES.forEach((role) => {
      const item = document.createElement('li');
      item.className = `new-games__card new-games__card--${role} new-games__card--skeleton is-skeleton`;
      list.append(item);
    });

    const status = document.createElement('p');
    status.className = 'visually-hidden';
    status.textContent = 'Loading featured games';

    const wrap = document.createElement('div');
    wrap.append(status, list);

    return wrap;
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'new-games__header';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'new-games__title-group';

    const accent = document.createElement('span');
    accent.className = 'new-games__accent';

    const title = document.createElement('h2');
    title.id = 'new-games-title';
    title.className = 'new-games__title';
    title.textContent = 'New Games';

    titleGroup.append(accent, title);
    header.append(titleGroup, this.createNav());

    return header;
  }

  private createNav(): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'new-games__nav';
    nav.setAttribute('aria-label', 'Slider');
    const previous = this.createNavButton('Previous games', arrowLeftUrl, false);
    const next = this.createNavButton('Next games', arrowRightUrl, true);
    previous.addEventListener('click', () => this.step(-1));
    next.addEventListener('click', () => this.step(1));
    previous.disabled = true;
    next.disabled = true;
    this.previousButton = previous;
    this.nextButton = next;
    nav.append(previous, next);

    return nav;
  }

  private setNavEnabled(enabled: boolean): void {
    if (this.previousButton) {
      this.previousButton.disabled = !enabled;
    }

    if (this.nextButton) {
      this.nextButton.disabled = !enabled;
    }
  }

  private createNavButton(label: string, icon: string, next: boolean): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'new-games__nav-btn';

    if (next) {
      button.classList.add('new-games__nav-btn--next');
    }

    button.setAttribute('aria-label', label);

    const image = document.createElement('img');
    image.src = icon;
    image.alt = '';
    image.width = 24;
    image.height = 24;

    button.append(image);

    return button;
  }

  private createTrack(): HTMLElement {
    const list = document.createElement('ul');
    list.className = 'new-games__track';
    list.addEventListener('pointerdown', this.onPointerDown);
    list.addEventListener('pointerup', this.onPointerUp);
    list.addEventListener('pointercancel', this.onPointerCancel);
    list.addEventListener('click', this.onTrackClick, true);
    this.cards = [];

    this.games.forEach((game) => {
      const card = this.createCard(game);
      this.cards.push(card);
      list.append(card);
    });

    return list;
  }

  private createCard(game: GameSummary): HTMLLIElement {
    const item = document.createElement('li');
    item.className = 'new-games__card';

    const image = document.createElement('img');
    image.className = 'new-games__cover';
    image.src = publicAssetUrl(game.cardImage);
    image.alt = game.name;

    const overlay = document.createElement('div');
    overlay.className = 'new-games__overlay';

    const name = document.createElement('h3');
    name.className = 'new-games__name';
    name.textContent = game.name;

    const rating = formatRating(game.rating);
    const likes = formatCompactCount(game.likesCount);
    const meta = document.createElement('div');
    meta.className = 'new-games__meta';
    meta.append(
      this.createMeta(starUrl, rating, 'Rating'),
      this.createMeta(heartUrl, likes, 'Likes'),
    );

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'new-games__open';
    open.dataset.gameDetails = '';
    open.dataset.gameSlug = game.slug;
    open.setAttribute('aria-label', `Open details for ${game.name}`);

    overlay.append(name, meta);
    item.append(image, overlay, open);

    return item;
  }

  private createMeta(icon: string, value: string, name: string): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'new-games__stat';
    wrap.setAttribute('aria-label', `${name} ${value}`);

    const image = document.createElement('img');
    image.src = icon;
    image.alt = '';
    image.width = 16;
    image.height = 16;

    wrap.append(image, document.createTextNode(value));

    return wrap;
  }

  private step(direction: number): void {
    const count = this.games.length;

    if (count === 0) {
      return;
    }

    this.activeIndex = (this.activeIndex + direction + count) % count;
    this.updateCards();
  }

  private updateCards(): void {
    const count = this.games.length;

    if (count === 0) {
      return;
    }

    const half = Math.floor(count / 2);

    this.cards.forEach((card, index) => {
      const delta = this.wrapOffset(index);
      card.classList.remove(
        'new-games__card--peek',
        'new-games__card--side',
        'new-games__card--active',
        'new-games__card--far',
      );
      card.classList.add(`new-games__card--${this.role(delta)}`);
      card.style.order = String(delta + half);

      const open = card.querySelector('.new-games__open');
      if (open instanceof HTMLButtonElement) {
        if (delta === 0) {
          open.setAttribute('aria-current', 'true');
        } else {
          open.removeAttribute('aria-current');
        }
      }
    });
  }

  private wrapOffset(index: number): number {
    const count = this.games.length;
    const half = Math.floor(count / 2);
    let delta = index - this.activeIndex;

    if (delta > half) {
      delta -= count;
    } else if (delta < -half) {
      delta += count;
    }

    return delta;
  }

  private role(delta: number): CardSize {
    if (delta === 0) {
      return 'active';
    }

    if (Math.abs(delta) === 1) {
      return 'side';
    }

    if (Math.abs(delta) === 2) {
      return 'peek';
    }

    return 'far';
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.step(1);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.step(-1);
    }
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    this.swipeStart = event.clientX;
    this.suppressClick = false;
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.swipeStart === null) {
      return;
    }

    const delta = event.clientX - this.swipeStart;
    this.swipeStart = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD) {
      return;
    }

    this.suppressClick = true;
    this.step(delta < 0 ? 1 : -1);
  };

  private onPointerCancel = (): void => {
    this.swipeStart = null;
  };

  private onTrackClick = (event: MouseEvent): void => {
    if (!this.suppressClick) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.suppressClick = false;
  };
}
