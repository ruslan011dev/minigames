export type PageId = 'home' | 'library';

export interface Page {
  render(): HTMLElement;
  destroy?: () => void;
}

export function isPageId(value: string | undefined): value is PageId {
  return value === 'home' || value === 'library';
}
