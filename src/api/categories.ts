import { ApiError, apiGet, isRecord } from './client';

export type Category = {
  slug: string;
  label: string;
  isDefault: boolean;
};

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const body = await apiGet('/api/categories', undefined, signal);

  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new ApiError('Unexpected response from the server.', 0);
  }

  return body.data.map((item) => {
    if (!isCategory(item)) {
      throw new ApiError('Unexpected response from the server.', 0);
    }

    return item;
  });
}

function isCategory(value: unknown): value is Category {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.slug === 'string' &&
    typeof value.label === 'string' &&
    typeof value.isDefault === 'boolean'
  );
}
