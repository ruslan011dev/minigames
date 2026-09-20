import googleUrl from '../../assets/icons/google.svg?url';
import lockUrl from '../../assets/icons/lock.svg?url';
import mailUrl from '../../assets/icons/mail.svg?url';
import personUrl from '../../assets/icons/person.svg?url';
import visibilityOffUrl from '../../assets/icons/visibility-off.svg?url';
import visibilityUrl from '../../assets/icons/visibility.svg?url';

export type AuthMode = 'login' | 'register';

export class AuthDialog {
  private dialog: HTMLDialogElement | null = null;
  private loginTab: HTMLButtonElement | null = null;
  private registerTab: HTMLButtonElement | null = null;
  private loginPanel: HTMLElement | null = null;
  private registerPanel: HTMLElement | null = null;
  private passwordInput: HTMLInputElement | null = null;
  private passwordToggle: HTMLButtonElement | null = null;

  public render(): HTMLDialogElement {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'auth';
    this.dialog.setAttribute('aria-labelledby', 'auth-title-login');

    const switcher = this.createSwitcher();
    this.loginPanel = this.createLoginPanel();
    this.registerPanel = this.createRegisterPanel();

    this.dialog.append(switcher, this.loginPanel, this.registerPanel);
    this.bindEvents();
    this.setMode('login');

    return this.dialog;
  }

  public open(mode: AuthMode): void {
    this.setMode(mode);
    if (!this.dialog?.open) {
      this.dialog?.showModal();
    }
  }

  public close(): void {
    if (this.dialog?.open) {
      this.dialog.close();
    }
  }

  private createSwitcher(): HTMLDivElement {
    const switcher = document.createElement('div');
    switcher.className = 'auth__switcher';
    switcher.setAttribute('role', 'tablist');
    switcher.setAttribute('aria-label', 'Authentication');

    this.loginTab = this.createTab('Login', 'login');
    this.registerTab = this.createTab('Register', 'register');
    switcher.append(this.loginTab, this.registerTab);

    return switcher;
  }

  private createTab(label: string, mode: AuthMode): HTMLButtonElement {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'auth__tab';
    tab.id = `auth-tab-${mode}`;
    tab.setAttribute('role', 'tab');
    tab.dataset.mode = mode;
    tab.textContent = label;

    return tab;
  }

  private createLoginPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'auth__panel';
    panel.id = 'auth-panel-login';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', 'auth-tab-login');

    const form = document.createElement('form');
    form.className = 'auth__form';
    form.noValidate = false;

    const header = this.createHeader(
      'Welcome Back!',
      'Sign in to resume your games and progress.',
      'auth-title-login',
    );

    const email = this.createField({
      id: 'auth-login-email',
      label: 'Email Address',
      type: 'email',
      name: 'email',
      placeholder: 'e.g. alex@minigames.com',
      icon: mailUrl,
      autocomplete: 'email',
    });

    const password = this.createField({
      id: 'auth-login-password',
      label: 'Password',
      type: 'password',
      name: 'password',
      placeholder: '••••••••',
      icon: lockUrl,
      autocomplete: 'current-password',
      minLength: 8,
      toggle: true,
    });

    const forgot = document.createElement('p');
    forgot.className = 'auth__forgot';
    const forgotLink = document.createElement('button');
    forgotLink.type = 'button';
    forgotLink.className = 'auth__link';
    forgotLink.textContent = 'Forgot Password?';
    forgot.append(forgotLink);

    form.append(
      header,
      email,
      password,
      forgot,
      this.createSubmit('Login'),
      this.createDivider(),
      this.createGoogleButton('Continue with Google'),
      this.createFooter("Don't have an account?", 'Register', 'register'),
    );

    form.addEventListener('submit', (event) => {
      event.preventDefault();
    });

    panel.append(form);

    return panel;
  }

  private createRegisterPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'auth__panel';
    panel.id = 'auth-panel-register';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', 'auth-tab-register');

    const form = document.createElement('form');
    form.className = 'auth__form';

    const header = this.createHeader(
      'Create Account',
      'Join MiniGames to track your score & streak.',
      'auth-title-register',
    );

    const username = this.createField({
      id: 'auth-register-username',
      label: 'Username',
      type: 'text',
      name: 'username',
      placeholder: 'e.g. CozyGamer_99',
      icon: personUrl,
      autocomplete: 'username',
    });

    const email = this.createField({
      id: 'auth-register-email',
      label: 'Email Address',
      type: 'email',
      name: 'email',
      placeholder: 'your.email@domain.com',
      icon: mailUrl,
      autocomplete: 'email',
    });

    const password = this.createField({
      id: 'auth-register-password',
      label: 'Password',
      type: 'password',
      name: 'password',
      placeholder: 'Min. 8 characters',
      icon: lockUrl,
      autocomplete: 'new-password',
      minLength: 8,
    });

    const confirm = this.createField({
      id: 'auth-register-confirm',
      label: 'Confirm Password',
      type: 'password',
      name: 'confirm-password',
      placeholder: 'Repeat your password',
      icon: lockUrl,
      autocomplete: 'new-password',
      minLength: 8,
    });

    form.append(
      header,
      username,
      email,
      password,
      confirm,
      this.createSubmit('Create Account'),
      this.createDivider(),
      this.createGoogleButton('Sign up with Google'),
      this.createFooter('Already have an account?', 'Login', 'login'),
    );

    form.addEventListener('submit', (event) => {
      const passwordField = form.querySelector<HTMLInputElement>('#auth-register-password');
      const confirmField = form.querySelector<HTMLInputElement>('#auth-register-confirm');

      if (passwordField && confirmField && passwordField.value !== confirmField.value) {
        event.preventDefault();
        confirmField.setCustomValidity('Passwords do not match');
        confirmField.reportValidity();
        return;
      }

      confirmField?.setCustomValidity('');
      event.preventDefault();
    });

    panel.append(form);

    return panel;
  }

  private createHeader(title: string, subtitle: string, titleId?: string): HTMLDivElement {
    const header = document.createElement('div');
    header.className = 'auth__header';

    const heading = document.createElement('h2');
    heading.className = 'auth__title';
    heading.textContent = title;
    if (titleId) {
      heading.id = titleId;
    }

    const text = document.createElement('p');
    text.className = 'auth__subtitle';
    text.textContent = subtitle;

    header.append(heading, text);

    return header;
  }

  private createField(options: {
    id: string;
    label: string;
    type: string;
    name: string;
    placeholder: string;
    icon: string;
    autocomplete: string;
    minLength?: number;
    toggle?: boolean;
  }): HTMLDivElement {
    const field = document.createElement('div');
    field.className = 'auth__field';

    const label = document.createElement('label');
    label.className = 'auth__label';
    label.htmlFor = options.id;
    label.textContent = options.label;

    const wrapper = document.createElement('div');
    wrapper.className = 'auth__control';

    const icon = document.createElement('img');
    icon.className = 'auth__icon';
    icon.src = options.icon;
    icon.alt = '';
    icon.width = 20;
    icon.height = 20;

    const input = document.createElement('input');
    input.className = 'auth__input';
    input.id = options.id;
    input.type = options.type;
    input.name = options.name;
    input.placeholder = options.placeholder;
    input.setAttribute('autocomplete', options.autocomplete);
    input.required = true;

    if (options.minLength) {
      input.minLength = options.minLength;
    }

    wrapper.append(icon, input);

    if (options.toggle) {
      this.passwordInput = input;
      this.passwordToggle = document.createElement('button');
      this.passwordToggle.type = 'button';
      this.passwordToggle.className = 'auth__toggle';
      this.passwordToggle.setAttribute('aria-label', 'Show password');

      const eye = document.createElement('img');
      eye.src = visibilityUrl;
      eye.alt = '';
      eye.width = 20;
      eye.height = 20;

      this.passwordToggle.append(eye);
      wrapper.append(this.passwordToggle);
    }

    field.append(label, wrapper);

    return field;
  }

  private createSubmit(label: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'auth__submit';
    button.textContent = label;

    return button;
  }

  private createDivider(): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'auth__divider';
    row.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.textContent = 'or';
    row.append(document.createElement('span'), text, document.createElement('span'));

    return row;
  }

  private createGoogleButton(label: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'auth__google';

    const icon = document.createElement('img');
    icon.src = googleUrl;
    icon.alt = '';
    icon.width = 24;
    icon.height = 24;

    const text = document.createElement('span');
    text.textContent = label;

    button.append(icon, text);

    return button;
  }

  private createFooter(text: string, actionLabel: string, mode: AuthMode): HTMLParagraphElement {
    const footer = document.createElement('p');
    footer.className = 'auth__footer';
    footer.append(document.createTextNode(`${text} `));

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'auth__link';
    action.dataset.mode = mode;
    action.textContent = actionLabel;
    action.addEventListener('click', () => this.setMode(mode));

    footer.append(action);

    return footer;
  }

  private bindEvents(): void {
    this.loginTab?.addEventListener('click', () => this.setMode('login'));
    this.registerTab?.addEventListener('click', () => this.setMode('register'));
    this.passwordToggle?.addEventListener('click', this.togglePassword);
    this.dialog?.addEventListener('click', this.onBackdropClick);

    this.registerPanel
      ?.querySelector<HTMLInputElement>('#auth-register-confirm')
      ?.addEventListener('input', (event) => {
        (event.currentTarget as HTMLInputElement).setCustomValidity('');
      });
  }

  private setMode(mode: AuthMode): void {
    const isLogin = mode === 'login';

    this.loginTab?.classList.toggle('auth__tab--active', isLogin);
    this.registerTab?.classList.toggle('auth__tab--active', !isLogin);
    this.loginTab?.setAttribute('aria-selected', String(isLogin));
    this.registerTab?.setAttribute('aria-selected', String(!isLogin));
    this.loginTab?.setAttribute('tabindex', isLogin ? '0' : '-1');
    this.registerTab?.setAttribute('tabindex', isLogin ? '-1' : '0');

    this.loginPanel?.toggleAttribute('hidden', !isLogin);
    this.registerPanel?.toggleAttribute('hidden', isLogin);
    this.dialog?.setAttribute(
      'aria-labelledby',
      isLogin ? 'auth-title-login' : 'auth-title-register',
    );
  }

  private togglePassword = (): void => {
    if (!this.passwordInput || !this.passwordToggle) {
      return;
    }

    const hidden = this.passwordInput.type === 'password';
    this.passwordInput.type = hidden ? 'text' : 'password';
    this.passwordToggle.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');

    const icon = this.passwordToggle.querySelector('img');
    if (icon) {
      icon.src = hidden ? visibilityOffUrl : visibilityUrl;
    }
  };

  private onBackdropClick = (event: MouseEvent): void => {
    if (event.target === this.dialog) {
      this.close();
    }
  };
}
