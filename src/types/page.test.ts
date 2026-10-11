import { describe, expect, it } from 'vitest';
import { isPageId } from './page';

describe('isPageId', () => {
  it('accepts only the home and library pages', () => {
    expect(isPageId('home')).toBe(true);
    expect(isPageId('library')).toBe(true);
    expect(isPageId('not-found')).toBe(false);
    expect(isPageId(undefined)).toBe(false);
  });
});
