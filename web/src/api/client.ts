export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method?.toUpperCase() ?? 'GET';
  const headers = new Headers(options.headers || {});

  // Backend guards require X-Requested-With on mutations for CSRF mitigation
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    headers.set('X-Requested-With', 'XMLHttpRequest');
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const path = endpoint.startsWith('/') ? endpoint : `/api/v1/${endpoint}`;
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always send and receive session cookies
  });

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : String(data.message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

