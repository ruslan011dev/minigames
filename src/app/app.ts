import { Header } from '../components/header/header';
import { HomePage } from '../pages/home/home-page';
import type { Page } from '../types/page';

export class App {
  private readonly root: HTMLElement;
  private content: HTMLElement | null = null;
  private currentPage: Page | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  public start(): void {
    this.root.replaceChildren(this.createLayout());
    this.renderPage(new HomePage());
  }

  private createLayout(): HTMLElement {
    const app = document.createElement('div');
    app.className = 'app';

    const header = new Header().render();

    const main = document.createElement('main');
    main.className = 'content';
    main.id = 'main-content';
    this.content = main;

    const footer = document.createElement('footer');
    footer.className = 'footer';

    app.append(header, main, footer);

    return app;
  }

  private renderPage(page: Page): void {
    if (!this.content) {
      return;
    }

    this.currentPage?.destroy?.();
    this.currentPage = page;
    this.content.replaceChildren(page.render());
  }
}
