import closeUrl from '../../assets/icons/close.svg?url';

export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info';

const DISMISS_MS = 4000;

export class Snackbar {
  private host: HTMLElement | null = null;
  private home: ParentNode | null = null;
  private hideTimer: number | null = null;

  public render(): HTMLElement {
    const host = document.createElement('div');
    host.className = 'snackbar-host';
    this.host = host;

    return host;
  }

  public show(message: string, variant: SnackbarVariant): void {
    if (!this.host) {
      return;
    }

    this.clearTimer();
    this.host.replaceChildren(this.createNotice(message, variant));

    if (variant === 'error') {
      this.restoreHome();
    } else {
      this.liftAboveDialog();
    }
    this.hideTimer = window.setTimeout(() => {
      this.hide();
    }, DISMISS_MS);
  }

  public hide(): void {
    this.clearTimer();

    if (!this.host) {
      return;
    }

    this.host.replaceChildren();
    this.restoreHome();
  }

  private createNotice(message: string, variant: SnackbarVariant): HTMLElement {
    const notice = document.createElement('div');
    notice.className = `snackbar snackbar--${variant}`;
    notice.setAttribute('role', variant === 'error' ? 'alert' : 'status');

    const text = document.createElement('p');
    text.className = 'snackbar__text';
    text.textContent = message;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'snackbar__close';
    close.setAttribute('aria-label', 'Dismiss notification');

    const icon = document.createElement('img');
    icon.src = closeUrl;
    icon.alt = '';
    close.append(icon);
    close.addEventListener('click', () => {
      this.hide();
    });

    notice.append(text, close);

    return notice;
  }

  private liftAboveDialog(): void {
    if (!this.host) {
      return;
    }

    this.home ??= this.host.parentNode;
    const dialog = document.querySelector('dialog[open]');

    if (!dialog) {
      this.restoreHome();
      return;
    }

    if (this.host.parentElement !== dialog) {
      dialog.append(this.host);
    }
  }

  private restoreHome(): void {
    if (!this.host || !this.home || this.host.parentNode === this.home) {
      return;
    }

    this.home.append(this.host);
  }

  private clearTimer(): void {
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}

export const snackbar = new Snackbar();
