import closeUrl from '../../assets/icons/close.svg?url';

export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info';

const DISMISS_MS = 4000;

export class Snackbar {
  private host: HTMLElement | null = null;
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
    this.hideTimer = window.setTimeout(() => {
      this.hide();
    }, DISMISS_MS);
  }

  public hide(): void {
    this.clearTimer();
    this.host?.replaceChildren();
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

  private clearTimer(): void {
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}

export const snackbar = new Snackbar();
