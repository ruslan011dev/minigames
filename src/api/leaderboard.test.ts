import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './client';
import { getLeaderboard } from './leaderboard';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function player(): Record<string, unknown> {
  return {
    rank: 1,
    playerName: 'Ada',
    gamesPlayed: 3,
    totalScore: 40,
    streakDays: 2,
    favoriteGameSlug: 'cat-mail-co',
    favoriteGameName: 'Cat Mail Co.',
  };
}

describe('leaderboard API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns players and rejects an item or envelope that does not match', async () => {
    let seen = '';

    vi.stubGlobal('fetch', async (input: string | URL | Request) => {
      seen = input instanceof Request ? input.url : input.toString();
      return jsonResponse({ data: [player()] });
    });

    await expect(getLeaderboard()).resolves.toEqual([player()]);
    expect(seen).toBe('https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api/leaderboard');

    vi.stubGlobal('fetch', async () => jsonResponse({ data: ['nope'] }));
    await expect(getLeaderboard()).rejects.toBeInstanceOf(ApiError);

    vi.stubGlobal('fetch', async () => jsonResponse(null));
    await expect(getLeaderboard()).rejects.toMatchObject({
      message: 'Unexpected response from the server.',
      status: 0,
    });
  });
});
