import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAuthOptions } from "../auth";

// Mock next-auth providers
vi.mock("next-auth/providers/google", () => {
    return {
        default: vi.fn((config) => ({
            id: "google",
            name: "Google",
            type: "oauth",
            ...config,
        })),
    };
});

describe("getAuthOptions", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.restoreAllMocks();
    });

    it("should return configuration options including GoogleProvider", () => {
        process.env.GOOGLE_CLIENT_ID = "test-client-id";
        process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";

        const options = getAuthOptions();
        expect(options.providers).toHaveLength(1);
        expect(options.providers[0].id).toBe("google");
        expect(options.session?.strategy).toBe("jwt");
        expect(options.pages?.signIn).toBe("/login");
    });

    it("should warn if Google credentials are missing", () => {
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;

        getAuthOptions();
        expect(console.warn).toHaveBeenCalledWith(
            "⚠️ Faltan credenciales de Google en .env.local"
        );
    });

    it("should fallback backendUrl to localhost:3001 if NEXT_PUBLIC_BACKEND_URL is not set", async () => {
        delete process.env.NEXT_PUBLIC_BACKEND_URL;
        process.env.GOOGLE_CLIENT_ID = "id";
        process.env.GOOGLE_CLIENT_SECRET = "secret";

        const options = getAuthOptions();
        const jwtCallback = options.callbacks?.jwt;
        
        // Mock global fetch
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                id: "user-123",
                rol: { nombre: "ARTISTA" },
                nombre: "Test User",
                imagen: "img.png",
                perfilCompletadoReconocido: true,
                token: "jwt-token",
            }),
        });
        global.fetch = mockFetch;

        if (jwtCallback) {
            await jwtCallback({
                token: {},
                user: { email: "test@example.com", name: "Test User", image: "img.png" } as any,
                account: { provider: "google" } as any,
                profile: {} as any,
                isNewUser: false,
            });
            
            expect(mockFetch).toHaveBeenCalledWith(
                "http://localhost:3001/api/auth/login",
                expect.any(Object)
            );
        }
    });

    describe("callbacks", () => {
        describe("jwt callback", () => {
            it("should handle trigger === 'update' and update token properties", async () => {
                const options = getAuthOptions();
                const jwtCallback = options.callbacks?.jwt;

                if (jwtCallback) {
                    const token = { id: "old-id" };
                    const updatedToken = await jwtCallback({
                        token,
                        user: null as any,
                        account: null as any,
                        trigger: "update",
                        session: {
                            rol: "ARTISTA",
                            nombreArtistico: "Artist Name",
                            name: "New Name",
                            image: "new-image.png",
                            accessToken: "new-token",
                            perfilCompletadoReconocido: true,
                        },
                    });

                    expect(updatedToken).toEqual({
                        id: "old-id",
                        rol: "ARTISTA",
                        nombreArtistico: "Artist Name",
                        name: "New Name",
                        image: "new-image.png",
                        accessToken: "new-token",
                        perfilCompletadoReconocido: true,
                    });
                }
            });

            it("should not update token if session properties are missing during update trigger", async () => {
                const options = getAuthOptions();
                const jwtCallback = options.callbacks?.jwt;

                if (jwtCallback) {
                    const token = { id: "old-id" };
                    const updatedToken = await jwtCallback({
                        token,
                        user: null as any,
                        account: null as any,
                        trigger: "update",
                        session: {},
                    });

                    expect(updatedToken).toEqual({ id: "old-id" });
                }
            });

            it("should perform backend login sync when account and user are provided", async () => {
                process.env.NEXT_PUBLIC_BACKEND_URL = "https://api.test.com";
                const options = getAuthOptions();
                const jwtCallback = options.callbacks?.jwt;

                const mockFetch = vi.fn().mockResolvedValue({
                    ok: true,
                    json: async () => ({
                        id: "db-user-id",
                        rol: { nombre: "ARTISTA" },
                        nombre: "DB User Name",
                        imagen: "db-img.png",
                        perfilCompletadoReconocido: true,
                        token: "db-jwt-token",
                    }),
                });
                global.fetch = mockFetch;

                if (jwtCallback) {
                    const token = {};
                    const result = await jwtCallback({
                        token,
                        user: { email: "test@user.com", name: "Google Name", image: "google-img.png" } as any,
                        account: { provider: "google" } as any,
                    });

                    expect(mockFetch).toHaveBeenCalledWith(
                        "https://api.test.com/api/auth/login",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                correo: "test@user.com",
                                nombre: "Google Name",
                                imagen: "google-img.png",
                            }),
                        }
                    );

                    expect(result).toEqual({
                        id: "db-user-id",
                        rol: "ARTISTA",
                        name: "DB User Name",
                        image: "db-img.png",
                        perfilCompletadoReconocido: true,
                        accessToken: "db-jwt-token",
                    });
                }
            });

            it("should fallback user name, image, and profile completed fields if database values are falsy", async () => {
                const options = getAuthOptions();
                const jwtCallback = options.callbacks?.jwt;

                const mockFetch = vi.fn().mockResolvedValue({
                    ok: true,
                    json: async () => ({
                        id: "db-user-id",
                        rol: null,
                        nombre: null,
                        imagen: null,
                        perfilCompletadoReconocido: null,
                        token: "db-jwt-token",
                    }),
                });
                global.fetch = mockFetch;

                if (jwtCallback) {
                    const token = {};
                    const result = await jwtCallback({
                        token,
                        user: { email: "test@user.com", name: "Google Name", image: "google-img.png" } as any,
                        account: { provider: "google" } as any,
                    });

                    expect(result).toEqual({
                        id: "db-user-id",
                        rol: undefined,
                        name: "Google Name",
                        image: "google-img.png",
                        perfilCompletadoReconocido: false,
                        accessToken: "db-jwt-token",
                    });
                }
            });

            it("should handle user without email, name, or image", async () => {
                const options = getAuthOptions();
                const jwtCallback = options.callbacks?.jwt;

                const mockFetch = vi.fn().mockResolvedValue({
                    ok: true,
                    json: async () => ({
                        id: "db-user-id",
                        token: "db-jwt-token",
                    }),
                });
                global.fetch = mockFetch;

                if (jwtCallback) {
                    const token = {};
                    const result = await jwtCallback({
                        token,
                        user: {} as any, // Missing all fields
                        account: { provider: "google" } as any,
                    });

                    expect(mockFetch).toHaveBeenCalledWith(
                        expect.any(String),
                        expect.objectContaining({
                            body: JSON.stringify({
                                correo: null,
                                nombre: null,
                                imagen: null,
                            }),
                        })
                    );
                }
            });

            it("should throw error if fetch response is not ok", async () => {
                const options = getAuthOptions();
                const jwtCallback = options.callbacks?.jwt;

                global.fetch = vi.fn().mockResolvedValue({
                    ok: false,
                    status: 500,
                });

                if (jwtCallback) {
                    await expect(
                        jwtCallback({
                            token: {},
                            user: { email: "test@user.com" } as any,
                            account: { provider: "google" } as any,
                        })
                    ).rejects.toThrow("Backend synchronization failed");

                    expect(console.error).toHaveBeenCalledWith(
                        "Failed to sync user with backend. Status:",
                        500
                    );
                }
            });

            it("should throw error if fetch throws an error", async () => {
                const options = getAuthOptions();
                const jwtCallback = options.callbacks?.jwt;

                global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

                if (jwtCallback) {
                    await expect(
                        jwtCallback({
                            token: {},
                            user: { email: "test@user.com" } as any,
                            account: { provider: "google" } as any,
                        })
                    ).rejects.toThrow("Backend synchronization failed");

                    expect(console.error).toHaveBeenCalledWith(
                        "Error syncing user with backend:",
                        expect.any(Error)
                    );
                }
            });
        });

        describe("session callback", () => {
            it("should populate session.user and session.accessToken from token", async () => {
                const options = getAuthOptions();
                const sessionCallback = options.callbacks?.session;

                if (sessionCallback) {
                    const session = {
                        user: {
                            name: "Old Name",
                            email: "old@example.com",
                        },
                    } as any;

                    const token = {
                        id: "user-id-123",
                        rol: "ARTISTA",
                        name: "New Name",
                        image: "new-image.jpg",
                        perfilCompletadoReconocido: true,
                        accessToken: "backend-jwt-token",
                    };

                    const result = await sessionCallback({ session, token, user: null as any });

                    expect(result.user).toEqual({
                        id: "user-id-123",
                        rol: "ARTISTA",
                        name: "New Name",
                        image: "new-image.jpg",
                        perfilCompletadoReconocido: true,
                        email: "old@example.com",
                    });
                    expect(result.accessToken).toBe("backend-jwt-token");
                }
            });

            it("should not populate session.user fields if token fields are undefined", async () => {
                const options = getAuthOptions();
                const sessionCallback = options.callbacks?.session;

                if (sessionCallback) {
                    const session = {
                        user: {
                            name: "Old Name",
                        },
                    } as any;

                    const token = {
                        perfilCompletadoReconocido: undefined,
                    };

                    const result = await sessionCallback({ session, token, user: null as any });

                    expect(result.user).toEqual({
                        name: "Old Name",
                    });
                    expect(result.accessToken).toBeUndefined();
                }
            });

            it("should not crash if session.user is undefined", async () => {
                const options = getAuthOptions();
                const sessionCallback = options.callbacks?.session;

                if (sessionCallback) {
                    const session = {} as any;
                    const token = {
                        accessToken: "backend-jwt-token",
                    };

                    const result = await sessionCallback({ session, token, user: null as any });

                    expect(result.user).toBeUndefined();
                    expect(result.accessToken).toBe("backend-jwt-token");
                }
            });
        });
    });
});
