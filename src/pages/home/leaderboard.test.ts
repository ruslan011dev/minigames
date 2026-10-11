/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { getLeaderboard, type LeaderboardPlayer } from '../../api/leaderboard';
import { snackbar } from '../../components/snackbar/snackbar';
import { Leaderboard } from './leaderboard';

vi.mock('../../api/leaderboard', () => ({
  getLeaderboard: vi.fn(),
}));

function player(overrides: Partial<LeaderboardPlayer> = {}): LeaderboardPlayer {
  return {
    rank: 1,
    playerName: 'Ada Lovelace',
    gamesPlayed: 3,
    totalScore: 1200,
    streakDays: 2,
    favoriteGameSlug: 'cat-mail-co',
    favoriteGameName: '<b>Cat Mail</b>',
    ...overrides,
  };
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function mount(): Leaderboard {
  const board = new Leaderboard();
  document.body.append(board.render(), snackbar.render());
  return board;
}

describe('leaderboard', () => {
  afterEach(() => {
    snackbar.hide();
    document.body.replaceChildren();
    vi.clearAllMocks();
  });

  it('renders ranks, initials, scores, and streaks as text', async () => {
    vi.mocked(getLeaderboard).mockResolvedValue([
      player(),
      player({ rank: 4, playerName: 'ForestDweller', streakDays: 1, totalScore: 20 }),
      player({ rank: 5, playerName: '---' }),
    ]);
    mount();
    await vi.waitFor(() => {
      expect(document.querySelector('.leaderboard__name')).not.toBeNull();
    });

    expect(document.querySelector('.leaderboard__rank--top')?.textContent).toBe('#1');
    expect(document.querySelector('.leaderboard__row--extra')).not.toBeNull();
    expect(document.querySelector('.leaderboard__avatar')?.textContent).toBe('AL');
    expect(document.querySelectorAll('.leaderboard__avatar')[1]?.textContent).toBe('FD');
    expect(document.querySelectorAll('.leaderboard__avatar')[2]?.textContent).toBe('?');
    expect(document.querySelector('.leaderboard__chip')?.textContent).toBe('<b>Cat Mail</b>');
    expect(document.querySelector('.leaderboard__chip b')).toBeNull();
    expect(document.body.textContent).toContain('1,200');
    expect(document.body.textContent).toContain('1.2K');
    expect(document.body.textContent).toContain('🔥 2 days');
    expect(document.body.textContent).toContain('🔥 2d');
    expect(document.body.textContent).toContain('🔥 1 day');
    expect(document.body.textContent).toContain('🔥 1d');
  });

  it('warns when the leaderboard is empty', async () => {
    vi.mocked(getLeaderboard).mockResolvedValue([]);
    mount();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe(
        'No leaderboard results right now.',
      );
    });
    expect(document.querySelector('.feedback-empty__title')?.textContent).toBe('No players yet');
  });

  it('shows a load error and confirms the retry', async () => {
    vi.mocked(getLeaderboard).mockRejectedValueOnce(new ApiError('Leaderboard is down.', 503));
    mount();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe('Leaderboard is down.');
    });

    vi.mocked(getLeaderboard).mockResolvedValue([player()]);
    document.querySelector<HTMLButtonElement>('.feedback-banner__retry')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe('Leaderboard loaded.');
    });
    expect(document.querySelector('.leaderboard__rank--top')).not.toBeNull();
  });

  it('uses a generic message and ignores a destroyed request', async () => {
    vi.mocked(getLeaderboard).mockRejectedValueOnce(new Error('offline'));
    mount();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe(
        'Could not load the leaderboard.',
      );
    });

    const pending = deferred<LeaderboardPlayer[]>();
    vi.mocked(getLeaderboard).mockReturnValue(pending.promise);
    const board = new Leaderboard();
    document.body.append(board.render());
    board.destroy();
    pending.resolve([player()]);
    await Promise.resolve();
    expect(document.querySelectorAll('.leaderboard__rank--top')).toHaveLength(0);

    vi.mocked(getLeaderboard).mockRejectedValue(new DOMException('stopped', 'AbortError'));
    const again = new Leaderboard();
    document.body.append(again.render());
    again.destroy();
    await Promise.resolve();
  });
});
