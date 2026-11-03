import { describe, expect, it } from 'vitest';
import { visiblePages } from './library-pagination';

describe('visiblePages', () => {
  it('returns every page when they fit, and at least one page otherwise', () => {
    expect(visiblePages(1, 3, 4)).toEqual([1, 2, 3]);
    expect(visiblePages(1, 0, 0)).toEqual([1]);
  });

  it('keeps the window on the current page and pins it at both ends', () => {
    expect(visiblePages(5, 10, 4)).toEqual([4, 5, 6, 7]);
    expect(visiblePages(1, 10, 4)).toEqual([1, 2, 3, 4]);
    expect(visiblePages(10, 10, 4)).toEqual([7, 8, 9, 10]);
    expect(visiblePages(5, 10, 1)).toEqual([5]);
  });
});
