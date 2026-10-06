import googleUrl from '../../assets/icons/google.svg?url';
import lockUrl from '../../assets/icons/lock.svg?url';
import mailUrl from '../../assets/icons/mail.svg?url';
import personUrl from '../../assets/icons/person.svg?url';
import visibilityOffUrl from '../../assets/icons/visibility-off.svg?url';
import visibilityUrl from '../../assets/icons/visibility.svg?url';
import {
  isLoginFormValid,
  isRegisterFormValid,
  validateConfirmPassword,
  validateEmail,
  validateLoginPassword,
  validateRegisterPassword,
  validateUsername,
} from './auth-validation';

export type AuthMode = 'login' | 'register';

type AuthFieldKey =
  | 'login-email'
  | 'login-password'
  | 'register-username'
  | 'register-email'
  | 'register-password'
  | 'register-confirm';

interface AuthFieldView {
  root: HTMLDivElement;
  input: HTMLInputElement;
  error: HTMLParagraphElement;
  touched: boolean;
}

export class AuthDialog {
  private dialog: HTMLDialogElement | null = null;
  private mode: AuthMode = 'login';
  private userClose = false;
  private loginTab: HTMLButtonElement | null = null;
  private registerTab: HTMLButtonElement | null = null;
  private loginPanel: HTMLElement | null = null;
  private registerPanel: HTMLElement | null = null;
  private passwordInput: HTMLInputElement | null = null;
  private passwordToggle: HTMLButtonElement | null = null;
  private loginSubmit: HTMLButtonElement | null = null;
  private registerSubmit: HTMLButtonElement | null = null;
  private readonly fields = new Map<AuthFieldKey, AuthFieldView>();

  constructor(
    private readonly onDismiss?: () => void,
    private readonly onModeChange?: (mode: AuthMode) => void,
  ) {}

  public render(): HTMLDialogElement {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'auth';
    this.dialog.setAttribute('aria-labelledby', 'auth-title-login');

    const switcher = this.createSwitcher();
    this.loginPanel = this.createLoginPanel();
    this.registerPanel = this.createRegisterPanel();

    this.dialog.append(switcher, this.loginPanel, this.registerPanel);
    this.dialog.addEventListener('cancel', this.onDialogCancel);
    this.dialog.addEventListener('close', this.onDialogClose);
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
    if (!this.dialog?.open) {
      return;
    }

    this.userClose = true;
    this.dialog.close();
    this.emitDismiss();
  }

  public dismiss(): void {
    if (!this.dialog?.open) {
      return;
    }

    this.dialog.close();
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
    form.noValidate = true;

    const header = this.createHeader(
      'Welcome Back!',
      'Sign in to resume your games and progress.',
      'auth-title-login',
    );

    const email = this.createField({
      id: 'auth-login-email',
      field: 'login-email',
      label: 'Email Address',
      type: 'email',
      name: 'email',
      placeholder: 'e.g. alex@minigames.com',
      icon: mailUrl,
      autocomplete: 'email',
    });

    const password = this.createField({
      id: 'auth-login-password',
      field: 'login-password',
      label: 'Password',
      type: 'password',
      name: 'password',
      placeholder: '••••••••',
      icon: lockUrl,
      autocomplete: 'current-password',
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
      this.createSubmit('Login', 'login'),
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
    form.noValidate = true;

    const header = this.createHeader(
      'Create Account',
      'Join MiniGames to track your score & streak.',
      'auth-title-register',
    );

    const username = this.createField({
      id: 'auth-register-username',
      field: 'register-username',
      label: 'Username',
      type: 'text',
      name: 'username',
      placeholder: 'e.g. CozyGamer_99',
      icon: personUrl,
      autocomplete: 'username',
    });

    const email = this.createField({
      id: 'auth-register-email',
      field: 'register-email',
      label: 'Email Address',
      type: 'email',
      name: 'email',
      placeholder: 'your.email@domain.com',
      icon: mailUrl,
      autocomplete: 'email',
    });

    const password = this.createField({
      id: 'auth-register-password',
      field: 'register-password',
      label: 'Password',
      type: 'password',
      name: 'password',
      placeholder: 'Min. 6 characters',
      icon: lockUrl,
      autocomplete: 'new-password',
    });

    const confirm = this.createField({
      id: 'auth-register-confirm',
      field: 'register-confirm',
      label: 'Confirm Password',
      type: 'password',
      name: 'confirm-password',
      placeholder: 'Repeat your password',
      icon: lockUrl,
      autocomplete: 'new-password',
    });

    form.append(
      header,
      username,
      email,
      password,
      confirm,
      this.createSubmit('Create Account', 'register'),
      this.createDivider(),
      this.createGoogleButton('Sign up with Google'),
      this.createFooter('Already have an account?', 'Login', 'login'),
    );

    form.addEventListener('submit', (event) => {
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
    field: AuthFieldKey;
    label: string;
    type: string;
    name: string;
    placeholder: string;
    icon: string;
    autocomplete: string;
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
    input.dataset.field = options.field;
    input.setAttribute('aria-invalid', 'false');
    input.addEventListener('input', this.onFieldEdit);
    input.addEventListener('change', this.onFieldEdit);
    input.addEventListener('blur', this.onFieldEdit);

    const error = document.createElement('p');
    error.className = 'auth__error';
    error.id = `${options.id}-error`;
    error.hidden = true;
    input.setAttribute('aria-describedby', error.id);

    this.fields.set(options.field, { root: field, input, error, touched: false });

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

    field.append(label, wrapper, error);

    return field;
  }

  private createSubmit(label: string, mode: AuthMode): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'auth__submit';
    button.textContent = label;
    button.disabled = true;

    if (mode === 'login') {
      this.loginSubmit = button;
    } else {
      this.registerSubmit = button;
    }

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
    action.addEventListener('click', () => this.chooseMode(mode));

    footer.append(action);

    return footer;
  }

  private bindEvents(): void {
    this.loginTab?.addEventListener('click', () => this.chooseMode('login'));
    this.registerTab?.addEventListener('click', () => this.chooseMode('register'));
    this.passwordToggle?.addEventListener('click', this.togglePassword);
    this.dialog?.addEventListener('click', this.onBackdropClick);
  }

  private chooseMode(mode: AuthMode): void {
    if (this.mode === mode) {
      return;
    }

    this.setMode(mode);
    this.onModeChange?.(mode);
  }

  private onDialogCancel = (): void => {
    this.userClose = true;
  };

  private onDialogClose = (): void => {
    this.emitDismiss();
  };

  private emitDismiss(): void {
    if (!this.userClose) {
      return;
    }

    this.userClose = false;
    this.onDismiss?.();
  }

  private setMode(mode: AuthMode): void {
    const modeChanged = this.mode !== mode;
    this.mode = mode;
    const isLogin = mode === 'login';

    if (modeChanged) {
      this.resetForms();
    }

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

  private onFieldEdit = (event: Event): void => {
    const input = event.currentTarget;

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const key = this.fieldKey(input.dataset.field);
    if (!key) {
      return;
    }

    const field = this.fields.get(key);
    if (!field) {
      return;
    }

    field.touched = true;
    this.renderField(key);

    if (key === 'register-password') {
      this.renderField('register-confirm');
    }

    this.updateSubmitState();
  };

  private renderField(key: AuthFieldKey): void {
    const field = this.fields.get(key);
    if (!field) {
      return;
    }

    const message = field.touched ? this.messageFor(key) : '';
    field.error.textContent = message;
    field.error.hidden = message.length === 0;
    field.input.setAttribute('aria-invalid', message.length > 0 ? 'true' : 'false');
    field.root.classList.toggle('auth__field--invalid', message.length > 0);
  }

  private messageFor(key: AuthFieldKey): string {
    const value = this.fieldValue(key);
    const password = this.fieldValue('register-password');

    switch (key) {
      case 'login-email':
      case 'register-email':
        return validateEmail(value);
      case 'register-username':
        return validateUsername(value);
      case 'login-password':
        return validateLoginPassword(value);
      case 'register-password':
        return validateRegisterPassword(value);
      case 'register-confirm':
        return validateConfirmPassword(password, value);
      default:
        return '';
    }
  }

  private updateSubmitState(): void {
    if (this.loginSubmit) {
      this.loginSubmit.disabled = !isLoginFormValid(
        this.fieldValue('login-email'),
        this.fieldValue('login-password'),
      );
    }

    if (this.registerSubmit) {
      this.registerSubmit.disabled = !isRegisterFormValid(
        this.fieldValue('register-username'),
        this.fieldValue('register-email'),
        this.fieldValue('register-password'),
        this.fieldValue('register-confirm'),
      );
    }
  }

  private resetForms(): void {
    for (const field of this.fields.values()) {
      field.input.value = '';
      field.touched = false;
      field.error.textContent = '';
      field.error.hidden = true;
      field.input.setAttribute('aria-invalid', 'false');
      field.root.classList.remove('auth__field--invalid');
    }

    this.updateSubmitState();
  }

  private fieldValue(key: AuthFieldKey): string {
    return this.fields.get(key)?.input.value ?? '';
  }

  private fieldKey(value: string | undefined): AuthFieldKey | null {
    switch (value) {
      case 'login-email':
      case 'login-password':
      case 'register-username':
      case 'register-email':
      case 'register-password':
      case 'register-confirm':
        return value;
      default:
        return null;
    }
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
