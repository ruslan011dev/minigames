/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthRequestError } from '../../firebase/email-auth';
import { snackbar } from '../snackbar/snackbar';
import { AuthDialog } from './auth';

vi.mock('../../firebase/firebase', () => ({
  firebaseApp: null,
  firebaseAuth: null,
}));

function field(id: string): HTMLInputElement {
  const input = document.getElementById(id);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`Missing field ${id}`);
  }
  return input;
}

function typeInto(id: string, value: string): void {
  const input = field(id);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function mount(
  handlers: {
    onDismiss?: () => void;
    onModeChange?: (mode: 'login' | 'register') => void;
    onSubmit?: (request: {
      mode: 'login' | 'register';
      email: string;
      password: string;
      username?: string;
    }) => Promise<void>;
    onGoogle?: () => Promise<void>;
  } = {},
): AuthDialog {
  const dialog = new AuthDialog(
    handlers.onDismiss,
    handlers.onModeChange,
    handlers.onSubmit,
    handlers.onGoogle,
  );
  document.body.append(dialog.render(), snackbar.render());
  return dialog;
}

describe('auth dialog', () => {
  afterEach(() => {
    snackbar.hide();
    document.body.replaceChildren();
  });

  it('opens on login with an empty, disabled form', () => {
    const onModeChange = vi.fn();
    const dialog = mount({ onModeChange });
    dialog.open('login');

    expect(document.getElementById('auth-tab-login')?.getAttribute('aria-selected')).toBe('true');
    expect(document.getElementById('auth-panel-register')?.hasAttribute('hidden')).toBe(true);
    expect(document.querySelector<HTMLButtonElement>('.auth__submit')?.disabled).toBe(true);
    expect(field('auth-login-email').getAttribute('aria-invalid')).toBe('false');
    expect(onModeChange).not.toHaveBeenCalled();

    document.getElementById('auth-tab-login')?.click();
    expect(onModeChange).not.toHaveBeenCalled();
  });

  it('switches mode from the tabs and footer and clears the other form', () => {
    const onModeChange = vi.fn();
    const dialog = mount({ onModeChange });
    dialog.open('login');
    typeInto('auth-login-email', 'ada@example.com');

    document.getElementById('auth-tab-register')?.click();

    expect(onModeChange).toHaveBeenCalledWith('register');
    expect(document.getElementById('auth-panel-login')?.hasAttribute('hidden')).toBe(true);
    expect(field('auth-login-email').value).toBe('');

    document.getElementById('auth-tab-login')?.click();
    expect(onModeChange).toHaveBeenCalledWith('login');
    document
      .querySelector<HTMLButtonElement>('#auth-panel-login .auth__footer .auth__link')
      ?.click();
    expect(onModeChange).toHaveBeenLastCalledWith('register');
    dialog.open('login');
    expect(onModeChange).toHaveBeenCalledTimes(3);
  });

  it('shows a field error after the user leaves it and enables login when the form is valid', () => {
    mount();
    field('auth-login-email').dispatchEvent(new Event('blur'));
    expect(document.querySelector('#auth-login-email-error')?.textContent).toBe(
      'Email is required.',
    );
    expect(field('auth-login-email').getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('.auth__field--invalid')).not.toBeNull();

    typeInto('auth-login-email', 'ada@example.com');
    typeInto('auth-login-password', 'secret');
    expect(document.querySelector('#auth-login-email-error')?.hasAttribute('hidden')).toBe(true);
    expect(
      document.querySelector<HTMLButtonElement>('#auth-panel-login .auth__submit')?.disabled,
    ).toBe(false);
  });

  it('toggles the login password between hidden and visible', () => {
    mount();
    const toggle = document.querySelector<HTMLButtonElement>('.auth__toggle');
    toggle?.click();
    expect(field('auth-login-password').type).toBe('text');
    expect(toggle?.getAttribute('aria-label')).toBe('Hide password');

    toggle?.click();
    expect(field('auth-login-password').type).toBe('password');
    expect(toggle?.getAttribute('aria-label')).toBe('Show password');
  });

  it('submits a trimmed login and closes the dialog', async () => {
    const onSubmit = vi.fn<(request: { email: string; password: string }) => Promise<void>>(
      async () => undefined,
    );
    const onDismiss = vi.fn();
    const dialog = mount({ onSubmit, onDismiss });
    dialog.open('login');
    typeInto('auth-login-email', '  ada@example.com  ');
    typeInto('auth-login-password', 'secret ');

    document.querySelector<HTMLButtonElement>('#auth-panel-login .auth__submit')?.click();
    await vi.waitFor(() => expect(onDismiss).toHaveBeenCalledOnce());

    expect(onSubmit).toHaveBeenCalledWith({
      mode: 'login',
      email: 'ada@example.com',
      password: 'secret ',
    });
    expect(document.querySelector('dialog')?.open).toBe(false);
    expect(field('auth-login-email').value).toBe('');
  });

  it('submits a trimmed registration', async () => {
    const onSubmit = vi.fn<
      (request: { username?: string; email: string; password: string }) => Promise<void>
    >(async () => undefined);
    const dialog = mount({ onSubmit });
    dialog.open('register');
    typeInto('auth-register-username', ' Ada1 ');
    typeInto('auth-register-email', 'ada@example.com');
    typeInto('auth-register-password', 'Abcde1!');
    typeInto('auth-register-confirm', 'Abcde1!');

    document.querySelector<HTMLButtonElement>('#auth-panel-register .auth__submit')?.click();
    await vi.waitFor(() => expect(document.querySelector('dialog')?.open).toBe(false));

    expect(onSubmit).toHaveBeenCalledWith({
      mode: 'register',
      username: 'Ada1',
      email: 'ada@example.com',
      password: 'Abcde1!',
    });
  });

  it('keeps confirm in step with the register password and ignores an invalid submit', () => {
    const onSubmit = vi.fn(async () => undefined);
    mount({ onSubmit });
    typeInto('auth-register-password', 'Abcde1!');
    typeInto('auth-register-confirm', 'Abcde1!');
    typeInto('auth-register-password', 'Abcde1?');

    expect(document.querySelector('#auth-register-confirm-error')?.textContent).toBe(
      'Passwords do not match.',
    );
    expect(
      document.querySelector<HTMLButtonElement>('#auth-panel-register .auth__submit')?.disabled,
    ).toBe(true);

    for (const panel of ['auth-panel-login', 'auth-panel-register']) {
      document
        .querySelector(`#${panel} form`)
        ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
    expect(onSubmit).not.toHaveBeenCalled();

    field('auth-login-email').dataset.field = 'nope';
    field('auth-login-email').dispatchEvent(new Event('input'));
    field('auth-login-email').dataset.field = 'login-email';
  });

  it('locks the dialog while email sign-in is pending and reports a failure', async () => {
    let rejectSignIn: (error: unknown) => void = () => undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectSignIn = reject;
        }),
    );
    const onDismiss = vi.fn();
    const dialog = mount({ onSubmit, onDismiss });
    dialog.open('login');
    typeInto('auth-login-email', 'ada@example.com');
    typeInto('auth-login-password', 'secret');
    document.querySelector<HTMLButtonElement>('#auth-panel-login .auth__submit')?.click();

    expect(document.querySelector('dialog')?.getAttribute('aria-busy')).toBe('true');
    expect(document.querySelector('#auth-panel-login .auth__submit')?.textContent).toBe(
      'Signing in...',
    );
    expect(document.querySelector('#auth-panel-register .auth__submit')?.textContent).toBe(
      'Create Account',
    );
    expect(field('auth-login-email').disabled).toBe(true);
    expect(document.querySelector('.auth__google span')?.textContent).toBe('Continue with Google');

    document.getElementById('auth-tab-register')?.click();
    expect(document.getElementById('auth-panel-register')?.hasAttribute('hidden')).toBe(true);
    typeInto('auth-login-email', 'bad');
    expect(document.querySelector('#auth-login-email-error')?.hasAttribute('hidden')).toBe(true);

    const cancel = new Event('cancel', { cancelable: true });
    document.querySelector('dialog')?.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    dialog.close();
    document.querySelector('dialog')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onDismiss).not.toHaveBeenCalled();
    expect(document.querySelector('dialog')?.open).toBe(true);

    rejectSignIn(new AuthRequestError('Email or password is incorrect.'));
    await vi.waitFor(() => expect(document.querySelector('.snackbar--error')).not.toBeNull());

    expect(document.querySelector('.snackbar__text')?.textContent).toBe(
      'Email or password is incorrect.',
    );
    expect(document.querySelector('.snackbar-host')?.parentElement).toBe(document.body);
    expect(document.querySelector('dialog')?.open).toBe(true);
    expect(field('auth-login-email').value).toBe('bad');
    expect(document.querySelector('#auth-panel-login .auth__submit')?.textContent).toBe('Login');
  });

  it('shows a canceled Google sign-in inside the dialog and does not close it', async () => {
    const onGoogle = vi.fn(async () => {
      throw new AuthRequestError('Google sign-in was canceled.', true);
    });
    const onDismiss = vi.fn();
    const dialog = mount({ onGoogle, onDismiss });
    dialog.open('register');
    document.querySelector<HTMLButtonElement>('#auth-panel-register .auth__google')?.click();
    await vi.waitFor(() => expect(document.querySelector('.snackbar--info')).not.toBeNull());

    expect(document.querySelector('.snackbar__text')?.textContent).toBe(
      'Google sign-in was canceled.',
    );
    expect(document.querySelector('.snackbar-host')?.parentElement?.tagName).toBe('DIALOG');
    expect(document.querySelector('#auth-panel-register .auth__google span')?.textContent).toBe(
      'Sign up with Google',
    );
    expect(document.querySelector('#auth-panel-register .auth__submit')?.textContent).toBe(
      'Create Account',
    );
    expect(onDismiss).not.toHaveBeenCalled();
    expect(document.querySelector('dialog')?.open).toBe(true);
  });

  it('uses a generic message when sign-in fails without an error message', async () => {
    const onSubmit = vi.fn(async () => {
      throw 'offline';
    });
    const dialog = mount({ onSubmit });
    dialog.open('login');
    typeInto('auth-login-email', 'ada@example.com');
    typeInto('auth-login-password', 'secret');
    document.querySelector<HTMLButtonElement>('#auth-panel-login .auth__submit')?.click();
    await vi.waitFor(() =>
      expect(document.querySelector('.snackbar__text')?.textContent).toBe('Could not sign in.'),
    );
  });

  it('signs in with Google and closes only after success', async () => {
    let resolveGoogle: () => void = () => undefined;
    const onGoogle = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveGoogle = resolve;
        }),
    );
    const dialog = mount({ onGoogle });
    dialog.open('login');
    document.querySelector('#auth-panel-register .auth__google span')?.remove();
    document.querySelector<HTMLButtonElement>('#auth-panel-login .auth__google')?.click();

    expect(document.querySelector('#auth-panel-login .auth__google span')?.textContent).toBe(
      'Signing in...',
    );
    expect(document.querySelector('#auth-panel-login .auth__submit')?.textContent).toBe('Login');

    resolveGoogle();
    await vi.waitFor(() => expect(document.querySelector('dialog')?.open).toBe(false));
  });

  it('closes from the backdrop or Escape and ignores those actions when nothing is open', () => {
    const onDismiss = vi.fn();
    const dialog = mount({ onDismiss });
    dialog.close();
    dialog.dismiss();
    expect(onDismiss).not.toHaveBeenCalled();

    dialog.open('login');
    field('auth-login-email').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onDismiss).not.toHaveBeenCalled();

    document.querySelector('dialog')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledOnce();

    dialog.open('login');
    const cancel = new Event('cancel', { cancelable: true });
    document.querySelector('dialog')?.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(false);
    document.querySelector('dialog')?.close();
    expect(onDismiss).toHaveBeenCalledTimes(2);

    dialog.open('login');
    dialog.dismiss();
    expect(onDismiss).toHaveBeenCalledTimes(2);
    expect(document.querySelector('dialog')?.open).toBe(false);
  });

  it('does nothing when Google or submit handlers are missing', () => {
    const dialog = mount();
    dialog.open('login');
    typeInto('auth-login-email', 'ada@example.com');
    typeInto('auth-login-password', 'secret');
    document.querySelector<HTMLButtonElement>('#auth-panel-login .auth__submit')?.click();
    document.querySelector<HTMLButtonElement>('.auth__google')?.click();
    expect(document.querySelector('dialog')?.open).toBe(true);
  });
});
