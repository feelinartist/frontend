import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchApi, parseJsonSafe } from './api';
import { getSession, signOut } from 'next-auth/react';

vi.mock('next-auth/react', () => ({
    getSession: vi.fn(),
    signOut: vi.fn(),
}));

describe('api utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('parseJsonSafe', () => {
        it('should return parsed json if json function resolves', async () => {
            const mockResponse = {
                json: vi.fn().mockResolvedValue({ success: true }),
            };
            const result = await parseJsonSafe(mockResponse);
            expect(result).toEqual({ success: true });
        });

        it('should return null if json function rejects', async () => {
            const mockResponse = {
                json: vi.fn().mockRejectedValue(new Error('Parse error')),
            };
            const result = await parseJsonSafe(mockResponse);
            expect(result).toBeNull();
        });

        it('should return null if response is falsy', async () => {
            const result = await parseJsonSafe(null);
            expect(result).toBeNull();
        });

        it('should return null if response has no json function', async () => {
            const result = await parseJsonSafe({ data: 'string' });
            expect(result).toBeNull();
        });
    });

    describe('fetchApi', () => {
        const mockBackendUrl = 'http://localhost:3001';

        it('should prepend BACKEND_URL if path does not start with http', async () => {
            (getSession as any).mockResolvedValue({ accessToken: 'mock-token' });
            (globalThis.fetch as any).mockResolvedValue({
                status: 200,
                ok: true,
            });

            await fetchApi('/test-path');

            expect(globalThis.fetch).toHaveBeenCalledWith(`${mockBackendUrl}/test-path`, expect.any(Object));
        });

        it('should not prepend BACKEND_URL if path starts with http', async () => {
            (getSession as any).mockResolvedValue({ accessToken: 'mock-token' });
            (globalThis.fetch as any).mockResolvedValue({
                status: 200,
                ok: true,
            });

            await fetchApi('https://api.external.com/test');

            expect(globalThis.fetch).toHaveBeenCalledWith('https://api.external.com/test', expect.any(Object));
        });

        it('should include Authorization header if accessToken is available', async () => {
            (getSession as any).mockResolvedValue({ accessToken: 'mock-token' });
            (globalThis.fetch as any).mockResolvedValue({
                status: 200,
                ok: true,
            });

            await fetchApi('/test');

            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer mock-token',
                    },
                })
            );
        });

        it('should not include Authorization header if accessToken is missing', async () => {
            (getSession as any).mockResolvedValue(null);
            (globalThis.fetch as any).mockResolvedValue({
                status: 200,
                ok: true,
            });

            await fetchApi('/test');

            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            );
        });

        it('should merge additional options and headers', async () => {
            (getSession as any).mockResolvedValue({ accessToken: 'token' });
            (globalThis.fetch as any).mockResolvedValue({
                status: 200,
            });

            await fetchApi('/test', {
                method: 'POST',
                headers: {
                    'X-Custom-Header': 'custom-value',
                },
                body: JSON.stringify({ test: 1 }),
            });

            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ test: 1 }),
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer token',
                        'X-Custom-Header': 'custom-value',
                    },
                })
            );
        });

        it('should call signOut when response is 401 and window is defined', async () => {
            (getSession as any).mockResolvedValue(null);
            (globalThis.fetch as any).mockResolvedValue({
                status: 401,
            });

            // vitest.setup.ts defines window, so we just test the normal flow.
            await fetchApi('/test');

            expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
        });

        it('should call signOut when response is 403 and window is defined', async () => {
            (getSession as any).mockResolvedValue(null);
            (globalThis.fetch as any).mockResolvedValue({
                status: 403,
            });

            await fetchApi('/test');

            expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
        });

        it('should not call signOut when response is 401 but window is undefined', async () => {
            (getSession as any).mockResolvedValue(null);
            (globalThis.fetch as any).mockResolvedValue({
                status: 401,
            });

            const originalWindow = globalThis.window;
            // @ts-expect-error - simulating server environment
            delete globalThis.window;

            await fetchApi('/test');

            expect(signOut).not.toHaveBeenCalled();

            // restore window
            globalThis.window = originalWindow;
        });
    });
});
