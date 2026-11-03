const API_ORIGIN = 'https://faxb76kxra.execute-api.eu-central-1.amazonaws.com';

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export async function apiGet(
  path: string,
  query?: Record<string, string>,
  signal?: AbortSignal,
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(apiUrl(path, query), {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new ApiError('Network error. Check your connection and try again.', 0);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return response.json() as Promise<unknown>;
}

export async function apiPost(path: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(apiUrl(path), {
      method: 'POST',
      signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new ApiError('Network error. Check your connection and try again.', 0);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return response.json() as Promise<unknown>;
}

function apiUrl(path: string, query?: Record<string, string>): string {
  const url = new URL(path, API_ORIGIN);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (isRecord(body) && typeof body.error === 'string' && body.error !== '') {
      return body.error;
    }
  } catch {
    return `Request failed (${response.status})`;
  }

  return `Request failed (${response.status})`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
