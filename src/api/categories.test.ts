import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './client';
import { getCategories } from './categories';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('categories API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns categories and rejects an item or envelope that does not match', async () => {
    const category = { slug: 'cozy', label: 'Cozy', isDefault: true };
    let seen = '';

    vi.stubGlobal('fetch', async (input: string | URL | Request) => {
      seen = input instanceof Request ? input.url : input.toString();
      return jsonResponse({ data: [category] });
    });

    await expect(getCategories()).resolves.toEqual([category]);
    expect(seen).toBe('https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api/categories');

    vi.stubGlobal('fetch', async () => jsonResponse({ data: ['nope'] }));
    await expect(getCategories()).rejects.toBeInstanceOf(ApiError);

    vi.stubGlobal('fetch', async () => jsonResponse({ data: null }));
    await expect(getCategories()).rejects.toMatchObject({
      message: 'Unexpected response from the server.',
      status: 0,
    });
  });
});
