/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { getFeaturedGames, type GameSummary } from '../../api/games';
import { snackbar } from '../../components/snackbar/snackbar';
import { NewGames } from './new-games';

vi.mock('../../api/games', () => ({
  getFeaturedGames: vi.fn(),
}));

function game(index: number): GameSummary {
  return {
    slug: `game-${index}`,
    name: index === 0 ? '<b>Cat</b>' : `Game ${index}`,
    rating: 4.5,
    likesCount: 1200,
    cardImage: '/cards/cat.png',
  };
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function mount(): NewGames {
  const slider = new NewGames();
  document.body.append(slider.render(), snackbar.render());
  return slider;
}

async function ready(): Promise<void> {
  await vi.waitFor(() => {
    expect(document.querySelector('.new-games__name')).not.toBeNull();
  });
}

describe('new games slider', () => {
  beforeEach(() => {
    vi.mocked(getFeaturedGames).mockResolvedValue([0, 1, 2, 3, 4, 5].map(game));
  });

  afterEach(() => {
    snackbar.hide();
    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  it('centers the carousel and moves it with buttons, keys, and swipes', async () => {
    mount();
    await ready();

    const openButtons = [...document.querySelectorAll<HTMLButtonElement>('.new-games__open')];
    expect(openButtons[3]?.getAttribute('aria-current')).toBe('true');
    expect(openButtons[3]?.dataset.gameSlug).toBe('game-3');
    expect(document.querySelector('.new-games__name')?.textContent).toBe('<b>Cat</b>');
    expect(document.querySelector('.new-games__name b')).toBeNull();
    expect(document.querySelector('[aria-label="Likes 1.2K"]')).not.toBeNull();
    expect(document.querySelector('.new-games__card--far')).not.toBeNull();

    document.querySelector<HTMLButtonElement>('[aria-label="Next games"]')?.click();
    expect(openButtons[4]?.getAttribute('aria-current')).toBe('true');
    document
      .querySelector('.new-games')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }));
    expect(openButtons[3]?.getAttribute('aria-current')).toBe('true');
    document
      .querySelector('.new-games')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(openButtons[4]?.getAttribute('aria-current')).toBe('true');
    document
      .querySelector('.new-games')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    const track = document.querySelector('.new-games__track');
    track?.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 200, pointerType: 'mouse', button: 2 }),
    );
    track?.dispatchEvent(new PointerEvent('pointerup', { clientX: 10, pointerType: 'mouse' }));
    expect(openButtons[4]?.getAttribute('aria-current')).toBe('true');

    track?.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, pointerType: 'touch' }));
    track?.dispatchEvent(new PointerEvent('pointerup', { clientX: 190, pointerType: 'touch' }));
    expect(openButtons[4]?.getAttribute('aria-current')).toBe('true');

    track?.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, pointerType: 'touch' }));
    track?.dispatchEvent(new PointerEvent('pointercancel'));
    track?.dispatchEvent(new PointerEvent('pointerup', { clientX: 10, pointerType: 'touch' }));
    expect(openButtons[4]?.getAttribute('aria-current')).toBe('true');

    track?.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, pointerType: 'touch' }));
    track?.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, pointerType: 'touch' }));
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    track?.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(openButtons[5]?.getAttribute('aria-current')).toBe('true');

    document.querySelector<HTMLButtonElement>('[aria-label="Next games"]')?.click();
    expect(openButtons[0]?.getAttribute('aria-current')).toBe('true');
    document.querySelector<HTMLButtonElement>('[aria-label="Previous games"]')?.click();
    expect(openButtons[5]?.getAttribute('aria-current')).toBe('true');
  });

  it('warns when there are no featured games', async () => {
    vi.mocked(getFeaturedGames).mockResolvedValue([]);
    mount();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe(
        'No featured games right now.',
      );
    });
    expect(document.querySelector('.feedback-empty__title')?.textContent).toBe('No featured games');
    expect(document.querySelector<HTMLButtonElement>('[aria-label="Next games"]')?.disabled).toBe(
      true,
    );
  });

  it('shows a load error and confirms the retry', async () => {
    vi.mocked(getFeaturedGames).mockRejectedValueOnce(new Error('offline'));
    mount();
    await vi.waitFor(() => {
      expect(document.querySelector('.feedback-banner__text')?.textContent).toBe(
        'Could not load featured games.',
      );
    });

    vi.mocked(getFeaturedGames).mockResolvedValue([game(1)]);
    document.querySelector<HTMLButtonElement>('.feedback-banner__retry')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe('Featured games loaded.');
    });
    expect(document.querySelector('.new-games__open')?.getAttribute('aria-current')).toBe('true');
  });

  it('ignores a response that arrives after the slider is destroyed', async () => {
    const pending = deferred<GameSummary[]>();
    vi.mocked(getFeaturedGames).mockReturnValue(pending.promise);
    const slider = mount();
    slider.destroy();
    pending.resolve([game(1)]);
    await Promise.resolve();
    expect(document.querySelector('.snackbar--error')).toBeNull();
    expect(document.querySelector('.new-games__name')).toBeNull();

    vi.mocked(getFeaturedGames).mockRejectedValue(new DOMException('stopped', 'AbortError'));
    const again = new NewGames();
    document.body.append(again.render());
    again.destroy();
    await Promise.resolve();
    expect(document.querySelector('.snackbar--error')).toBeNull();
  });

  it('shows the server error text', async () => {
    vi.mocked(getFeaturedGames).mockRejectedValue(new ApiError('Featured games are down.', 503));
    mount();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe(
        'Featured games are down.',
      );
    });
  });
});
