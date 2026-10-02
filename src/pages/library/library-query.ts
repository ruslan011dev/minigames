export const DEFAULT_LIBRARY_CATEGORY = 'all';
export const DEFAULT_LIBRARY_SORT = 'rating-desc';

export const LIBRARY_SORTS = ['rating-asc', 'rating-desc', 'name-asc', 'name-desc'] as const;

export type LibrarySort = (typeof LIBRARY_SORTS)[number];

export function isLibrarySort(value: string): value is LibrarySort {
  return LIBRARY_SORTS.some((item) => item === value);
}
