const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const USERNAME_MIN = 2;
const USERNAME_MAX = 30;
const PASSWORD_MIN = 6;
const SPECIAL_CHARACTERS = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

export function validateEmail(value: string): string {
  const email = value.trim();

  if (email.length === 0) {
    return 'Email is required.';
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Enter a valid email address.';
  }

  return '';
}

export function validateUsername(value: string): string {
  const username = value.trim();

  if (username.length === 0) {
    return 'Username is required.';
  }

  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return 'Username must be 2-30 characters.';
  }

  if (!/^[A-Z]/.test(username)) {
    return 'Username must start with an uppercase English letter.';
  }

  if (!/^[A-Za-z0-9]+$/.test(username)) {
    return 'Username may contain only English letters and digits.';
  }

  return '';
}

export function validateLoginPassword(value: string): string {
  if (value.length === 0) {
    return 'Password is required.';
  }

  if (value.length < PASSWORD_MIN) {
    return 'Password must be at least 6 characters.';
  }

  return '';
}

export function validateRegisterPassword(value: string): string {
  if (value.length === 0) {
    return 'Password is required.';
  }

  if (![...value].every(isAllowedPasswordCharacter)) {
    return 'Password may contain only English letters, digits, and special characters.';
  }

  if (value.length < PASSWORD_MIN) {
    return 'Password must be at least 6 characters.';
  }

  if (!/[A-Z]/.test(value)) {
    return 'Password must include an uppercase English letter.';
  }

  if (!/[0-9]/.test(value)) {
    return 'Password must include a digit.';
  }

  if (![...value].some(isSpecialCharacter)) {
    return 'Password must include a special character.';
  }

  return '';
}

export function validateConfirmPassword(password: string, confirm: string): string {
  if (confirm.length === 0) {
    return 'Confirm password is required.';
  }

  if (confirm !== password) {
    return 'Passwords do not match.';
  }

  return '';
}

export function isLoginFormValid(email: string, password: string): boolean {
  return validateEmail(email) === '' && validateLoginPassword(password) === '';
}

export function isRegisterFormValid(
  username: string,
  email: string,
  password: string,
  confirm: string,
): boolean {
  return (
    validateUsername(username) === '' &&
    validateEmail(email) === '' &&
    validateRegisterPassword(password) === '' &&
    validateConfirmPassword(password, confirm) === ''
  );
}

function isSpecialCharacter(character: string): boolean {
  return SPECIAL_CHARACTERS.includes(character);
}

function isAllowedPasswordCharacter(character: string): boolean {
  return /[A-Za-z0-9]/.test(character) || isSpecialCharacter(character);
}
