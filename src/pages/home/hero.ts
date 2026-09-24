import heroBgUrl from '../../assets/images/hero-bg.png';

export class Hero {
  public render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'hero';
    section.setAttribute('aria-label', 'Intro');

    const media = document.createElement('img');
    media.className = 'hero__media';
    media.src = heroBgUrl;
    media.alt = '';

    const inner = document.createElement('div');
    inner.className = 'hero__inner';
    inner.append(this.createCard());

    section.append(media, inner);

    return section;
  }

  private createCard(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'hero__card';

    const title = document.createElement('h1');
    title.className = 'hero__title';
    title.textContent = 'Take a Short Break & Have Fun';

    const text = document.createElement('p');
    text.className = 'hero__text';
    text.textContent =
      'Discover hundreds of curated casual mini-games. Play instantly in your browser — puzzle, match 3, farm, and board classics.';

    const cta = document.createElement('a');
    cta.className = 'hero__cta';
    cta.href = '/library';
    cta.dataset.page = 'library';
    cta.textContent = 'Browse Library';

    card.append(title, text, cta);

    return card;
  }
}
