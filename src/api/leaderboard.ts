import { ApiError, apiGet, isRecord } from './client';

export type LeaderboardPlayer = {
  rank: number;
  playerName: string;
  gamesPlayed: number;
  totalScore: number;
  streakDays: number;
  favoriteGameSlug: string;
  favoriteGameName: string;
};

export async function getLeaderboard(signal?: AbortSignal): Promise<LeaderboardPlayer[]> {
  const body = await apiGet('/api/leaderboard', undefined, signal);

  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new ApiError('Unexpected response from the server.', 0);
  }

  return body.data.map((item) => {
    if (!isLeaderboardPlayer(item)) {
      throw new ApiError('Unexpected response from the server.', 0);
    }

    return item;
  });
}

function isLeaderboardPlayer(value: unknown): value is LeaderboardPlayer {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.rank === 'number' &&
    typeof value.playerName === 'string' &&
    typeof value.gamesPlayed === 'number' &&
    typeof value.totalScore === 'number' &&
    typeof value.streakDays === 'number' &&
    typeof value.favoriteGameSlug === 'string' &&
    typeof value.favoriteGameName === 'string'
  );
}
