import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import PaginaEstadisticas from "../page";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

vi.mock("next-auth/react", () => ({ useSession: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("@/lib/api", () => ({ fetchApi: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

// Mock components
vi.mock("@/components/stats/StatsMetricCards", () => ({
  StatsMetricCards: () => <div data-testid="stats-metric-cards" />
}));
vi.mock("@/components/stats/GenresChartCard", () => ({
  GenresChartCard: () => <div data-testid="genres-chart-card" />
}));
vi.mock("@/components/stats/SongsAnalysisCard", () => ({
  SongsAnalysisCard: ({ onViewReport }: any) => (
    <div data-testid="songs-analysis-card">
      <button onClick={onViewReport}>View Report</button>
    </div>
  )
}));

describe("PaginaEstadisticas", () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "ARTISTA" } }
    });
  });

  const mockStats = {
    perfilArtistaId: "art-1",
    totalEventos: 10,
    totalPedidos: 100,
    totalAceptados: 80,
    totalRechazados: 10,
    totalPendientes: 10,
    tasaAceptacion: 80,
    generosPorConteo: [{ genero: "Rock", conteo: 50, porcentaje: 50 }],
    topCanciones: [{ titulo: "Song 1", artista: "Me", conteo: 10, aceptados: 8, rechazados: 2 }],
    topAceptadas: [{ titulo: "Song A", artista: "Me", total: 5 }],
    topRechazadas: [{ titulo: "Song R", artista: "Me", total: 1 }],
    eventosMasActivos: [{ eventoId: "ev-1", titulo: "Big Party", totalPedidos: 40, fecha: "2023-12-01T00:00:00Z" }]
  };

  it("returns null if no session user ID initially", () => {
    (useSession as any).mockReturnValue({ data: null });
    const { container } = render(<PaginaEstadisticas />);
    expect(container.querySelector(".animate-spin") || screen.queryByTestId("loading-screen")).toBeDefined();
  });

  it("handles profile fetch failure", async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({ ok: false } as any);

    render(<PaginaEstadisticas />);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al conectar con el servidor");
    });
  });

  it("handles user without artist profile", async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({ 
      ok: true, 
      json: () => Promise.resolve({}) 
    } as any);

    render(<PaginaEstadisticas />);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("No tienes un perfil de artista");
      expect(mockRouter.push).toHaveBeenCalledWith("/home");
    });
  });

  it("handles stats fetch failure", async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({ 
      ok: true, 
      json: () => Promise.resolve({ perfilArtista: { id: "art-1" } }) 
    } as any);
    
    // Promise.all responses
    vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as any); // eventos
    vi.mocked(fetchApi).mockResolvedValueOnce({ ok: false } as any); // stats

    render(<PaginaEstadisticas />);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al cargar estadísticas");
    });
  });

  it("renders stats successfully", async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({ 
      ok: true, 
      json: () => Promise.resolve({ perfilArtista: { id: "art-1" } }) 
    } as any);
    
    // Promise.all responses
    vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as any); // eventos
    vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStats) } as any); // stats

    render(<PaginaEstadisticas />);
    
    await waitFor(() => {
      expect(screen.getByText("Estadísticas Globales")).toBeInTheDocument();
    });

    expect(screen.getByTestId("stats-metric-cards")).toBeInTheDocument();
    expect(screen.getByTestId("genres-chart-card")).toBeInTheDocument();
    expect(screen.getByTestId("songs-analysis-card")).toBeInTheDocument();
    expect(screen.getByText("Big Party")).toBeInTheDocument();
    
    // test event switch
    fireEvent.click(screen.getByText("Ver por Evento"));
    expect(mockRouter.push).toHaveBeenCalledWith("/stats/events");

    // test songs report
    fireEvent.click(screen.getByText("View Report"));
    expect(mockRouter.push).toHaveBeenCalledWith("/stats/songs");
  });

  it("handles error state ui back button", async () => {
    // If we fail and it sets cargando false but estadisticas is null
    vi.mocked(fetchApi).mockRejectedValue(new Error("Network Error"));

    render(<PaginaEstadisticas />);
    
    await waitFor(() => {
      expect(screen.getByText("Error al cargar estadísticas")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Volver al Inicio"));
    expect(mockRouter.push).toHaveBeenCalledWith("/home");
  });

  it("renders stats with empty active events", async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({ 
      ok: true, 
      json: () => Promise.resolve({ perfilArtista: { id: "art-1" } }) 
    } as any);
    
    const mockStatsEmptyEvents = {
      ...mockStats,
      eventosMasActivos: []
    };

    vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as any); // eventos
    vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStatsEmptyEvents) } as any); // stats

    render(<PaginaEstadisticas />);
    
    await waitFor(() => {
      expect(screen.getByText("Estadísticas Globales")).toBeInTheDocument();
    });

    expect(screen.queryByText("Eventos Más Activos")).not.toBeInTheDocument();
  });

  it("handles eventosRes not ok while stats succeeds (line 87)", async () => {
    vi.mocked(fetchApi).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ perfilArtista: { id: "art-1" } })
    } as any);

    // Promise.all responses: eventos fails, stats succeeds
    vi.mocked(fetchApi).mockResolvedValueOnce({ ok: false } as any); // eventos NOT ok
    vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStats) } as any); // stats

    render(<PaginaEstadisticas />);

    await waitFor(() => {
      expect(screen.getByText("Estadísticas Globales")).toBeInTheDocument();
    });

    // Stats should still render despite eventos failure
    expect(screen.getByTestId("stats-metric-cards")).toBeInTheDocument();
    expect(screen.getByTestId("genres-chart-card")).toBeInTheDocument();
    expect(screen.getByTestId("songs-analysis-card")).toBeInTheDocument();
  });
});
