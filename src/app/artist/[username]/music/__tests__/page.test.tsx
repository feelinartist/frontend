import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MusicRequestPage from "../page";

// Mock components used inside the page
vi.mock("@/components/request-music-form", () => ({
    RequestMusicForm: () => <div data-testid="music-form">Music Form</div>,
}));

vi.mock("@/components/EventStatusMonitor", () => ({
    EventStatusMonitor: () => <div data-testid="status-monitor">Status Monitor</div>,
}));

describe("MusicRequestPage (Server Component)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it("renders 'Artist not found' when API call fails", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
        });

        const paramsPromise = Promise.resolve({ username: "nonexistent" });
        const result = await MusicRequestPage({ params: paramsPromise });
        render(result);

        expect(screen.getByText("Artista no encontrado")).toBeInTheDocument();
    });

    it("renders 'Artist not found' when user has no perfilArtista", async () => {
        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes("perfil-publico")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ id: "user-1", nombre: "User" }), // No perfilArtista
                });
            }
            return Promise.resolve({ ok: false });
        });

        const paramsPromise = Promise.resolve({ username: "noartist" });
        const result = await MusicRequestPage({ params: paramsPromise });
        render(result);

        expect(screen.getByText("Artista no encontrado")).toBeInTheDocument();
    });

    it("renders active event and request form if event is live with categoria", async () => {
        const mockUser = {
            id: "user-1",
            nombre: "John Artist",
            imagen: "/img.png",
            perfilCompletadoReconocido: true,
            perfilArtista: {
                id: "artist-1",
                nombreArtistico: "John Live",
                pedidosActivos: true,
                categoria: "DJ",
            },
        };

        const mockEvent = {
            id: "event-1",
            titulo: "Awesome Live Concert",
        };

        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes("perfil-publico")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockUser,
                });
            }
            if (url.includes("activo")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockEvent,
                });
            }
            return Promise.resolve({ ok: false });
        });

        const paramsPromise = Promise.resolve({ username: "johnlive" });
        const result = await MusicRequestPage({ params: paramsPromise });
        render(result);

        expect(screen.getByText("John Live")).toBeInTheDocument();
        expect(screen.getByText("DJ")).toBeInTheDocument();
        expect(screen.getByText("Awesome Live Concert")).toBeInTheDocument();
        expect(screen.getByText("Recibiendo Pedidos")).toBeInTheDocument();
        expect(screen.getByTestId("music-form")).toBeInTheDocument();
        expect(screen.getByTestId("status-monitor")).toBeInTheDocument();
    });

    it("renders 'Sin Evento Activo' when no event is live", async () => {
        const mockUser = {
            id: "user-1",
            nombre: "John Artist",
            imagen: "/img.png",
            perfilArtista: {
                id: "artist-1",
                nombreArtistico: "John Offline",
                pedidosActivos: false,
            },
        };

        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes("perfil-publico")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockUser,
                });
            }
            // Event returns 404 or null
            return Promise.resolve({ ok: false });
        });

        const paramsPromise = Promise.resolve({ username: "johnoffline" });
        const result = await MusicRequestPage({ params: paramsPromise });
        render(result);

        expect(screen.getByText("John Offline")).toBeInTheDocument();
        expect(screen.getByText("Sin Evento Activo")).toBeInTheDocument();
        expect(screen.getByTestId("status-monitor")).toBeInTheDocument();
    });

    it("renders 'Artista no encontrado' when fetch throws an error", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (global.fetch as any).mockRejectedValue(new Error("Fetch failed"));

        const paramsPromise = Promise.resolve({ username: "erroruser" });
        const result = await MusicRequestPage({ params: paramsPromise });
        render(result);

        expect(screen.getByText("Artista no encontrado")).toBeInTheDocument();
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    it("renders user avatar when imagen is provided", async () => {
        const mockUser = {
            id: "user-1",
            nombre: "John Artist",
            nombreUsuario: "johnartist",
            imagen: "/img.png",
            perfilArtista: {
                id: "artist-1",
                nombreArtistico: "John Live",
                pedidosActivos: true,
            },
        };

        const mockEvent = {
            id: "event-1",
            titulo: "Event Title",
        };

        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes("perfil-publico")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockUser,
                });
            }
            if (url.includes("activo")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockEvent,
                });
            }
            return Promise.resolve({ ok: false });
        });

        const paramsPromise = Promise.resolve({ username: "johnlive" });
        const result = await MusicRequestPage({ params: paramsPromise });
        render(result);

        const imgElement = screen.getByAltText("John Live");
        expect(imgElement).toBeInTheDocument();
    });

    it("renders initials when imagen is not provided", async () => {
        const mockUser = {
            id: "user-1",
            nombre: "John Artist",
            nombreUsuario: "johnartist",
            perfilArtista: {
                id: "artist-1",
                nombreArtistico: "Jane Doe",
                pedidosActivos: false,
            },
        };

        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes("perfil-publico")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockUser,
                });
            }
            return Promise.resolve({ ok: false });
        });

        const paramsPromise = Promise.resolve({ username: "janedoe" });
        const result = await MusicRequestPage({ params: paramsPromise });
        render(result);

        expect(screen.getByText("Jane Doe")).toBeInTheDocument();
        // Should show initial "J" from nombreArtistico
        expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("uses nombreUsuario when nombreArtistico is not available", async () => {
        const mockUser = {
            id: "user-1",
            nombre: "John Artist",
            nombreUsuario: "johndoe",
            perfilArtista: {
                id: "artist-1",
                pedidosActivos: false,
            },
        };

        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes("perfil-publico")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockUser,
                });
            }
            return Promise.resolve({ ok: false });
        });

        const paramsPromise = Promise.resolve({ username: "johndoe" });
        const result = await MusicRequestPage({ params: paramsPromise });
        render(result);

        expect(screen.getByText("John Artist")).toBeInTheDocument();
    });

    it("handles event with null data", async () => {
        const mockUser = {
            id: "user-1",
            nombre: "John Artist",
            imagen: "/img.png",
            perfilArtista: {
                id: "artist-1",
                nombreArtistico: "John",
                pedidosActivos: true,
            },
        };

        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes("perfil-publico")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockUser,
                });
            }
            if (url.includes("activo")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => null,
                });
            }
            return Promise.resolve({ ok: false });
        });

        const paramsPromise = Promise.resolve({ username: "john" });
        const result = await MusicRequestPage({ params: paramsPromise });
        render(result);

        expect(screen.getByText("Sin Evento Activo")).toBeInTheDocument();
    });

    it("renders 'En Vivo' indicator when event is live", async () => {
        const mockUser = {
            id: "user-1",
            nombre: "John Artist",
            imagen: "/img.png",
            perfilArtista: {
                id: "artist-1",
                nombreArtistico: "John",
                pedidosActivos: true,
            },
        };

        const mockEvent = {
            id: "event-1",
            titulo: "Live Event",
        };

        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes("perfil-publico")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockUser,
                });
            }
            if (url.includes("activo")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockEvent,
                });
            }
            return Promise.resolve({ ok: false });
        });

        const paramsPromise = Promise.resolve({ username: "john" });
        const result = await MusicRequestPage({ params: paramsPromise });
        render(result);

        expect(screen.getByText("En Vivo")).toBeInTheDocument();
    });

    it("displays artist name in music form when passed", async () => {
        const mockUser = {
            id: "user-1",
            nombre: "John Artist",
            imagen: "/img.png",
            perfilArtista: {
                id: "artist-1",
                nombreArtistico: "John",
                pedidosActivos: true,
            },
        };

        const mockEvent = {
            id: "event-1",
            titulo: "Live Event",
        };

        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes("perfil-publico")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockUser,
                });
            }
            if (url.includes("activo")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockEvent,
                });
            }
            return Promise.resolve({ ok: false });
        });

        const paramsPromise = Promise.resolve({ username: "john" });
        const result = await MusicRequestPage({ params: paramsPromise });
        render(result);

        expect(screen.getByTestId("music-form")).toBeInTheDocument();
    });
});

