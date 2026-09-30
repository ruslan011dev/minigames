import type { Page } from '../../types/page';
import { DeveloperCta } from './developer';
import { Hero } from './hero';
import { Leaderboard } from './leaderboard';
import { NewGames } from './new-games';

export class HomePage implements Page {
  private readonly slider = new NewGames();

  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--home';
    page.setAttribute('data-page', 'home');
    page.append(
      new Hero().render(),
      this.slider.render(),
      new Leaderboard().render(),
      new DeveloperCta().render(),
    );

    return page;
  }

  public destroy(): void {
    this.slider.destroy();
  }
}
