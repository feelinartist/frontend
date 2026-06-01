import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAuthOptions } from './auth';

describe('auth options', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.fetch = vi.fn();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        process.env = originalEnv;
    });

    it('should configure GoogleProvider with env variables', () => {
        process.env.GOOGLE_CLIENT_ID = 'test-client-id';
        process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
        
        const options = getAuthOptions();
        
        expect(options.providers).toHaveLength(1);
        expect(options.session?.strategy).toBe('jwt');
        expect(options.pages?.signIn).toBe('/login');
    });

    it('should issue a warning if Google credentials are missing', () => {
        const consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;

        getAuthOptions();

        expect(consoleWarnMock).toHaveBeenCalledWith('⚠️ Faltan credenciales de Google en .env.local');
        consoleWarnMock.mockRestore();
    });

    describe('callbacks.jwt', () => {
        it('should sync user with backend if account and user are provided', async () => {
            const options = getAuthOptions();
            const jwtCallback = options.callbacks?.jwt as any;

            (globalThis.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'db-id',
                    rol: { nombre: 'ARTIST' },
                    nombre: 'DB Name',
                    imagen: 'db-image.jpg',
                    perfilCompletadoReconocido: true,
                    token: 'backend-token'
                })
            });

            const token = await jwtCallback({
                token: { sub: '123' },
                user: { email: 'test@test.com', name: 'User', image: 'image.jpg' },
                account: { provider: 'google' }
            });

            expect(globalThis.fetch).toHaveBeenCalled();
            expect(token.id).toBe('db-id');
            expect(token.rol).toBe('ARTIST');
            expect(token.name).toBe('DB Name');
            expect(token.image).toBe('db-image.jpg');
            expect(token.perfilCompletadoReconocido).toBe(true);
            expect(token.accessToken).toBe('backend-token');
        });

        it('should fallback to user name and image if backend returns empty', async () => {
            const options = getAuthOptions();
            const jwtCallback = options.callbacks?.jwt as any;

            (globalThis.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'db-id',
                    token: 'backend-token'
                })
            });

            const token = await jwtCallback({
                token: { sub: '123' },
                user: { email: 'test@test.com', name: 'User', image: 'image.jpg' },
                account: { provider: 'google' }
            });

            expect(token.name).toBe('User');
            expect(token.image).toBe('image.jpg');
            expect(token.perfilCompletadoReconocido).toBe(false);
        });

        it('should throw an error if backend sync fails (response not ok)', async () => {
            const options = getAuthOptions();
            const jwtCallback = options.callbacks?.jwt as any;

            (globalThis.fetch as any).mockResolvedValue({
                ok: false,
                status: 500
            });
            
            const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

            await expect(jwtCallback({
                token: { sub: '123' },
                user: { email: 'test@test.com' },
                account: { provider: 'google' }
            })).rejects.toThrow('Backend synchronization failed');

            expect(consoleErrorMock).toHaveBeenCalled();
            consoleErrorMock.mockRestore();
        });

        it('should throw an error if fetch throws network error', async () => {
            const options = getAuthOptions();
            const jwtCallback = options.callbacks?.jwt as any;

            (globalThis.fetch as any).mockRejectedValue(new Error('Network error'));
            
            const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

            await expect(jwtCallback({
                token: { sub: '123' },
                user: { email: 'test@test.com' },
                account: { provider: 'google' }
            })).rejects.toThrow('Backend synchronization failed');

            expect(consoleErrorMock).toHaveBeenCalled();
            consoleErrorMock.mockRestore();
        });

        it('should handle session update correctly', async () => {
            const options = getAuthOptions();
            const jwtCallback = options.callbacks?.jwt as any;

            const token = await jwtCallback({
                token: { id: 'existing' },
                trigger: 'update',
                session: {
                    rol: 'ADMIN',
                    nombreArtistico: 'Art Name',
                    name: 'New Name',
                    image: 'new-image.jpg',
                    accessToken: 'new-token',
                    perfilCompletadoReconocido: true
                }
            });

            expect(token.rol).toBe('ADMIN');
            expect(token.nombreArtistico).toBe('Art Name');
            expect(token.name).toBe('New Name');
            expect(token.image).toBe('new-image.jpg');
            expect(token.accessToken).toBe('new-token');
            expect(token.perfilCompletadoReconocido).toBe(true);
        });

        it('should handle partial session update', async () => {
            const options = getAuthOptions();
            const jwtCallback = options.callbacks?.jwt as any;

            const token = await jwtCallback({
                token: { id: 'existing', name: 'Old', image: 'old.jpg' },
                trigger: 'update',
                session: {
                    name: 'New Name'
                }
            });

            expect(token.name).toBe('New Name');
            expect(token.image).toBe('old.jpg'); // unchanged
        });

        it('should not update session if trigger is not update', async () => {
            const options = getAuthOptions();
            const jwtCallback = options.callbacks?.jwt as any;

            const token = await jwtCallback({
                token: { id: 'existing', name: 'Old' },
                trigger: 'signIn',
                session: {
                    name: 'New Name'
                }
            });

            expect(token.name).toBe('Old');
        });
    });

    describe('callbacks.session', () => {
        it('should populate session with token data', async () => {
            const options = getAuthOptions();
            const sessionCallback = options.callbacks?.session as any;

            const session = await sessionCallback({
                session: { user: {} },
                token: {
                    id: 'token-id',
                    rol: 'USER',
                    name: 'Token Name',
                    image: 'token-image.jpg',
                    perfilCompletadoReconocido: false,
                    accessToken: 'backend-token'
                }
            });

            expect(session.user.id).toBe('token-id');
            expect(session.user.rol).toBe('USER');
            expect(session.user.name).toBe('Token Name');
            expect(session.user.image).toBe('token-image.jpg');
            expect(session.user.perfilCompletadoReconocido).toBe(false);
            expect(session.accessToken).toBe('backend-token');
        });

        it('should handle missing user in session object gracefully', async () => {
            const options = getAuthOptions();
            const sessionCallback = options.callbacks?.session as any;

            const session = await sessionCallback({
                session: {},
                token: {
                    accessToken: 'backend-token'
                }
            });

            expect(session.user).toBeUndefined();
            expect(session.accessToken).toBe('backend-token');
        });
    });
});
