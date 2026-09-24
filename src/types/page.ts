export interface Page {
  render(): HTMLElement;
  destroy?: () => void;
}
