import { ApiError, apiGet, isRecord } from './client';

export const LIBRARY_PAGE_SIZE = 6;

export type GameSummary = {
  slug: string;
  name: string;
  rating: number;
  likesCount: number;
  cardImage: string;
};

export type GameCard = GameSummary & {
  category: string;
  price: string;
  shortDescription: string;
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

export type LibraryGamesQuery = {
  category: string;
  sort: string;
  page: number;
};

export type LibraryGamesPage = {
  games: GameCard[];
  page: number;
  totalPages: number;
};

export async function getLibraryGames(
  query: LibraryGamesQuery,
  signal?: AbortSignal,
): Promise<LibraryGamesPage> {
  const body = await apiGet(
    '/api/games',
    {
      category: query.category,
      sort: query.sort,
      page: String(query.page),
      limit: String(LIBRARY_PAGE_SIZE),
    },
    signal,
  );

  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new ApiError('Unexpected response from the server.', 0);
  }

  return {
    games: body.data.map((item) => {
      if (!isGameCard(item)) {
        throw new ApiError('Unexpected response from the server.', 0);
      }

      return item;
    }),
    ...readPageMeta(body.meta),
  };
}

function readPageMeta(value: unknown): { page: number; totalPages: number } {
  if (!isRecord(value)) {
    return { page: 1, totalPages: 1 };
  }

  const page = typeof value.page === 'number' && value.page >= 1 ? value.page : 1;
  const totalPages =
    typeof value.totalPages === 'number' && value.totalPages >= 1 ? value.totalPages : 1;

  return { page, totalPages };
}

function isGameCard(value: unknown): value is GameCard {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.slug === 'string' &&
    typeof value.name === 'string' &&
    typeof value.category === 'string' &&
    typeof value.price === 'string' &&
    typeof value.shortDescription === 'string' &&
    typeof value.rating === 'number' &&
    typeof value.likesCount === 'number' &&
    typeof value.cardImage === 'string'
  );
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
