import { ApiError, apiGet, apiPost, isRecord } from './client';

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

export type GameRecord = {
  position: number;
  playerName: string;
  score: number;
  achievedAt: string;
};

export type GameSpecs = {
  genre: string;
  players: string;
  duration: string;
  price: string;
};

export type GameDetails = {
  slug: string;
  name: string;
  heroImage: string;
  rating: number;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  fullDescription: string;
  specs: GameSpecs;
  topRecords: GameRecord[];
};

export async function getGame(
  slug: string,
  signal?: AbortSignal,
  userEmail?: string,
): Promise<GameDetails> {
  const query = userEmail ? { userEmail } : undefined;
  const body = await apiGet(`/api/games/${encodeURIComponent(slug)}`, query, signal);

  if (!isRecord(body) || !isGameDetails(body.data)) {
    throw new ApiError('Unexpected response from the server.', 0);
  }

  return body.data;
}

export type FavoriteUpdate = {
  isFavorited: boolean;
  likesCount: number;
};

export async function toggleGameFavorite(
  slug: string,
  userEmail: string,
  signal?: AbortSignal,
): Promise<FavoriteUpdate> {
  const body = await apiPost(
    `/api/games/${encodeURIComponent(slug)}/favorite`,
    { userEmail },
    signal,
  );

  if (!isRecord(body) || !isFavoriteUpdate(body.data)) {
    throw new ApiError('Unexpected response from the server.', 0);
  }

  return body.data;
}

function isFavoriteUpdate(value: unknown): value is FavoriteUpdate {
  return (
    isRecord(value) &&
    typeof value.isFavorited === 'boolean' &&
    typeof value.likesCount === 'number'
  );
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

function isGameDetails(value: unknown): value is GameDetails {
  if (!isRecord(value) || !isGameSpecs(value.specs) || !Array.isArray(value.topRecords)) {
    return false;
  }

  return (
    typeof value.slug === 'string' &&
    typeof value.name === 'string' &&
    typeof value.heroImage === 'string' &&
    typeof value.rating === 'number' &&
    typeof value.likesCount === 'number' &&
    typeof value.isLikedByCurrentUser === 'boolean' &&
    typeof value.fullDescription === 'string' &&
    value.topRecords.every((item) => isGameRecord(item))
  );
}

function isGameSpecs(value: unknown): value is GameSpecs {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.genre === 'string' &&
    typeof value.players === 'string' &&
    typeof value.duration === 'string' &&
    typeof value.price === 'string'
  );
}

function isGameRecord(value: unknown): value is GameRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.position === 'number' &&
    typeof value.playerName === 'string' &&
    typeof value.score === 'number' &&
    typeof value.achievedAt === 'string'
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
