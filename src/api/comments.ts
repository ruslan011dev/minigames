import { ApiError, apiGet, apiPost, isRecord } from './client';

const COMMENTS_LIMIT = 3;
export const COMMENT_TEXT_MAX = 500;

export type GameComment = {
  commentId: string;
  authorName: string;
  text: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
};

export type GameComments = {
  comments: GameComment[];
  totalComments: number;
};

export async function getGameComments(
  slug: string,
  signal?: AbortSignal,
  userEmail?: string,
): Promise<GameComments> {
  const query: Record<string, string> = {
    limit: String(COMMENTS_LIMIT),
    sort: 'newest',
  };

  if (userEmail) {
    query.userEmail = userEmail;
  }

  const body = await apiGet(`/api/games/${encodeURIComponent(slug)}/comments`, query, signal);

  if (!isRecord(body) || !Array.isArray(body.data) || !isRecord(body.meta)) {
    throw new ApiError('Unexpected response from the server.', 0);
  }

  if (typeof body.meta.totalComments !== 'number' || body.meta.totalComments < 0) {
    throw new ApiError('Unexpected response from the server.', 0);
  }

  return {
    comments: body.data.map((item) => {
      if (!isGameComment(item)) {
        throw new ApiError('Unexpected response from the server.', 0);
      }

      return item;
    }),
    totalComments: body.meta.totalComments,
  };
}

export async function postGameComment(
  slug: string,
  comment: { userEmail: string; authorName: string; text: string },
  signal?: AbortSignal,
): Promise<void> {
  const body = await apiPost(`/api/games/${encodeURIComponent(slug)}/comments`, comment, signal);

  if (!isRecord(body) || !isGameComment(body.data)) {
    throw new ApiError('Unexpected response from the server.', 0);
  }
}

function isGameComment(value: unknown): value is GameComment {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.commentId === 'string' &&
    typeof value.authorName === 'string' &&
    typeof value.text === 'string' &&
    typeof value.likesCount === 'number' &&
    typeof value.isLikedByCurrentUser === 'boolean' &&
    typeof value.createdAt === 'string'
  );
}
