import islandersUrl from '../../assets/images/islanders-new-shores-card.jpg';
import shelvePotionsUrl from '../../assets/images/shelve-the-potions-card.jpg';
import tailsideUrl from '../../assets/images/tailside-cozy-cafe-sim-card.jpg';
import vacationCafeUrl from '../../assets/images/vacation-cafe-simulator-card.jpg';
import winterBurrowUrl from '../../assets/images/winter-burrow-card.jpg';
import arrowLeftUrl from '../../assets/icons/arrow-left.svg?url';
import arrowRightUrl from '../../assets/icons/arrow-right.svg?url';
import heartUrl from '../../assets/icons/heart.svg?url';
import starUrl from '../../assets/icons/star.svg?url';

type CardSize = 'peek' | 'side' | 'active';

type GameCard = {
  title: string;
  rating: string;
  likes: string;
  image: string;
};

const GAMES: GameCard[] = [
  {
    title: 'Tailside: Cozy Cafe Sim',
    rating: '4.7',
    likes: '21.4K',
    image: tailsideUrl,
  },
  {
    title: 'Islanders: New Shores',
    rating: '4.9',
    likes: '54.2K',
    image: islandersUrl,
  },
  {
    title: 'Vacation Cafe Simulator',
    rating: '4.8',
    likes: '28.7K',
    image: vacationCafeUrl,
  },
  {
    title: 'Winter Burrow',
    rating: '4.9',
    likes: '32.4K',
    image: winterBurrowUrl,
  },
  {
    title: 'Shelve the Potions',
    rating: '4.6',
    likes: '18.9K',
    image: shelvePotionsUrl,
  },
];

const START_INDEX = 2;
const SWIPE_THRESHOLD = 40;

export class NewGames {
  private cards: HTMLLIElement[] = [];
  private activeIndex = START_INDEX;
  private swipeStart: number | null = null;
  private suppressClick = false;

  public render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'new-games';
    section.setAttribute('aria-label', 'New games');
    section.append(this.createHeader(), this.createTrack());
    section.addEventListener('keydown', this.onKeyDown);
    this.updateCards();

    return section;
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'new-games__header';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'new-games__title-group';

    const accent = document.createElement('span');
    accent.className = 'new-games__accent';

    const title = document.createElement('h2');
    title.className = 'new-games__title';
    title.textContent = 'New Games';

    titleGroup.append(accent, title);
    header.append(titleGroup, this.createNav());

    return header;
  }

  private createNav(): HTMLElement {
    const nav = document.createElement('div');
    nav.className = 'new-games__nav';
    const previous = this.createNavButton('Previous games', arrowLeftUrl, false);
    const next = this.createNavButton('Next games', arrowRightUrl, true);
    previous.addEventListener('click', () => this.step(-1));
    next.addEventListener('click', () => this.step(1));
    nav.append(previous, next);

    return nav;
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

    GAMES.forEach((game) => {
      const card = this.createCard(game);
      this.cards.push(card);
      list.append(card);
    });

    return list;
  }

  private createCard(game: GameCard): HTMLLIElement {
    const item = document.createElement('li');
    item.className = 'new-games__card';

    const image = document.createElement('img');
    image.className = 'new-games__cover';
    image.src = game.image;
    image.alt = game.title;

    const overlay = document.createElement('div');
    overlay.className = 'new-games__overlay';

    const name = document.createElement('p');
    name.className = 'new-games__name';
    name.textContent = game.title;

    const meta = document.createElement('div');
    meta.className = 'new-games__meta';
    meta.append(this.createMeta(starUrl, game.rating), this.createMeta(heartUrl, game.likes));

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'new-games__open';
    open.dataset.gameDetails = '';
    open.setAttribute('aria-label', `Open details for ${game.title}`);

    overlay.append(name, meta);
    item.append(image, overlay, open);

    return item;
  }

  private createMeta(icon: string, value: string): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'new-games__stat';

    const image = document.createElement('img');
    image.src = icon;
    image.alt = '';
    image.width = 16;
    image.height = 16;

    const text = document.createElement('span');
    text.textContent = value;

    wrap.append(image, text);

    return wrap;
  }

  private step(direction: number): void {
    const count = GAMES.length;
    this.activeIndex = (this.activeIndex + direction + count) % count;
    this.updateCards();
  }

  private updateCards(): void {
    const half = Math.floor(GAMES.length / 2);

    this.cards.forEach((card, index) => {
      const delta = this.wrapOffset(index);
      card.classList.remove(
        'new-games__card--peek',
        'new-games__card--side',
        'new-games__card--active',
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
    const count = GAMES.length;
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

    return 'peek';
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
