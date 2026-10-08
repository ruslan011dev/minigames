import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './client';
import { getGameComments, postGameComment, toggleCommentLike } from './comments';

const ORIGIN = 'https://faxb76kxra.execute-api.eu-central-1.amazonaws.com';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function installFetch(handler: (url: string, init: RequestInit | undefined) => Response): void {
  vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input.toString();
    return handler(url, init);
  });
}

function comment(): Record<string, unknown> {
  return {
    commentId: 'comment-1',
    authorName: 'Ada',
    text: 'Cozy round.',
    likesCount: 1,
    isLikedByCurrentUser: false,
    createdAt: '2026-10-01T00:00:00.000Z',
  };
}

describe('comments API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the newest three comments and includes the viewer when signed in', async () => {
    const seen: string[] = [];
    installFetch((url) => {
      seen.push(url);
      return jsonResponse({ data: [comment()], meta: { totalComments: 1 } });
    });

    await expect(getGameComments('cat mail', undefined, 'a@b.co')).resolves.toEqual({
      comments: [comment()],
      totalComments: 1,
    });
    await expect(getGameComments('cat mail')).resolves.toEqual({
      comments: [comment()],
      totalComments: 1,
    });
    expect(seen[0]).toBe(
      `${ORIGIN}/api/games/cat%20mail/comments?limit=3&sort=newest&userEmail=a%40b.co`,
    );
    expect(seen[1]).toBe(`${ORIGIN}/api/games/cat%20mail/comments?limit=3&sort=newest`);
  });

  it('rejects a comments payload with a bad total, item, or envelope', async () => {
    installFetch(() => jsonResponse({ data: [comment()], meta: { totalComments: -1 } }));
    await expect(getGameComments('cat-mail-co')).rejects.toMatchObject({
      message: 'Unexpected response from the server.',
      status: 0,
    });

    installFetch(() =>
      jsonResponse({ data: [{ ...comment(), text: 4 }], meta: { totalComments: 1 } }),
    );
    await expect(getGameComments('cat-mail-co')).rejects.toBeInstanceOf(ApiError);

    installFetch(() => jsonResponse({ data: 'nope', meta: { totalComments: 0 } }));
    await expect(getGameComments('cat-mail-co')).rejects.toBeInstanceOf(ApiError);
  });

  it('posts a comment when the created comment is returned', async () => {
    let seen = '';
    let init: RequestInit | undefined;
    installFetch((url, requestInit) => {
      seen = url;
      init = requestInit;
      return jsonResponse({ data: comment() }, 201);
    });

    await expect(
      postGameComment('a/b', { userEmail: 'a@b.co', authorName: 'Ada', text: 'Cozy round.' }),
    ).resolves.toBeUndefined();
    expect(seen).toBe(`${ORIGIN}/api/games/a%2Fb/comments`);
    expect(JSON.parse(String(init?.body))).toEqual({
      userEmail: 'a@b.co',
      authorName: 'Ada',
      text: 'Cozy round.',
    });

    installFetch(() => jsonResponse({ data: null }, 201));
    await expect(
      postGameComment('cat-mail-co', { userEmail: 'a@b.co', authorName: 'Ada', text: 'Hi' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('toggles a comment like from the response and rejects a partial body', async () => {
    let seen = '';
    let init: RequestInit | undefined;
    installFetch((url, requestInit) => {
      seen = url;
      init = requestInit;
      return jsonResponse({ data: { isLikedByCurrentUser: true, likesCount: 2 } });
    });

    await expect(toggleCommentLike('id 1', 'a@b.co')).resolves.toEqual({
      isLikedByCurrentUser: true,
      likesCount: 2,
    });
    expect(seen).toBe(`${ORIGIN}/api/comments/id%201/like`);
    expect(JSON.parse(String(init?.body))).toEqual({ userEmail: 'a@b.co' });

    installFetch(() => jsonResponse({ data: { likesCount: 2 } }));
    await expect(toggleCommentLike('comment-1', 'a@b.co')).rejects.toMatchObject({
      message: 'Unexpected response from the server.',
      status: 0,
    });
  });
});
