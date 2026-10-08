import { describe, expect, it } from 'vitest';
import {
  isLoginFormValid,
  isRegisterFormValid,
  validateConfirmPassword,
  validateEmail,
  validateLoginPassword,
  validateRegisterPassword,
  validateUsername,
} from './auth-validation';

describe('validateEmail', () => {
  it('requires a trimmed address and rejects a malformed one', () => {
    expect(validateEmail('   ')).toBe('Email is required.');
    expect(validateEmail('ada@example')).toBe('Enter a valid email address.');
    expect(validateEmail('  ada@example.com  ')).toBe('');
  });
});

describe('validateUsername', () => {
  it('requires 2-30 characters starting with an uppercase English letter', () => {
    expect(validateUsername(' ')).toBe('Username is required.');
    expect(validateUsername('A')).toBe('Username must be 2-30 characters.');
    expect(validateUsername('A'.repeat(31))).toBe('Username must be 2-30 characters.');
    expect(validateUsername('ada')).toBe('Username must start with an uppercase English letter.');
    expect(validateUsername('Ada Lovelace')).toBe(
      'Username may contain only English letters and digits.',
    );
    expect(validateUsername('Ada1')).toBe('');
  });
});

describe('validateLoginPassword', () => {
  it('requires at least 6 characters and skips strength rules', () => {
    expect(validateLoginPassword('')).toBe('Password is required.');
    expect(validateLoginPassword('short')).toBe('Password must be at least 6 characters.');
    expect(validateLoginPassword('simple')).toBe('');
  });
});

describe('validateRegisterPassword', () => {
  it('requires length, an uppercase letter, a digit, and a special character', () => {
    expect(validateRegisterPassword('')).toBe('Password is required.');
    expect(validateRegisterPassword('пароль1!')).toBe(
      'Password may contain only English letters, digits, and special characters.',
    );
    expect(validateRegisterPassword('Ab1!')).toBe('Password must be at least 6 characters.');
    expect(validateRegisterPassword('ab1!ab')).toBe(
      'Password must include an uppercase English letter.',
    );
    expect(validateRegisterPassword('Abcdef!')).toBe('Password must include a digit.');
    expect(validateRegisterPassword('Abcdef1')).toBe('Password must include a special character.');
    expect(validateRegisterPassword('Abcde1!')).toBe('');
  });
});

describe('validateConfirmPassword', () => {
  it('requires the confirmation and an exact match', () => {
    expect(validateConfirmPassword('Abcde1!', '')).toBe('Confirm password is required.');
    expect(validateConfirmPassword('Abcde1!', 'Abcde1?')).toBe('Passwords do not match.');
    expect(validateConfirmPassword('Abcde1!', 'Abcde1!')).toBe('');
  });
});

describe('form validity', () => {
  it('accepts a complete login and rejects a short password', () => {
    expect(isLoginFormValid('ada@example.com', 'simple')).toBe(true);
    expect(isLoginFormValid('ada@example.com', 'short')).toBe(false);
  });

  it('accepts a complete registration and rejects a mismatched confirmation', () => {
    expect(isRegisterFormValid('Ada1', 'ada@example.com', 'Abcde1!', 'Abcde1!')).toBe(true);
    expect(isRegisterFormValid('Ada1', 'ada@example.com', 'Abcde1!', 'Abcde1?')).toBe(false);
  });
});
