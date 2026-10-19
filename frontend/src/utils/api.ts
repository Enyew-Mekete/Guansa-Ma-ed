export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  const contentType = response.headers.get('content-type') || 'unknown content type';
  if (!contentType.toLowerCase().includes('application/json')) {
    const endpoint = new URL(path, window.location.origin).pathname;
    throw new ApiError(
      `The API endpoint ${endpoint} returned a non-JSON response (HTTP ${response.status}, ${contentType}). Check that the app server and API route are configured correctly.`,
      response.status,
    );
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    const endpoint = new URL(path, window.location.origin).pathname;
    throw new ApiError(
      `The API endpoint ${endpoint} returned malformed JSON (HTTP ${response.status}).`,
      response.status,
    );
  }

  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'message' in result &&
      typeof result.message === 'string'
      ? result.message
      : `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status);
  }
  return result as T;
}
