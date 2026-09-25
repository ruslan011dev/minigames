import closeUrl from '../../assets/icons/close.svg?url';
import heartUrl from '../../assets/icons/heart.svg?url';
import starUrl from '../../assets/icons/star.svg?url';
import heroUrl from '../../assets/images/tukoni-forest-keepers-hero.jpg';
import gameFile from '../../mock-data/game-tukoni-forest-keepers.json';

const GAME = gameFile.data;

const SPECS = [
  { label: 'Genre', value: GAME.specs.genre },
  { label: 'Players', value: GAME.specs.players },
  { label: 'Duration', value: GAME.specs.duration },
  { label: 'Price', value: GAME.specs.price },
] as const;

const RECORD_MEDALS = ['🥇', '🥈', '🥉'] as const;
const RECORD_WHEN = ['2 days ago', '5 days ago', '1 week ago'] as const;

const FAVORITE_ADD = 'Add to Favorites';
const FAVORITE_REMOVE = 'Remove from Favorites';

export class GameDetailsDialog {
  private dialog: HTMLDialogElement | null = null;
  private favoriteButton: HTMLButtonElement | null = null;
  private favoriteLabel: HTMLElement | null = null;
  private favorite = false;

  public render(): HTMLDialogElement {
    const dialog = document.createElement('dialog');
    dialog.className = 'details';
    dialog.setAttribute('aria-labelledby', 'game-details-title');

    dialog.append(this.createHero(), this.createBody());
    dialog.addEventListener('click', this.onDialogClick);
    dialog.addEventListener('close', this.onDialogClose);
    this.dialog = dialog;

    return dialog;
  }

  public open(): void {
    if (!this.dialog?.open) {
      this.dialog?.showModal();
    }
  }

  public close(): void {
    if (this.dialog?.open) {
      this.dialog.close();
    }
  }

  private createHero(): HTMLElement {
    const hero = document.createElement('div');
    hero.className = 'details__hero';

    const image = document.createElement('img');
    image.className = 'details__image';
    image.src = heroUrl;
    image.alt = '';

    hero.append(image, this.createClose());

    return hero;
  }

  private createBody(): HTMLElement {
    const body = document.createElement('div');
    body.className = 'details__body';
    body.append(
      this.createHeading(),
      this.createDescription(),
      this.createSpecs(),
      this.createActions(),
      this.createRecords(),
    );

    return body;
  }

  private createHeading(): HTMLElement {
    const heading = document.createElement('div');
    heading.className = 'details__heading';

    const title = document.createElement('h2');
    title.id = 'game-details-title';
    title.className = 'details__title';
    title.textContent = GAME.name;

    const ratings = document.createElement('div');
    ratings.className = 'details__ratings';
    ratings.append(
      this.createStat(starUrl, GAME.rating.toFixed(1)),
      this.createStat(heartUrl, formatLikes(GAME.likesCount)),
    );

    heading.append(title, ratings);

    return heading;
  }

  private createStat(iconUrl: string, value: string): HTMLElement {
    const stat = document.createElement('p');
    stat.className = 'details__stat';

    const icon = document.createElement('img');
    icon.src = iconUrl;
    icon.alt = '';

    stat.append(icon, document.createTextNode(value));

    return stat;
  }

  private createDescription(): HTMLParagraphElement {
    const description = document.createElement('p');
    description.className = 'details__description';
    description.textContent = GAME.fullDescription;

    return description;
  }

  private createSpecs(): HTMLDListElement {
    const list = document.createElement('dl');
    list.className = 'details__specs';

    SPECS.forEach((spec) => {
      const item = document.createElement('div');
      item.className = 'details__spec';

      const term = document.createElement('dt');
      term.textContent = spec.label;

      const detail = document.createElement('dd');
      detail.textContent = spec.value;

      item.append(term, detail);
      list.append(item);
    });

    return list;
  }

  private createActions(): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'details__actions';

    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'details__play';
    play.textContent = 'Play Now';

    actions.append(play, this.createFavorite());

    return actions;
  }

  private createFavorite(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'details__favorite';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', FAVORITE_ADD);

    const icon = document.createElement('img');
    icon.src = heartUrl;
    icon.alt = '';

    const label = document.createElement('span');
    label.className = 'details__favorite-label';
    label.textContent = FAVORITE_ADD;

    button.append(icon, label);
    button.addEventListener('click', this.onFavoriteClick);
    this.favoriteButton = button;
    this.favoriteLabel = label;

    return button;
  }

  private createRecords(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'details__records';
    section.setAttribute('aria-labelledby', 'details-records-title');

    const title = document.createElement('h3');
    title.id = 'details-records-title';
    title.className = 'details__records-title';

    const trophy = document.createElement('span');
    trophy.setAttribute('aria-hidden', 'true');
    trophy.textContent = '🏆';
    title.append(trophy, document.createTextNode('Top Records'));

    const list = document.createElement('ol');
    list.className = 'details__record-list';

    GAME.topRecords.forEach((record, index) => {
      list.append(this.createRecord(record.playerName, record.score, index));
    });

    section.append(title, list);

    return section;
  }

  private createRecord(name: string, score: number, index: number): HTMLLIElement {
    const item = document.createElement('li');
    item.className = 'details__record';

    const player = document.createElement('span');
    player.className = 'details__player';

    const medal = document.createElement('span');
    medal.setAttribute('aria-hidden', 'true');
    medal.textContent = RECORD_MEDALS[index] ?? '';

    const playerName = document.createElement('span');
    playerName.textContent = name;
    player.append(medal, playerName);

    const result = document.createElement('span');
    result.className = 'details__result';

    const points = document.createElement('span');
    points.className = 'details__points';
    points.textContent = `${score.toLocaleString('en-US')} pts`;

    const when = document.createElement('span');
    when.className = 'details__when';
    when.textContent = RECORD_WHEN[index] ?? '';

    result.append(points, when);
    item.append(player, result);

    return item;
  }

  private createClose(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'details__close';
    button.setAttribute('aria-label', 'Close game details');

    const icon = document.createElement('img');
    icon.src = closeUrl;
    icon.alt = '';

    button.append(icon);
    button.addEventListener('click', () => this.close());

    return button;
  }

  private onFavoriteClick = (): void => {
    this.setFavorite(!this.favorite);
  };

  private onDialogClose = (): void => {
    this.setFavorite(false);
  };

  private onDialogClick = (event: MouseEvent): void => {
    if (event.target === this.dialog) {
      this.close();
    }
  };

  private setFavorite(active: boolean): void {
    this.favorite = active;
    const text = active ? FAVORITE_REMOVE : FAVORITE_ADD;
    this.favoriteButton?.classList.toggle('details__favorite--active', active);
    this.favoriteButton?.setAttribute('aria-pressed', String(active));
    this.favoriteButton?.setAttribute('aria-label', text);

    if (this.favoriteLabel) {
      this.favoriteLabel.textContent = text;
    }
  }
}

function formatLikes(count: number): string {
  if (count < 1000) {
    return String(count);
  }

  const thousands = Math.floor(count / 100) / 10;
  return `${thousands.toFixed(1)}K`;
}
