import heartUrl from '../../assets/icons/heart.svg?url';
import starUrl from '../../assets/icons/star.svg?url';
import { selectLibraryGames, type LibraryGame } from './library-catalog';

export class LibraryCards {
  public render(category: string, sort: string | null): HTMLElement {
    const section = document.createElement('section');
    section.className = 'library-cards';
    section.setAttribute('aria-label', 'Games');
    section.append(this.createList(category, sort));

    return section;
  }

  public update(section: HTMLElement, category: string, sort: string | null): void {
    const list = section.querySelector('.library-cards__list');

    if (!list) {
      return;
    }

    list.replaceChildren(...this.createItems(category, sort));
  }

  private createList(category: string, sort: string | null): HTMLElement {
    const list = document.createElement('ul');
    list.className = 'library-cards__list';
    list.append(...this.createItems(category, sort));

    return list;
  }

  private createItems(category: string, sort: string | null): HTMLElement[] {
    const games = selectLibraryGames(category, sort);

    if (games.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'library-cards__empty';
      empty.textContent = 'No games in this category.';
      return [empty];
    }

    return games.map((game) => this.createCard(game));
  }

  private createCard(game: LibraryGame): HTMLLIElement {
    const item = document.createElement('li');
    item.className = 'library-cards__item';

    const card = document.createElement('article');
    card.className = 'library-card';

    const cover = document.createElement('img');
    cover.className = 'library-card__cover';
    cover.src = game.image;
    cover.alt = '';

    card.append(cover, this.createBody(game));
    item.append(card);

    return item;
  }

  private createBody(game: LibraryGame): HTMLElement {
    const body = document.createElement('div');
    body.className = 'library-card__body';

    const heading = document.createElement('div');
    heading.className = 'library-card__heading';

    const title = document.createElement('h2');
    title.className = 'library-card__title';
    title.textContent = game.name;

    const badge = document.createElement('span');
    badge.className = 'library-card__badge';
    badge.textContent = game.categoryLabel;

    heading.append(title, badge);

    const price = document.createElement('p');
    price.className = 'library-card__price';
    price.textContent = game.price;

    const text = document.createElement('p');
    text.className = 'library-card__text';
    text.textContent = game.description;

    body.append(heading, price, text, this.createStats(game), this.createDetails(game.name));

    return body;
  }

  private createStats(game: LibraryGame): HTMLElement {
    const stats = document.createElement('div');
    stats.className = 'library-card__stats';
    stats.append(this.createStat(starUrl, game.rating), this.createStat(heartUrl, game.likes));

    return stats;
  }

  private createStat(iconUrl: string, value: string): HTMLElement {
    const stat = document.createElement('span');
    stat.className = 'library-card__stat';

    const icon = document.createElement('img');
    icon.src = iconUrl;
    icon.alt = '';

    const label = document.createElement('span');
    label.textContent = value;

    stat.append(icon, label);

    return stat;
  }

  private createDetails(name: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'library-card__details';
    button.textContent = 'Details';
    button.setAttribute('aria-label', `Details for ${name}`);

    return button;
  }
}
