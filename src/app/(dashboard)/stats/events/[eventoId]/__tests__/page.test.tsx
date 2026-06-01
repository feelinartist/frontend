import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EventStatsPage from "../page";
import { useSession } from "next-auth/react";

const pushMock = vi.fn();

// Mock routers/params
vi.mock("next/navigation", () => ({
    useParams: () => ({
        eventoId: "event-123",
    }),
    useRouter: () => ({
        push: pushMock,
    }),
}));

// Mock next-auth
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));

// Mock child components
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

describe("EventStatsPage Component", () => {
    const mockSession = {
        user: {
            id: "user-123",
            name: "John Artist",
        },
    };

    const mockStats = {
        totalPedidos: 45,
        totalAceptados: 30,
        totalRechazados: 15,
        tasaAceptacion: 66.7,
        generosPorConteo: [],
        topCanciones: [],
        topAceptadas: [],
        topRechazadas: [],
        evento: {
            titulo: "Viernes de Salsa",
            horaInicio: "2026-05-27T10:00:00.000Z",
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
        (useSession as any).mockReturnValue({
            data: mockSession,
        });
    });

    it("renders loading screen initially", () => {
        (global.fetch as any).mockReturnValue(new Promise(() => {})); // Never resolves
        render(<EventStatsPage />);
        expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });

    it("renders event statistics once successfully fetched", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockStats,
        });

        render(<EventStatsPage />);

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: "Viernes de Salsa" })).toBeInTheDocument();
        });

        expect(screen.getByTestId("metric-cards")).toHaveTextContent("Metrics: 45");
        expect(screen.getByText("Estadísticas")).toBeInTheDocument();
        expect(screen.getByText("Eventos")).toBeInTheDocument();
    });

    it("handles fetch exception and logs error", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (global.fetch as any).mockRejectedValue(new Error("Network error"));

        render(<EventStatsPage />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error:", expect.any(Error));
        });
        consoleSpy.mockRestore();
    });

    it("navigates to report on songs analysis report click", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockStats,
        });

        render(<EventStatsPage />);

        await waitFor(() => {
            expect(screen.getByTestId("songs-analysis")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId("songs-analysis"));

        expect(pushMock).toHaveBeenCalledWith("/stats/events/event-123/songs");
    });
});
