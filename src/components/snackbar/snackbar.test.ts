/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { snackbar } from './snackbar';

describe('snackbar', () => {
  afterEach(() => {
    snackbar.hide();
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it('does nothing until it has been rendered', async () => {
    vi.resetModules();
    const { snackbar: fresh } = await import('./snackbar');
    fresh.hide();
    fresh.show('Saved', 'success');
    expect(document.querySelector('.snackbar')).toBeNull();
  });

  it('shows plain text and keeps an error on the page', () => {
    document.body.append(snackbar.render());
    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    document.body.append(dialog);

    snackbar.show('<b>Try again</b>', 'error');

    const text = document.querySelector('.snackbar__text');
    const host = document.querySelector('.snackbar-host');
    expect(text?.textContent).toBe('<b>Try again</b>');
    expect(text?.querySelector('b')).toBeNull();
    expect(document.querySelector('.snackbar')?.getAttribute('role')).toBe('alert');
    expect(document.querySelector('.snackbar')?.className).toContain('snackbar--error');
    expect(host?.parentElement).toBe(document.body);
  });

  it('lifts a non-error notice into the open dialog and restores it when the dialog is gone', () => {
    document.body.append(snackbar.render());
    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    document.body.append(dialog);

    snackbar.show('Saved', 'success');
    expect(document.querySelector('.snackbar')?.getAttribute('role')).toBe('status');
    expect(document.querySelector('.snackbar-host')?.parentElement).toBe(dialog);

    dialog.removeAttribute('open');
    snackbar.show('Heads up', 'warning');
    expect(document.querySelector('.snackbar')?.className).toContain('snackbar--warning');
    expect(document.querySelector('.snackbar-host')?.parentElement).toBe(document.body);
  });

  it('replaces the current notice and hides it from the close button or the timer', () => {
    vi.useFakeTimers();
    document.body.append(snackbar.render());
    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    document.body.append(dialog);
    snackbar.show('First', 'info');

    snackbar.show('Second', 'info');
    expect(document.querySelectorAll('.snackbar')).toHaveLength(1);
    expect(document.querySelector('.snackbar__text')?.textContent).toBe('Second');
    expect(document.querySelector('.snackbar-host')?.parentElement).toBe(dialog);

    document.querySelector<HTMLButtonElement>('.snackbar__close')?.click();
    expect(document.querySelector('.snackbar')).toBeNull();
    expect(document.querySelector('.snackbar-host')?.parentElement).toBe(document.body);

    snackbar.show('Later', 'info');
    vi.advanceTimersByTime(3999);
    expect(document.querySelector('.snackbar__text')?.textContent).toBe('Later');
    vi.advanceTimersByTime(1);
    expect(document.querySelector('.snackbar')).toBeNull();
  });

  it('restarts the timer when a new notice replaces one that is still visible', () => {
    vi.useFakeTimers();
    document.body.append(snackbar.render());

    snackbar.show('First', 'info');
    vi.advanceTimersByTime(3000);
    snackbar.show('Second', 'info');
    vi.advanceTimersByTime(3000);
    expect(document.querySelector('.snackbar__text')?.textContent).toBe('Second');
    vi.advanceTimersByTime(1000);
    expect(document.querySelector('.snackbar')).toBeNull();
  });
});
