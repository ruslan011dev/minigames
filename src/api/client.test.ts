import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiGet, apiPost, isAbortError, isRecord } from './client';

const ORIGIN = 'https://faxb76kxra.execute-api.eu-central-1.amazonaws.com';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function installFetch(
  handler: (url: string, init: RequestInit | undefined) => Response | Promise<Response>,
): void {
  vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input.toString();
    return handler(url, init);
  });
}

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('recognizes records and abort errors', () => {
    expect(isRecord({ ok: true })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('game')).toBe(false);
    expect(isAbortError(new DOMException('stopped', 'AbortError'))).toBe(true);
    expect(isAbortError(new DOMException('missing', 'NotFoundError'))).toBe(false);
    expect(isAbortError(new Error('stopped'))).toBe(false);
  });

  it('sends a GET with the query string and returns the parsed body', async () => {
    const signal = new AbortController().signal;
    let seen = '';
    let init: RequestInit | undefined;

    installFetch((url, requestInit) => {
      seen = url;
      init = requestInit;
      return jsonResponse({ data: [] });
    });

    await expect(
      apiGet('/api/games', { featured: 'true', userEmail: 'a@b.co' }, signal),
    ).resolves.toEqual({
      data: [],
    });
    expect(seen).toBe(`${ORIGIN}/api/games?featured=true&userEmail=a%40b.co`);
    expect(init?.headers).toEqual({ Accept: 'application/json' });
    expect(init?.signal).toBe(signal);
    expect(init?.method).toBeUndefined();
  });

  it('sends a JSON POST to the path without a query', async () => {
    let seen = '';
    let init: RequestInit | undefined;

    installFetch((url, requestInit) => {
      seen = url;
      init = requestInit;
      return jsonResponse({ data: { ok: true } });
    });

    await expect(apiPost('/api/games/cat/favorite', { userEmail: 'a@b.co' })).resolves.toEqual({
      data: { ok: true },
    });
    expect(seen).toBe(`${ORIGIN}/api/games/cat/favorite`);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(init?.body))).toEqual({ userEmail: 'a@b.co' });
  });

  it('rethrows an abort and wraps other network failures', async () => {
    const abort = new DOMException('stopped', 'AbortError');
    const network = {
      name: 'ApiError',
      message: 'Network error. Check your connection and try again.',
      status: 0,
    };

    installFetch(() => {
      throw abort;
    });
    await expect(apiGet('/api/games')).rejects.toBe(abort);
    await expect(apiPost('/api/games', {})).rejects.toBe(abort);

    installFetch(() => {
      throw new TypeError('offline');
    });
    await expect(apiGet('/api/games')).rejects.toMatchObject(network);
    await expect(apiPost('/api/games', {})).rejects.toMatchObject(network);
  });

  it('uses the server error text when the failed response includes one', async () => {
    installFetch(() => jsonResponse({ error: 'Missing game.' }, 404));

    const error = await apiGet('/api/games/missing').then(
      () => null,
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: 'Missing game.', status: 404 });
  });

  it('falls back when a failed response has no usable error text', async () => {
    installFetch(() => jsonResponse({ error: '' }, 400));
    await expect(apiGet('/api/games')).rejects.toMatchObject({
      message: 'Request failed (400)',
      status: 400,
    });

    installFetch(() => jsonResponse(['nope'], 422));
    await expect(apiPost('/api/games', {})).rejects.toMatchObject({
      message: 'Request failed (422)',
      status: 422,
    });

    installFetch(() => new Response('not-json', { status: 502 }));
    await expect(apiGet('/api/games')).rejects.toMatchObject({
      message: 'Request failed (502)',
      status: 502,
    });
  });
});
