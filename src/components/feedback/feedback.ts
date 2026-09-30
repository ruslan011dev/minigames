export function createErrorBanner(message: string, onRetry: () => void): HTMLElement {
  const banner = document.createElement('div');
  banner.className = 'feedback-banner';
  banner.setAttribute('role', 'alert');

  const text = document.createElement('p');
  text.className = 'feedback-banner__text';
  text.textContent = message;

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'feedback-banner__retry';
  retry.textContent = 'Try again';
  retry.addEventListener('click', onRetry);

  banner.append(text, retry);

  return banner;
}

export function createEmptyState(title: string, text: string): HTMLElement {
  const empty = document.createElement('div');
  empty.className = 'feedback-empty';
  empty.setAttribute('role', 'status');

  const heading = document.createElement('p');
  heading.className = 'feedback-empty__title';
  heading.textContent = title;

  const detail = document.createElement('p');
  detail.className = 'feedback-empty__text';
  detail.textContent = text;

  empty.append(heading, detail);

  return empty;
}
