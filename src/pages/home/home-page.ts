import type { Page } from '../../types/page';
import { Hero } from './hero';

export class HomePage implements Page {
  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--home';
    page.setAttribute('data-page', 'home');
    page.append(new Hero().render());

    return page;
  }
}
