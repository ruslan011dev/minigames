/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { getGameComments, postGameComment, toggleCommentLike } from '../../api/comments';
import { getGame, toggleGameFavorite, type GameDetails } from '../../api/games';
import type { AppSession } from '../../session/app-session';
import { snackbar } from '../snackbar/snackbar';
import { GameDetailsDialog } from './game-details';

vi.mock('../../api/games', () => ({
  getGame: vi.fn(),
  toggleGameFavorite: vi.fn(),
}));

vi.mock('../../api/comments', async () => {
  const actual = await vi.importActual<typeof import('../../api/comments')>('../../api/comments');
  return {
    ...actual,
    getGameComments: vi.fn(),
    postGameComment: vi.fn(),
    toggleCommentLike: vi.fn(),
  };
});

function session(displayName = 'Ada', email = 'ada@example.com'): AppSession {
  return { displayName, email, authenticatedAt: 1_000 };
}

function game(overrides: Partial<GameDetails> = {}): GameDetails {
  return {
    slug: 'cat-mail-co',
    name: 'Cat Mail Co.',
    heroImage: '/heroes/cat.png',
    rating: 4.5,
    likesCount: 12,
    isLikedByCurrentUser: false,
    fullDescription: '<b>A cozy route.</b>',
    specs: { genre: 'Cozy', players: '1', duration: '10 min', price: 'Free' },
    topRecords: [
      { position: 1, playerName: 'Ada', score: 1200, achievedAt: '2026-06-14T12:00:00.000Z' },
      { position: 2, playerName: 'Bea', score: 900, achievedAt: '2026-06-13T12:00:00.000Z' },
      { position: 3, playerName: 'Cid', score: 800, achievedAt: '2026-06-12T12:00:00.000Z' },
      { position: 4, playerName: 'Dee', score: 700, achievedAt: '2026-06-11T12:00:00.000Z' },
    ],
    ...overrides,
  };
}

function commentList(
  text = 'Cozy round.',
  authorName = 'Rina',
): { comments: ReturnType<typeof oneComment>[]; totalComments: number } {
  return { comments: [oneComment(text, authorName)], totalComments: 1 };
}

function oneComment(text = 'Cozy round.', authorName = 'Rina') {
  return {
    commentId: 'comment-1',
    authorName,
    text,
    likesCount: 1,
    isLikedByCurrentUser: false,
    createdAt: '2026-06-14T12:00:00.000Z',
  };
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function field(): HTMLTextAreaElement {
  const element = document.querySelector('textarea');
  if (!(element instanceof HTMLTextAreaElement)) {
    throw new Error('Missing comment field');
  }
  return element;
}

function typeComment(value: string): void {
  const input = field();
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function mount(
  handlers: {
    onDismiss?: () => void;
    onRequestFavorite?: () => AppSession | null;
    onRequestComment?: () => AppSession | null;
    onRequestLike?: () => AppSession | null;
  } = {},
): GameDetailsDialog {
  const dialog = new GameDetailsDialog(
    handlers.onDismiss,
    handlers.onRequestFavorite,
    handlers.onRequestComment,
    handlers.onRequestLike,
  );
  document.body.append(dialog.render(), snackbar.render());
  return dialog;
}

async function shown(): Promise<void> {
  await vi.waitFor(() => {
    expect(document.querySelector('.details__title')).not.toBeNull();
  });
}

describe('game details dialog', () => {
  beforeEach(() => {
    vi.mocked(getGame).mockResolvedValue(game());
    vi.mocked(getGameComments).mockResolvedValue(commentList());
    vi.mocked(toggleGameFavorite).mockResolvedValue({ isFavorited: true, likesCount: 13 });
    vi.mocked(postGameComment).mockResolvedValue();
    vi.mocked(toggleCommentLike).mockResolvedValue({
      isLikedByCurrentUser: true,
      likesCount: 2,
    });
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    snackbar.hide();
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('renders the loaded game, records, and a guest composer', async () => {
    const dialog = mount();
    dialog.open('cat-mail-co');
    await shown();

    expect(getGame).toHaveBeenCalledWith('cat-mail-co', expect.any(AbortSignal), undefined);
    expect(getGameComments).toHaveBeenCalledWith('cat-mail-co', expect.any(AbortSignal), undefined);
    expect(document.querySelector('.details__title')?.textContent).toBe('Cat Mail Co.');
    expect(document.querySelector('.details__description')?.textContent).toBe(
      '<b>A cozy route.</b>',
    );
    expect(document.querySelector('.details__description b')).toBeNull();
    expect(document.querySelector('.details__image')?.getAttribute('src')).toBe('/heroes/cat.png');
    expect(document.querySelector('[aria-label="Rating 4.5"]')).not.toBeNull();
    expect(document.querySelector('[aria-label="Likes 12"]')).not.toBeNull();
    expect(document.querySelector('.details__play')?.textContent).toBe('Play Now');
    expect(document.querySelector('.details__favorite')?.getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(document.querySelector('.details__spec dd')?.textContent).toBe('Cozy');
    expect(document.querySelector('.details__points')?.textContent).toBe('1,200 pts');
    expect(document.querySelectorAll('.details__record [aria-hidden="true"]')[3]?.textContent).toBe(
      '',
    );
    expect(document.querySelector('.details__comment-text')?.textContent).toBe('Cozy round.');
    expect(document.querySelector('.details__comment-text b')).toBeNull();
    expect(document.querySelector('.details__avatar--comment')?.textContent).toBe('R');
    expect(document.querySelector('.details__avatar--tone-1')).not.toBeNull();
    expect(field().disabled).toBe(true);
    expect(document.querySelector('.details__composer .details__avatar')?.textContent).toBe('');
    expect(document.getElementById('details-comments-title')?.textContent).toBe('Comments (1)');

    vi.mocked(getGame).mockClear();
    dialog.open('cat-mail-co');
    expect(getGame).not.toHaveBeenCalled();
  });

  it('shows an empty records list and restores a comment draft for the same game', async () => {
    vi.mocked(getGame).mockResolvedValue(game({ topRecords: [] }));
    const dialog = mount({
      onRequestComment: () => session('Forest'),
    });
    dialog.open('cat-mail-co', 'ada@example.com', 'Forest');
    await shown();

    expect(document.querySelector('.feedback-empty__title')?.textContent).toBe('No records yet');
    expect(document.querySelector('.details__composer .details__avatar')?.textContent).toBe('F');
    expect(field().disabled).toBe(false);
    typeComment('Keep this draft');
    dialog.close();

    dialog.open('cat-mail-co', 'ada@example.com', 'Forest');
    await shown();
    expect(field().value).toBe('Keep this draft');
  });

  it('shows a load error and recovers when the game is requested again', async () => {
    vi.mocked(getGame).mockRejectedValueOnce(new Error('offline'));
    const dialog = mount();
    dialog.open('cat-mail-co');
    await vi.waitFor(() => {
      expect(document.querySelector('.feedback-banner__text')?.textContent).toBe(
        'Could not load game.',
      );
    });
    expect(document.querySelector('.snackbar--error')).not.toBeNull();

    vi.mocked(getGame).mockResolvedValue(game());
    document.querySelector<HTMLButtonElement>('.feedback-banner__retry')?.click();
    await shown();
    expect(document.querySelector('.snackbar__text')?.textContent).toBe('Game loaded.');
  });

  it('shows the server message when comments fail and confirms a later load', async () => {
    vi.mocked(getGameComments).mockRejectedValueOnce(new ApiError('Comments are down.', 503));
    const dialog = mount();
    dialog.open('cat-mail-co');
    await vi.waitFor(() => {
      expect(
        document.querySelector('.details__comment-panel .feedback-banner__text')?.textContent,
      ).toBe('Comments are down.');
    });

    vi.mocked(getGameComments).mockResolvedValue(commentList());
    document
      .querySelector<HTMLButtonElement>('.details__comment-panel .feedback-banner__retry')
      ?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe('Comments loaded.');
    });
    expect(document.querySelector('.details__comment-text')?.textContent).toBe('Cozy round.');
  });

  it('warns when a game has no comments and ignores an aborted load', async () => {
    vi.mocked(getGameComments).mockResolvedValue({ comments: [], totalComments: 0 });
    const dialog = mount();
    dialog.open('cat-mail-co');
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe(
        'No comments for this game right now.',
      );
    });
    expect(document.querySelector('.feedback-empty__title')?.textContent).toBe('No comments yet');

    const pending = deferred<GameDetails>();
    vi.mocked(getGame).mockReturnValue(pending.promise);
    vi.mocked(getGameComments).mockRejectedValue(new DOMException('stopped', 'AbortError'));
    dialog.open('other-game');
    dialog.close();
    pending.resolve(game({ name: 'Other' }));
    await Promise.resolve();
    expect(document.querySelector('.snackbar--error')).toBeNull();
  });

  it('toggles a favorite from the response and blocks a second click while saving', async () => {
    const pending = deferred<{ isFavorited: boolean; likesCount: number }>();
    vi.mocked(toggleGameFavorite).mockReturnValue(pending.promise);
    const dialog = mount({ onRequestFavorite: () => session() });
    dialog.open('cat-mail-co', 'ada@example.com', 'Ada');
    await shown();

    const button = document.querySelector<HTMLButtonElement>('.details__favorite');
    button?.click();
    button?.click();
    expect(toggleGameFavorite).toHaveBeenCalledTimes(1);
    expect(toggleGameFavorite).toHaveBeenCalledWith(
      'cat-mail-co',
      'ada@example.com',
      expect.any(AbortSignal),
    );
    expect(button?.textContent).toContain('Saving...');
    expect(button?.disabled).toBe(true);

    pending.resolve({ isFavorited: true, likesCount: 38200 });
    await vi.waitFor(() => {
      expect(button?.getAttribute('aria-pressed')).toBe('true');
    });
    expect(button?.getAttribute('aria-label')).toBe('Remove from Favorites');
    expect(document.querySelector('[aria-label="Likes 38.2K"]')).not.toBeNull();
  });

  it('leaves favorites unchanged when the viewer is signed out or the update fails', async () => {
    const dialog = mount();
    dialog.open('cat-mail-co');
    await shown();
    document.querySelector<HTMLButtonElement>('.details__favorite')?.click();
    expect(toggleGameFavorite).not.toHaveBeenCalled();

    dialog.close();
    snackbar.hide();
    document.body.replaceChildren();
    const signedIn = mount({ onRequestFavorite: () => session() });
    vi.mocked(toggleGameFavorite).mockRejectedValue(new ApiError('network', 0));
    signedIn.open('cat-mail-co', 'ada@example.com', 'Ada');
    await shown();
    document.querySelector<HTMLButtonElement>('.details__favorite')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe(
        'Could not confirm the favorite update.',
      );
    });
    expect(document.querySelector('.details__favorite')?.getAttribute('aria-pressed')).toBe(
      'false',
    );

    vi.mocked(toggleGameFavorite).mockRejectedValue(new ApiError('Favorite failed.', 409));
    document.querySelector<HTMLButtonElement>('.details__favorite')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe('Favorite failed.');
    });
    expect(document.querySelector('.snackbar--error')).not.toBeNull();

    vi.mocked(toggleGameFavorite).mockRejectedValue(new Error('offline'));
    document.querySelector<HTMLButtonElement>('.details__favorite')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe(
        'Could not update favorites.',
      );
    });
  });

  it('rejects an empty or oversized comment and posts a trimmed one', async () => {
    const viewer = session('A');
    const dialog = mount({ onRequestComment: () => viewer });
    dialog.open('cat-mail-co', 'ada@example.com', 'Ada');
    await shown();

    typeComment('   ');
    document.querySelector<HTMLButtonElement>('.details__send')?.click();
    expect(postGameComment).not.toHaveBeenCalled();
    expect(document.querySelector('.snackbar__text')?.textContent).toBe(
      'Write a comment before sending.',
    );
    expect(field().value).toBe('   ');

    typeComment('a'.repeat(501));
    field().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
    expect(postGameComment).not.toHaveBeenCalled();
    field().form?.requestSubmit();
    expect(document.querySelector('.snackbar__text')?.textContent).toBe(
      'A comment can be at most 500 characters.',
    );

    typeComment('  Cozy round.  ');
    field().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe('Comment posted.');
    });
    expect(postGameComment).toHaveBeenCalledWith(
      'cat-mail-co',
      { userEmail: 'ada@example.com', authorName: 'ada', text: 'Cozy round.' },
      expect.any(AbortSignal),
    );
    expect(field().value).toBe('');
    expect(getGameComments).toHaveBeenCalledTimes(2);
  });

  it('does not post a comment without a session and reports a failed post', async () => {
    const dialog = mount();
    dialog.open('cat-mail-co', 'ada@example.com', 'Ada');
    await shown();
    typeComment('Hello');
    field().form?.requestSubmit();
    expect(postGameComment).not.toHaveBeenCalled();

    dialog.close();
    snackbar.hide();
    document.body.replaceChildren();
    const signedIn = mount({ onRequestComment: () => session() });
    vi.mocked(postGameComment).mockRejectedValue(new ApiError('network', 0));
    signedIn.open('cat-mail-co', 'ada@example.com', 'Ada');
    await shown();
    typeComment('Hello');
    document.querySelector<HTMLButtonElement>('.details__send')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe(
        'Could not confirm the comment was posted.',
      );
    });
    expect(field().value).toBe('Hello');

    vi.mocked(postGameComment).mockRejectedValue(new Error('offline'));
    document.querySelector<HTMLButtonElement>('.details__send')?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe(
        'Could not post the comment.',
      );
    });
  });

  it('likes a comment from the response and restores the previous count on failure', async () => {
    const pending = deferred<{ isLikedByCurrentUser: boolean; likesCount: number }>();
    vi.mocked(toggleCommentLike).mockReturnValueOnce(pending.promise);
    const dialog = mount({ onRequestLike: () => session() });
    dialog.open('cat-mail-co', 'ada@example.com', 'Ada');
    await shown();

    const button = document.querySelector<HTMLButtonElement>('.details__like');
    button?.click();
    button?.click();
    expect(toggleCommentLike).toHaveBeenCalledTimes(1);
    expect(toggleCommentLike).toHaveBeenCalledWith('comment-1', 'ada@example.com');
    expect(button?.querySelector('.details__like-count')?.textContent).toBe('...');
    expect(button?.disabled).toBe(true);

    pending.resolve({ isLikedByCurrentUser: true, likesCount: 2 });
    await vi.waitFor(() => {
      expect(button?.getAttribute('aria-pressed')).toBe('true');
    });
    expect(button?.querySelector('.details__like-count')?.textContent).toBe('2');

    vi.mocked(toggleCommentLike).mockRejectedValue(new ApiError('network', 0));
    button?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe(
        'Could not confirm the like update.',
      );
    });
    expect(button?.getAttribute('aria-pressed')).toBe('true');
    expect(button?.querySelector('.details__like-count')?.textContent).toBe('2');

    vi.mocked(toggleCommentLike).mockRejectedValue(new Error('offline'));
    button?.click();
    await vi.waitFor(() => {
      expect(document.querySelector('.snackbar__text')?.textContent).toBe(
        'Could not update the like.',
      );
    });
    expect(button?.querySelector('.details__like-count')?.textContent).toBe('2');
  });

  it('does not like a comment without a session', async () => {
    const dialog = mount();
    dialog.open('cat-mail-co');
    await shown();
    document.querySelector<HTMLButtonElement>('.details__like')?.click();
    expect(toggleCommentLike).not.toHaveBeenCalled();
    expect(document.querySelector('.details__like')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('closes from the backdrop and Escape, and ignores dismiss without a user close', async () => {
    const onDismiss = vi.fn();
    const dialog = mount({ onDismiss });
    dialog.close();
    dialog.dismiss();
    expect(onDismiss).not.toHaveBeenCalled();

    dialog.open('cat-mail-co');
    await shown();
    document
      .querySelector('.details__title')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onDismiss).not.toHaveBeenCalled();

    document.querySelector('dialog')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onDismiss).toHaveBeenCalledOnce();

    dialog.open('cat-mail-co');
    await shown();
    document.querySelector<HTMLButtonElement>('.details__close')?.click();
    expect(onDismiss).toHaveBeenCalledTimes(2);

    dialog.open('cat-mail-co');
    await shown();
    const cancel = new Event('cancel', { cancelable: true });
    document.querySelector('dialog')?.dispatchEvent(cancel);
    document.querySelector('dialog')?.close();
    expect(onDismiss).toHaveBeenCalledTimes(3);

    dialog.open('cat-mail-co');
    await shown();
    dialog.dismiss();
    expect(onDismiss).toHaveBeenCalledTimes(3);
    expect(document.querySelector('dialog')?.open).toBe(false);
  });

  it('reuses an avatar color for the same author', async () => {
    const random = vi.spyOn(Math, 'random');
    random.mockReset();
    random.mockReturnValueOnce(0);
    random.mockReturnValueOnce(0.5);
    vi.mocked(getGameComments).mockResolvedValue({
      comments: [
        oneComment('One', 'Rina'),
        { ...oneComment('Two', 'Rina'), commentId: 'comment-2' },
        { ...oneComment('Three', 'Bea'), commentId: 'comment-3' },
      ],
      totalComments: 3,
    });
    const dialog = mount();
    dialog.open('cat-mail-co');
    await shown();

    const avatars = [...document.querySelectorAll('.details__avatar--comment')];
    expect(avatars.map((avatar) => avatar.textContent)).toEqual(['R', 'R', 'B']);
    expect(avatars[0]?.className).toBe(avatars[1]?.className);
    expect(avatars[0]?.className).not.toBe(avatars[2]?.className);
  });

  it('ignores an aborted game load', async () => {
    vi.mocked(getGame).mockRejectedValue(new DOMException('stopped', 'AbortError'));
    vi.mocked(getGameComments).mockRejectedValue(new DOMException('stopped', 'AbortError'));
    const dialog = mount();
    dialog.open('cat-mail-co');
    await Promise.resolve();
    expect(document.querySelector('.feedback-banner')).toBeNull();
    expect(document.querySelector('.snackbar')).toBeNull();
  });

  it('drops a favorite update that is aborted or finishes after the dialog closes', async () => {
    const pending = deferred<{ isFavorited: boolean; likesCount: number }>();
    vi.mocked(toggleGameFavorite).mockReturnValueOnce(pending.promise);
    const dialog = mount({ onRequestFavorite: () => session() });
    dialog.open('cat-mail-co', 'ada@example.com', 'Ada');
    await shown();
    const button = document.querySelector<HTMLButtonElement>('.details__favorite');
    button?.click();
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(toggleGameFavorite).toHaveBeenCalledTimes(1);
    dialog.close();
    pending.resolve({ isFavorited: true, likesCount: 99 });
    await Promise.resolve();
    expect(document.querySelector('.snackbar--error')).toBeNull();

    vi.mocked(toggleGameFavorite).mockRejectedValue(new DOMException('stopped', 'AbortError'));
    dialog.open('cat-mail-co', 'ada@example.com', 'Ada');
    await shown();
    document.querySelector<HTMLButtonElement>('.details__favorite')?.click();
    await Promise.resolve();
    expect(document.querySelector('.snackbar')).toBeNull();
  });

  it('drops a comment post that is aborted or finishes after the dialog closes', async () => {
    const pending = deferred<void>();
    vi.mocked(postGameComment).mockReturnValueOnce(pending.promise);
    const dialog = mount({ onRequestComment: () => session() });
    dialog.open('cat-mail-co', 'ada@example.com', 'Ada');
    await shown();
    typeComment('Hello');
    field().form?.requestSubmit();
    field().form?.requestSubmit();
    expect(postGameComment).toHaveBeenCalledTimes(1);
    dialog.close();
    pending.resolve();
    await Promise.resolve();
    expect(document.querySelector('.snackbar__text')?.textContent).not.toBe('Comment posted.');

    vi.mocked(postGameComment).mockRejectedValue(new DOMException('stopped', 'AbortError'));
    dialog.open('cat-mail-co', 'ada@example.com', 'Ada');
    await shown();
    typeComment('Hello');
    field().form?.requestSubmit();
    await Promise.resolve();
    expect(document.querySelector('.snackbar--error')).toBeNull();
  });

  it('drops a like that is aborted, repeated, or finishes after the dialog closes', async () => {
    const pending = deferred<{ isLikedByCurrentUser: boolean; likesCount: number }>();
    vi.mocked(toggleCommentLike).mockReturnValueOnce(pending.promise);
    const dialog = mount({
      onRequestLike: () => session(),
      onRequestComment: () => session(),
    });
    dialog.open('cat-mail-co', 'ada@example.com', 'Ada');
    await shown();
    const button = document.querySelector<HTMLButtonElement>('.details__like');
    button?.click();
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(toggleCommentLike).toHaveBeenCalledTimes(1);

    vi.mocked(postGameComment).mockResolvedValue();
    typeComment('Hello');
    field().form?.requestSubmit();
    await vi.waitFor(() => {
      expect(document.querySelector('.details__like-count')?.textContent).toBe('...');
    });

    dialog.close();
    pending.resolve({ isLikedByCurrentUser: true, likesCount: 9 });
    await Promise.resolve();

    vi.mocked(toggleCommentLike).mockRejectedValue(new DOMException('stopped', 'AbortError'));
    dialog.open('cat-mail-co', 'ada@example.com', 'Ada');
    await shown();
    const again = document.querySelector<HTMLButtonElement>('.details__like');
    vi.mocked(toggleCommentLike).mockClear();
    again?.removeAttribute('data-comment-id');
    again?.click();
    expect(toggleCommentLike).not.toHaveBeenCalled();
    if (again) {
      again.dataset.commentId = 'comment-1';
    }
    again?.click();
    await Promise.resolve();
    expect(document.querySelector('.snackbar--error')).toBeNull();
  });

  it('ignores a comment response that arrives after another game is opened', async () => {
    const firstComments = deferred<{
      comments: ReturnType<typeof oneComment>[];
      totalComments: number;
    }>();
    vi.mocked(getGameComments)
      .mockReturnValueOnce(firstComments.promise)
      .mockResolvedValue(commentList('Second game', 'Bea'));
    const dialog = mount();
    dialog.open('first-game');
    dialog.open('second-game');
    firstComments.resolve(commentList('Late', 'Rina'));
    await shown();

    expect(document.querySelector('.details__comment-text')?.textContent).toBe('Second game');
  });
});
