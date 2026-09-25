import closeUrl from '../../assets/icons/close.svg?url';

export class GameDetailsDialog {
  private dialog: HTMLDialogElement | null = null;

  public render(): HTMLDialogElement {
    const dialog = document.createElement('dialog');
    dialog.className = 'details';
    dialog.setAttribute('aria-labelledby', 'game-details-title');

    const title = document.createElement('h2');
    title.id = 'game-details-title';
    title.className = 'details__title';
    title.textContent = 'Tukoni: Forest Keepers';

    dialog.append(this.createClose(), title);
    dialog.addEventListener('click', this.onDialogClick);
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

  private onDialogClick = (event: MouseEvent): void => {
    if (event.target === this.dialog) {
      this.close();
    }
  };
}
