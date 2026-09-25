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
  size: CardSize;
};

const GAMES: GameCard[] = [
  {
    title: 'Tailside: Cozy Cafe Sim',
    rating: '4.7',
    likes: '21.4K',
    image: tailsideUrl,
    size: 'peek',
  },
  {
    title: 'Islanders: New Shores',
    rating: '4.9',
    likes: '54.2K',
    image: islandersUrl,
    size: 'side',
  },
  {
    title: 'Vacation Cafe Simulator',
    rating: '4.8',
    likes: '28.7K',
    image: vacationCafeUrl,
    size: 'active',
  },
  {
    title: 'Winter Burrow',
    rating: '4.9',
    likes: '32.4K',
    image: winterBurrowUrl,
    size: 'side',
  },
  {
    title: 'Shelve the Potions',
    rating: '4.6',
    likes: '18.9K',
    image: shelvePotionsUrl,
    size: 'peek',
  },
];

export class NewGames {
  public render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'new-games';
    section.setAttribute('aria-label', 'New games');
    section.append(this.createHeader(), this.createTrack());

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
    nav.append(
      this.createNavButton('Previous games', arrowLeftUrl, false),
      this.createNavButton('Next games', arrowRightUrl, true),
    );

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

    GAMES.forEach((game) => {
      list.append(this.createCard(game));
    });

    return list;
  }

  private createCard(game: GameCard): HTMLLIElement {
    const item = document.createElement('li');
    item.className = `new-games__card new-games__card--${game.size}`;

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
}
