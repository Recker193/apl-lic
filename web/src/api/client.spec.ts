import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from './client';

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sets X-Requested-With header on POST mutations', async () => {
    let capturedHeaders: Headers | undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      capturedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await apiClient('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    expect(capturedHeaders?.get('X-Requested-With')).toBe('XMLHttpRequest');
    expect(capturedHeaders?.get('Content-Type')).toBe('application/json');
  });

  it('does not set X-Requested-With on GET requests', async () => {
    let capturedHeaders: Headers | undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      capturedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await apiClient('/api/v1/auth/me', { method: 'GET' });
    expect(capturedHeaders?.get('X-Requested-With')).toBeNull();
  });

  it('throws ApiError with status and message on HTTP failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await expect(apiClient('/api/v1/auth/login', { method: 'POST' })).rejects.toThrow(
      ApiError,
    );
  });
});

