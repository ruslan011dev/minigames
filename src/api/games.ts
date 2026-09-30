import { ApiError, apiGet, isRecord } from './client';

export type GameSummary = {
  slug: string;
  name: string;
  rating: number;
  likesCount: number;
  cardImage: string;
};

export async function getFeaturedGames(signal?: AbortSignal): Promise<GameSummary[]> {
  const body = await apiGet('/api/games', { featured: 'true' }, signal);

  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new ApiError('Unexpected response from the server.', 0);
  }

  return body.data.map((item) => {
    if (!isGameSummary(item)) {
      throw new ApiError('Unexpected response from the server.', 0);
    }

    return item;
  });
}

function isGameSummary(value: unknown): value is GameSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.slug === 'string' &&
    typeof value.name === 'string' &&
    typeof value.rating === 'number' &&
    typeof value.likesCount === 'number' &&
    typeof value.cardImage === 'string'
  );
}
