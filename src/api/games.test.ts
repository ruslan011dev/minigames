import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './client';
import {
  getFeaturedGames,
  getGame,
  getLibraryGames,
  LIBRARY_PAGE_SIZE,
  toggleGameFavorite,
} from './games';

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

function summary(): Record<string, unknown> {
  return {
    slug: 'cat-mail-co',
    name: 'Cat Mail Co.',
    rating: 4.5,
    likesCount: 12,
    cardImage: '/cards/cat.png',
  };
}

function card(): Record<string, unknown> {
  return {
    ...summary(),
    category: 'cozy',
    price: 'Free',
    shortDescription: 'Deliver the mail.',
  };
}

function details(topRecords: unknown[] = [record()]): Record<string, unknown> {
  return {
    slug: 'cat-mail-co',
    name: 'Cat Mail Co.',
    heroImage: '/heroes/cat.png',
    rating: 4.5,
    likesCount: 12,
    isLikedByCurrentUser: false,
    fullDescription: 'A cozy route.',
    specs: { genre: 'Cozy', players: '1', duration: '10 min', price: 'Free' },
    topRecords,
  };
}

function record(): Record<string, unknown> {
  return { position: 1, playerName: 'Ada', score: 20, achievedAt: '2026-10-01T00:00:00.000Z' };
}

describe('games API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads featured games and rejects a response that is not a list of games', async () => {
    let seen = '';
    installFetch((url) => {
      seen = url;
      return jsonResponse({ data: [summary()] });
    });

    await expect(getFeaturedGames()).resolves.toEqual([summary()]);
    expect(seen).toBe(`${ORIGIN}/api/games?featured=true`);

    installFetch(() => jsonResponse({ data: [summary(), 'nope'] }));
    await expect(getFeaturedGames()).rejects.toBeInstanceOf(ApiError);

    installFetch(() => jsonResponse(null));
    await expect(getFeaturedGames()).rejects.toMatchObject({
      message: 'Unexpected response from the server.',
      status: 0,
    });
  });

  it('requests one library page and falls back when page metadata is missing', async () => {
    let seen = '';
    installFetch((url) => {
      seen = url;
      return jsonResponse({ data: [card()], meta: { page: 2, totalPages: 4 } });
    });

    await expect(
      getLibraryGames({ category: 'cozy', sort: 'rating-desc', page: 2 }),
    ).resolves.toEqual({
      games: [card()],
      page: 2,
      totalPages: 4,
    });
    expect(seen).toBe(
      `${ORIGIN}/api/games?category=cozy&sort=rating-desc&page=2&limit=${LIBRARY_PAGE_SIZE}`,
    );

    installFetch(() => jsonResponse({ data: [card()], meta: { page: 0, totalPages: 'many' } }));
    await expect(getLibraryGames({ category: 'all', sort: 'name-asc', page: 1 })).resolves.toEqual({
      games: [card()],
      page: 1,
      totalPages: 1,
    });

    installFetch(() => jsonResponse({ data: [card()] }));
    await expect(
      getLibraryGames({ category: 'all', sort: 'name-asc', page: 1 }),
    ).resolves.toMatchObject({
      page: 1,
      totalPages: 1,
    });

    installFetch(() => jsonResponse({ data: ['nope'] }));
    await expect(
      getLibraryGames({ category: 'all', sort: 'name-asc', page: 1 }),
    ).rejects.toBeInstanceOf(ApiError);

    installFetch(() => jsonResponse({ data: null }));
    await expect(
      getLibraryGames({ category: 'all', sort: 'name-asc', page: 1 }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('loads one game and adds the viewer email only when it is present', async () => {
    const signal = new AbortController().signal;
    const seen: string[] = [];
    installFetch((url) => {
      seen.push(url);
      return jsonResponse({ data: details() });
    });

    await expect(getGame('cat mail', signal, 'a@b.co')).resolves.toEqual(details());
    await expect(getGame('cat mail', signal, '')).resolves.toEqual(details());
    expect(seen[0]).toBe(`${ORIGIN}/api/games/cat%20mail?userEmail=a%40b.co`);
    expect(seen[1]).toBe(`${ORIGIN}/api/games/cat%20mail`);

    installFetch(() => jsonResponse({ data: { ...details(), specs: null } }));
    await expect(getGame('cat-mail-co')).rejects.toBeInstanceOf(ApiError);

    installFetch(() =>
      jsonResponse({
        data: { ...details([{ position: '1', playerName: 'Ada', score: 1, achievedAt: 'today' }]) },
      }),
    );
    await expect(getGame('cat-mail-co')).rejects.toBeInstanceOf(ApiError);

    installFetch(() => jsonResponse({ data: { ...details(['nope']) } }));
    await expect(getGame('cat-mail-co')).rejects.toBeInstanceOf(ApiError);
  });

  it('toggles a favorite from the response and rejects an unexpected body', async () => {
    let seen = '';
    let init: RequestInit | undefined;
    installFetch((url, requestInit) => {
      seen = url;
      init = requestInit;
      return jsonResponse({ data: { isFavorited: true, likesCount: 13 } });
    });

    await expect(toggleGameFavorite('a/b', 'a@b.co')).resolves.toEqual({
      isFavorited: true,
      likesCount: 13,
    });
    expect(seen).toBe(`${ORIGIN}/api/games/a%2Fb/favorite`);
    expect(JSON.parse(String(init?.body))).toEqual({ userEmail: 'a@b.co' });

    installFetch(() => jsonResponse({ data: { isFavorited: true } }));
    await expect(toggleGameFavorite('cat-mail-co', 'a@b.co')).rejects.toMatchObject({
      message: 'Unexpected response from the server.',
      status: 0,
    });
  });
});
