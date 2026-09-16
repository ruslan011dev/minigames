import type { Page } from '../../types/page';

export class HomePage implements Page {
  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'page page--home';
    page.setAttribute('data-page', 'home');

    return page;
  }
}
