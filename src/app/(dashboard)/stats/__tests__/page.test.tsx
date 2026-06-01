import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaginaEstadisticas from "../page";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/api";

const pushMock = vi.fn();

// Mock router
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: pushMock,
    }),
}));

// Mock next-auth
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));

// Mock fetchApi
vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        fetchApi: vi.fn(),
    };
});

// Mock children components to focus on page controller logic
vi.mock("@/components/stats/StatsMetricCards", () => ({
    StatsMetricCards: ({ totalPedidos }: any) => <div data-testid="metric-cards">Metrics: {totalPedidos}</div>,
}));

vi.mock("@/components/stats/GenresChartCard", () => ({
    GenresChartCard: () => <div data-testid="genres-chart">Genres Chart</div>,
}));

vi.mock("@/components/stats/SongsAnalysisCard", () => ({
    SongsAnalysisCard: ({ onViewReport }: any) => (
        <button data-testid="songs-analysis" onClick={onViewReport}>
            Songs Analysis
        </button>
    ),
}));

describe("PaginaEstadisticas Component", () => {
    const mockSession = {
        user: {
            id: "user-123",
            name: "John Artist",
            rol: "ARTISTA",
        },
    };

    const mockProfile = {
        perfilArtista: {
            id: "artist-123",
        },
    };

    const mockStats = {
        perfilArtistaId: "artist-123",
        totalEventos: 5,
        totalPedidos: 100,
        totalAceptados: 70,
        totalRechazados: 30,
        totalPendientes: 0,
        tasaAceptacion: 70,
        generosPorConteo: [],
        topCanciones: [],
        topAceptadas: [],
        topRechazadas: [],
        eventosMasActivos: [
            {
                eventoId: "evt-1",
                titulo: "Event One",
                totalPedidos: 20,
                fecha: "2026-05-27T10:00:00.000Z",
            }
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useSession as any).mockReturnValue({
            data: mockSession,
        });
    });

    it("renders loading screen initially", () => {
        (fetchApi as any).mockReturnValue(new Promise(() => {})); // Never resolves
        render(<PaginaEstadisticas />);
        expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });

    it("renders page content after statistics are successfully loaded", async () => {
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockProfile,
                });
            }
            if (url.includes("/api/eventos/artista")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [],
                });
            }
            if (url.includes("/api/estadisticas/artista")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockStats,
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<PaginaEstadisticas />);

        await waitFor(() => {
            expect(screen.getByText("Estadísticas Globales")).toBeInTheDocument();
        });

        expect(screen.getByTestId("metric-cards")).toHaveTextContent("Metrics: 100");
        expect(screen.getByText("Event One")).toBeInTheDocument();
    });

    it("renders error state when profile fetching fails", async () => {
        (fetchApi as any).mockResolvedValue({
            ok: false,
        });

        render(<PaginaEstadisticas />);

        await waitFor(() => {
            expect(screen.getByText("Error al cargar estadísticas")).toBeInTheDocument();
        });

        const backButton = screen.getByText("Volver al Inicio");
        fireEvent.click(backButton);
        expect(pushMock).toHaveBeenCalledWith("/home");
    });

    it("handles fetch exceptions gracefully", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchApi as any).mockRejectedValue(new Error("Network error"));

        render(<PaginaEstadisticas />);

        await waitFor(() => {
            expect(screen.getByText("Error al cargar estadísticas")).toBeInTheDocument();
        });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it("navigates on button clicks", async () => {
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil")) {
                return Promise.resolve({ ok: true, json: async () => mockProfile });
            }
            if (url.includes("/api/eventos/artista")) {
                return Promise.resolve({ ok: true, json: async () => [] });
            }
            if (url.includes("/api/estadisticas/artista")) {
                return Promise.resolve({ ok: true, json: async () => mockStats });
            }
            return Promise.resolve({ ok: false });
        });

        render(<PaginaEstadisticas />);

        await waitFor(() => {
            expect(screen.getByText("Ver por Evento")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Ver por Evento"));
        expect(pushMock).toHaveBeenCalledWith("/stats/events");

        fireEvent.click(screen.getByTestId("songs-analysis"));
        expect(pushMock).toHaveBeenCalledWith("/stats/songs");
    });

    it("handles missing artist profile id", async () => {
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ perfilArtista: null }),
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<PaginaEstadisticas />);

        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith("/home");
        });
    });

    it("handles stats fetch failure", async () => {
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockProfile,
                });
            }
            if (url.includes("/api/eventos/artista")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [],
                });
            }
            if (url.includes("/api/estadisticas/artista")) {
                return Promise.resolve({
                    ok: false,
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<PaginaEstadisticas />);

        await waitFor(() => {
            expect(screen.getByText("Error al cargar estadísticas")).toBeInTheDocument();
        });
    });
});
