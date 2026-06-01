import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

// --- next-auth ---
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));

// --- next/navigation ---
const pushMock = vi.fn();
const useParamsMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: pushMock }),
    useParams: () => useParamsMock(),
}));

// --- next/link ---
vi.mock("next/link", () => ({
    default: ({ children, href }: any) => React.createElement("a", { href }, children),
}));

// --- fetchApi ---
vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        fetchApi: vi.fn(),
    };
});

// --- sonner ---
vi.mock("sonner", () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// --- UI components ---
vi.mock("@/components/animated-background", () => ({
    AnimatedBackground: () => <div data-testid="animated-bg" />,
}));

vi.mock("@/components/ui/loading-screen", () => ({
    LoadingScreen: () => <div data-testid="loading-screen">Cargando...</div>,
}));

vi.mock("@/components/ui/back-button", () => ({
    BackButton: ({ href }: any) => <a href={href} data-testid="back-button">Atrás</a>,
}));

vi.mock("@/components/ui/card", () => ({
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardHeader: ({ children }: any) => <div>{children}</div>,
    CardTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
    CardDescription: ({ children }: any) => <p>{children}</p>,
    CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
    Button: ({ children, onClick, disabled, ...rest }: any) => (
        <button onClick={onClick} disabled={disabled} {...rest}>
            {children}
        </button>
    ),
}));

vi.mock("@/components/ui/input", () => ({
    Input: (props: any) => <input {...props} />,
}));

// --- Stats sub-components (EventDetailPage deps) ---
vi.mock("@/components/stats/StatsMetricCards", () => ({
    StatsMetricCards: ({ totalPedidos }: any) => (
        <div data-testid="metric-cards">Metrics: {totalPedidos}</div>
    ),
}));

vi.mock("@/components/stats/GenresChartCard", () => ({
    GenresChartCard: ({ generosPorConteo }: any) => (
        <div data-testid="genres-chart">Genres: {generosPorConteo?.length ?? 0}</div>
    ),
}));

vi.mock("@/components/stats/SongsAnalysisCard", () => ({
    SongsAnalysisCard: ({ onViewReport }: any) => (
        <button data-testid="songs-analysis" onClick={onViewReport}>
            Songs Analysis
        </button>
    ),
}));

// --- SongDetailsTable (used by GlobalSongsPage and EventSongsPage) ---
vi.mock("@/components/stats/song-details-table", () => ({
    SongDetailsTable: ({
        data,
        totalPoints,
        page,
        totalPages,
        isLoading,
        onPageChange,
        onSearchChange,
        onSortChange,
        currentSort,
        currentSearch,
    }: any) => (
        <div data-testid="song-details-table">
            <span data-testid="sdt-loading">{isLoading ? "loading" : "ready"}</span>
            <span data-testid="sdt-total">{totalPoints}</span>
            <span data-testid="sdt-page">{page}</span>
            <span data-testid="sdt-totalPages">{totalPages}</span>
            <span data-testid="sdt-sort">{currentSort}</span>
            <span data-testid="sdt-search">{currentSearch}</span>
            <span data-testid="sdt-count">{data?.length ?? 0}</span>
            <button data-testid="sdt-next-page" onClick={() => onPageChange(page + 1)}>
                next
            </button>
            <button data-testid="sdt-search-btn" onClick={() => onSearchChange("test")}>
                search
            </button>
            <button data-testid="sdt-sort-btn" onClick={() => onSortChange("artista")}>
                sort
            </button>
        </div>
    ),
}));

/* ------------------------------------------------------------------ */
/*  Lazy imports of pages under test                                   */
/* ------------------------------------------------------------------ */

// We import lazily so that vi.mock takes effect first
import GlobalSongsPage from "../songs/page";
import EventListPage from "../events/page";
import EventDetailPage from "../events/[eventoId]/page";
import EventSongsPage from "../events/[eventoId]/songs/page";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const mockSession = {
    data: {
        user: { id: "user-1", name: "Artist A", rol: "ARTISTA" },
    },
};
const mockProfile = { perfilArtista: { id: "artist-1" } };
const mockNoArtistProfile = { perfilArtista: null };

const OK = (body: any) =>
    Promise.resolve({ ok: true, json: async () => body });
const FAIL = () => Promise.resolve({ ok: false });

function setupSession(session = mockSession) {
    (useSession as any).mockReturnValue(session);
}

function setupNoSession() {
    (useSession as any).mockReturnValue({ data: null });
}

/* ------------------------------------------------------------------ */
/*  1. GlobalSongsPage  (stats/songs/page.tsx)                         */
/* ------------------------------------------------------------------ */

describe("GlobalSongsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
        setupSession();
        useParamsMock.mockReturnValue({});
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders loading state and then song table after successful fetch", async () => {
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil"))
                return OK(mockProfile);
            if (url.includes("/api/estadisticas/artista"))
                return OK({ canciones: [{ titulo: "Song1" }], total: 1, totalPages: 1 });
            return FAIL();
        });

        render(<GlobalSongsPage />);

        // SongDetailsTable should eventually show ready
        await waitFor(() => {
            expect(screen.getByTestId("sdt-loading")).toHaveTextContent("ready");
        });
        expect(screen.getByTestId("sdt-count")).toHaveTextContent("1");
        expect(screen.getByTestId("sdt-total")).toHaveTextContent("1");
    });

    it("does not fetch songs when perfilArtistaId is missing", async () => {
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil"))
                return OK(mockNoArtistProfile);
            return FAIL();
        });

        render(<GlobalSongsPage />);

        await waitFor(() => {
            expect(screen.getByTestId("sdt-loading")).toHaveTextContent("ready");
        });

        // Should only have called the profile endpoint, not the songs endpoint
        const calls = (fetchApi as any).mock.calls;
        expect(calls.some((c: string[]) => c[0].includes("/api/estadisticas/artista"))).toBe(false);
    });

    it("shows toast error when profile fetch fails", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchApi as any).mockImplementation(() => FAIL());

        render(<GlobalSongsPage />);

        const { toast } = await import("sonner");
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al cargar el reporte de canciones");
        });
        consoleSpy.mockRestore();
    });

    it("shows toast error when songs fetch fails", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil"))
                return OK(mockProfile);
            if (url.includes("/api/estadisticas/artista"))
                return FAIL();
            return FAIL();
        });

        render(<GlobalSongsPage />);

        const { toast } = await import("sonner");
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al cargar el reporte de canciones");
        });
        consoleSpy.mockRestore();
    });

    it("shows toast error on network exception", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchApi as any).mockRejectedValue(new Error("Network failure"));

        render(<GlobalSongsPage />);

        const { toast } = await import("sonner");
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al cargar el reporte de canciones");
        });
        consoleSpy.mockRestore();
    });

    it("does not fetch when there is no session", async () => {
        setupNoSession();

        render(<GlobalSongsPage />);

        // fetchApi should never be called since session?.user?.id is falsy
        expect(fetchApi).not.toHaveBeenCalled();
    });

    it("propagates page/search/sort changes via SongDetailsTable callbacks", async () => {
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil"))
                return OK(mockProfile);
            if (url.includes("/api/estadisticas/artista"))
                return OK({ canciones: [], total: 0, totalPages: 0 });
            return FAIL();
        });

        render(<GlobalSongsPage />);

        await waitFor(() => {
            expect(screen.getByTestId("sdt-loading")).toHaveTextContent("ready");
        });

        // Change sort
        fireEvent.click(screen.getByTestId("sdt-sort-btn"));
        await waitFor(() => {
            expect(screen.getByTestId("sdt-sort")).toHaveTextContent("artista");
        });

        // Change page
        fireEvent.click(screen.getByTestId("sdt-next-page"));
        await waitFor(() => {
            expect(screen.getByTestId("sdt-page")).toHaveTextContent("2");
        });

        // Change search (triggers debounce)
        fireEvent.click(screen.getByTestId("sdt-search-btn"));
        await waitFor(() => {
            expect(screen.getByTestId("sdt-search")).toHaveTextContent("test");
        });
    });

    it("renders header and static content", async () => {
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil"))
                return OK(mockProfile);
            if (url.includes("/api/estadisticas/artista"))
                return OK({ canciones: [], total: 0, totalPages: 0 });
            return FAIL();
        });

        render(<GlobalSongsPage />);

        await waitFor(() => {
            expect(screen.getByTestId("sdt-loading")).toHaveTextContent("ready");
        });

        expect(screen.getByText("Reporte Detallado de Canciones")).toBeInTheDocument();
        expect(screen.getByText("Historial de Canciones")).toBeInTheDocument();
        expect(screen.getByText("Visualiza y filtra todo el historial de pedidos")).toBeInTheDocument();
        expect(screen.getByTestId("back-button")).toHaveAttribute("href", "/stats");
        expect(screen.getByTestId("animated-bg")).toBeInTheDocument();
    });
});

/* ------------------------------------------------------------------ */
/*  2. EventListPage  (stats/events/page.tsx)                          */
/* ------------------------------------------------------------------ */

describe("EventListPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupSession();
        useParamsMock.mockReturnValue({});
    });

    const mockEvents = (overrides: Partial<any>[] = []) => {
        const defaults = [
            {
                id: "evt-1",
                titulo: "Rock Night",
                horaInicio: "2026-01-15T20:00:00Z",
                horaFin: null,
                totalPedidos: 50,
                totalAceptados: 40,
                totalRechazados: 10,
                tasaAceptacion: 80,
            },
            {
                id: "evt-2",
                titulo: "Jazz Evening",
                horaInicio: "2026-02-10T19:00:00Z",
                horaFin: "2026-02-10T23:00:00Z",
                totalPedidos: 30,
                totalAceptados: 15,
                totalRechazados: 15,
                tasaAceptacion: 50,
            },
            {
                id: "evt-3",
                titulo: "Pop Festival",
                horaInicio: "2026-03-20T18:00:00Z",
                horaFin: null,
                totalPedidos: 20,
                totalAceptados: 5,
                totalRechazados: 15,
                tasaAceptacion: 25,
            },
        ];
        return overrides.length ? overrides : defaults;
    };

    function setupEventListFetch(eventos: any[], totalPages = 1) {
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil"))
                return OK(mockProfile);
            if (url.includes("/api/eventos/artista"))
                return OK({ eventos, totalPages });
            return FAIL();
        });
    }

    it("renders loading screen initially", () => {
        (fetchApi as any).mockReturnValue(new Promise(() => {})); // never resolves
        render(<EventListPage />);
        expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
    });

    it("renders event list after successful fetch", async () => {
        setupEventListFetch(mockEvents());

        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.getByText("Rock Night")).toBeInTheDocument();
        });

        expect(screen.getByText("Jazz Evening")).toBeInTheDocument();
        expect(screen.getByText("Pop Festival")).toBeInTheDocument();
        expect(screen.getByText("Mis Eventos")).toBeInTheDocument();
    });

    it("applies correct color class for tasaAceptacion >= 70 (green)", async () => {
        setupEventListFetch(mockEvents());
        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.getByText("80%")).toBeInTheDocument();
        });

        expect(screen.getByText("80%")).toHaveClass("text-green-500");
    });

    it("applies correct color class for tasaAceptacion >= 40 and < 70 (yellow)", async () => {
        setupEventListFetch(mockEvents());
        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.getByText("50%")).toBeInTheDocument();
        });

        expect(screen.getByText("50%")).toHaveClass("text-yellow-500");
    });

    it("applies correct color class for tasaAceptacion < 40 (red)", async () => {
        setupEventListFetch(mockEvents());
        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.getByText("25%")).toBeInTheDocument();
        });

        expect(screen.getByText("25%")).toHaveClass("text-red-500");
    });

    it("navigates to event detail on row click", async () => {
        setupEventListFetch(mockEvents());
        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.getByText("Rock Night")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Rock Night"));
        expect(pushMock).toHaveBeenCalledWith("/stats/events/evt-1");
    });

    it("renders pagination when totalPages > 1", async () => {
        setupEventListFetch(mockEvents(), 3);
        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
        });
    });

    it("does not render pagination when totalPages is 1", async () => {
        setupEventListFetch(mockEvents(), 1);
        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.getByText("Rock Night")).toBeInTheDocument();
        });

        expect(screen.queryByText(/Página/)).not.toBeInTheDocument();
    });

    it("handles search input and resets page to 1", async () => {
        setupEventListFetch(mockEvents(), 2);
        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.getByText("Rock Night")).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText("Buscar evento...");
        fireEvent.change(input, { target: { value: "jazz" } });

        // After typing search, fetchApi should be called again with search param
        await waitFor(() => {
            const calls = (fetchApi as any).mock.calls;
            const eventCalls = calls.filter((c: string[]) =>
                c[0].includes("/api/eventos/artista")
            );
            const lastCall = eventCalls[eventCalls.length - 1][0];
            expect(lastCall).toContain("search=jazz");
        });
    });

    it("handles pagination prev/next clicks", async () => {
        setupEventListFetch(mockEvents(), 3);
        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
        });

        // The prev button should be disabled on page 1
        const buttons = screen.getAllByRole("button");
        // Find buttons in pagination area (ChevronLeft and ChevronRight)
        const paginationButtons = buttons.filter(
            (b) => !b.textContent?.includes("Buscar")
        );
        // last 2 buttons are the pagination buttons
        const prevBtn = paginationButtons[paginationButtons.length - 2];
        const nextBtn = paginationButtons[paginationButtons.length - 1];

        expect(prevBtn).toBeDisabled();

        fireEvent.click(nextBtn);

        await waitFor(() => {
            expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
        });
    });

    it("early returns when perfilArtista.id is missing", async () => {
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil"))
                return OK(mockNoArtistProfile);
            return FAIL();
        });

        render(<EventListPage />);

        // Should still stop loading eventually
        await waitFor(() => {
            expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
        });

        // Should not have called events endpoint
        const calls = (fetchApi as any).mock.calls;
        expect(
            calls.some((c: string[]) => c[0].includes("/api/eventos/artista"))
        ).toBe(false);
    });

    it("handles profile fetch failure", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchApi as any).mockImplementation(() => FAIL());

        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
        });
        consoleSpy.mockRestore();
    });

    it("handles events fetch failure gracefully", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil"))
                return OK(mockProfile);
            if (url.includes("/api/eventos/artista"))
                return FAIL();
            return FAIL();
        });

        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
        });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it("handles network exception during fetch", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchApi as any).mockRejectedValue(new Error("Network error"));

        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
        });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it("does not fetch when there is no session", () => {
        setupNoSession();
        (fetchApi as any).mockReturnValue(new Promise(() => {}));
        render(<EventListPage />);
        // With no session, fetchApi should not be called
        expect(fetchApi).not.toHaveBeenCalled();
    });

    it("renders BackButton with /stats href and header text", async () => {
        setupEventListFetch(mockEvents());
        render(<EventListPage />);

        await waitFor(() => {
            expect(screen.getByText("Mis Eventos")).toBeInTheDocument();
        });
        expect(screen.getByTestId("back-button")).toHaveAttribute("href", "/stats");
        expect(screen.getByText("Selecciona un evento para ver sus estadísticas")).toBeInTheDocument();
    });
});

/* ------------------------------------------------------------------ */
/*  3. EventDetailPage  (stats/events/[eventoId]/page.tsx)             */
/* ------------------------------------------------------------------ */

describe("EventDetailPage", () => {
    const mockStats = {
        totalPedidos: 100,
        totalAceptados: 70,
        totalRechazados: 30,
        tasaAceptacion: 70,
        generosPorConteo: [{ genero: "Rock", conteo: 5, porcentaje: 50 }],
        topCanciones: [],
        topAceptadas: [],
        topRechazadas: [],
        evento: {
            titulo: "Rock Night 2026",
            horaInicio: "2026-06-15T20:00:00Z",
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        setupSession();
        useParamsMock.mockReturnValue({ eventoId: "evt-123" });
        // EventDetailPage uses global fetch, not fetchApi
        vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve({
            ok: true,
            json: async () => mockStats,
        } as Response));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shows loading screen while fetching", () => {
        vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));
        render(<EventDetailPage />);
        expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
    });

    it("renders event stats after successful fetch", async () => {
        render(<EventDetailPage />);

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /Rock Night 2026/i })).toBeInTheDocument();
        });

        expect(screen.getByTestId("metric-cards")).toHaveTextContent("Metrics: 100");
        expect(screen.getByTestId("genres-chart")).toBeInTheDocument();
        expect(screen.getByTestId("songs-analysis")).toBeInTheDocument();
    });

    it("renders breadcrumb links", async () => {
        render(<EventDetailPage />);

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /Rock Night 2026/i })).toBeInTheDocument();
        });

        expect(screen.getByText("Estadísticas")).toHaveAttribute("href", "/stats");
        expect(screen.getByText("Eventos")).toHaveAttribute("href", "/stats/events");
    });

    it("renders 'Evento' when estadisticas.evento.titulo is undefined", async () => {
        const statsNoTitle = { ...mockStats, evento: { titulo: undefined, horaInicio: "2026-06-15T20:00:00Z" } };
        vi.spyOn(globalThis, "fetch").mockImplementation(() =>
            Promise.resolve({ ok: true, json: async () => statsNoTitle } as Response)
        );

        render(<EventDetailPage />);

        await waitFor(() => {
            // The breadcrumb fallback
            expect(screen.getByText("Evento")).toBeInTheDocument();
        });
    });

    it("handles horaInicio being falsy (no date displayed)", async () => {
        const statsNoDate = { ...mockStats, evento: { titulo: "Test", horaInicio: null } };
        vi.spyOn(globalThis, "fetch").mockImplementation(() =>
            Promise.resolve({ ok: true, json: async () => statsNoDate } as Response)
        );

        render(<EventDetailPage />);

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /Test/i })).toBeInTheDocument();
        });
    });

    it("navigates to songs page when onViewReport is called", async () => {
        render(<EventDetailPage />);

        await waitFor(() => {
            expect(screen.getByTestId("songs-analysis")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId("songs-analysis"));
        expect(pushMock).toHaveBeenCalledWith("/stats/events/evt-123/songs");
    });

    it("returns null when estadisticas is null after loading", async () => {
        vi.spyOn(globalThis, "fetch").mockImplementation(() =>
            Promise.resolve({ ok: false } as Response)
        );
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const { container } = render(<EventDetailPage />);

        await waitFor(() => {
            expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
        });

        // When estadisticas is null, component returns null
        expect(container.innerHTML).toBe("");
        consoleSpy.mockRestore();
    });

    it("handles fetch exception gracefully", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

        const { container } = render(<EventDetailPage />);

        await waitFor(() => {
            expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
        });

        expect(container.innerHTML).toBe("");
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it("does not fetch when there is no session", () => {
        setupNoSession();
        vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve({
            ok: true,
            json: async () => mockStats,
        } as Response));

        render(<EventDetailPage />);
        // Loading screen since cargando starts true and cargarEstadisticas never runs
        expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
    });

    it("does not fetch when eventoId is undefined", () => {
        useParamsMock.mockReturnValue({});
        vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve({
            ok: true,
            json: async () => mockStats,
        } as Response));

        render(<EventDetailPage />);
        expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
    });

    it("renders BackButton with correct href", async () => {
        render(<EventDetailPage />);

        await waitFor(() => {
            expect(screen.getByTestId("back-button")).toBeInTheDocument();
        });
        expect(screen.getByTestId("back-button")).toHaveAttribute("href", "/stats/events");
    });
});

/* ------------------------------------------------------------------ */
/*  4. EventSongsPage  (stats/events/[eventoId]/songs/page.tsx)        */
/* ------------------------------------------------------------------ */

describe("EventSongsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
        setupSession();
        useParamsMock.mockReturnValue({ eventoId: "evt-456" });

        // EventSongsPage uses global fetch
        vi.spyOn(globalThis, "fetch").mockImplementation((url: any) => {
            const urlStr = typeof url === "string" ? url : url.toString();
            if (urlStr.includes("/api/estadisticas/evento/evt-456/canciones")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        canciones: [{ titulo: "Song A" }, { titulo: "Song B" }],
                        total: 2,
                        totalPages: 1,
                    }),
                } as Response);
            }
            if (urlStr.includes("/api/estadisticas/evento/evt-456")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ eventoTitulo: "My Great Event" }),
                } as Response);
            }
            return Promise.resolve({ ok: false } as Response);
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("renders loading state and then song table after fetch", async () => {
        render(<EventSongsPage />);

        await waitFor(() => {
            expect(screen.getByTestId("sdt-loading")).toHaveTextContent("ready");
        });

        expect(screen.getByTestId("sdt-count")).toHaveTextContent("2");
        expect(screen.getByTestId("sdt-total")).toHaveTextContent("2");
    });

    it("renders event name in the header", async () => {
        render(<EventSongsPage />);

        await waitFor(() => {
            expect(screen.getByText(/Reporte: My Great Event/)).toBeInTheDocument();
        });
    });

    it("shows 'Cargando...' when event name has not loaded yet", () => {
        // Delay everything so eventName stays empty
        vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));
        render(<EventSongsPage />);

        expect(screen.getByText(/Reporte: Cargando.../)).toBeInTheDocument();
    });

    it("shows toast error when songs fetch fails", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(globalThis, "fetch").mockImplementation((url: any) => {
            const urlStr = typeof url === "string" ? url : url.toString();
            if (urlStr.includes("/canciones"))
                return Promise.resolve({ ok: false } as Response);
            if (urlStr.includes("/api/estadisticas/evento"))
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ eventoTitulo: "Test" }),
                } as Response);
            return Promise.resolve({ ok: false } as Response);
        });

        render(<EventSongsPage />);

        const { toast } = await import("sonner");
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al cargar el reporte de canciones");
        });
        consoleSpy.mockRestore();
    });

    it("shows toast error on network exception for songs", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network"));

        render(<EventSongsPage />);

        const { toast } = await import("sonner");
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al cargar el reporte de canciones");
        });
        consoleSpy.mockRestore();
    });

    it("handles event details fetch failure silently (only console.error)", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(globalThis, "fetch").mockImplementation((url: any) => {
            const urlStr = typeof url === "string" ? url : url.toString();
            if (urlStr.includes("/canciones")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ canciones: [], total: 0, totalPages: 0 }),
                } as Response);
            }
            // Event details throws
            return Promise.reject(new Error("Event details failed"));
        });

        render(<EventSongsPage />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        // Should still show Cargando since eventName was never set
        expect(screen.getByText(/Reporte: Cargando.../)).toBeInTheDocument();
        consoleSpy.mockRestore();
    });

    it("handles event details non-ok response (no crash, no title set)", async () => {
        vi.spyOn(globalThis, "fetch").mockImplementation((url: any) => {
            const urlStr = typeof url === "string" ? url : url.toString();
            if (urlStr.includes("/canciones")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ canciones: [], total: 0, totalPages: 0 }),
                } as Response);
            }
            // Event details returns non-ok
            return Promise.resolve({ ok: false } as Response);
        });

        render(<EventSongsPage />);

        await waitFor(() => {
            expect(screen.getByTestId("sdt-loading")).toHaveTextContent("ready");
        });
        // eventName stays empty
        expect(screen.getByText(/Reporte: Cargando.../)).toBeInTheDocument();
    });

    it("does not fetch when there is no session", () => {
        setupNoSession();
        render(<EventSongsPage />);
        // SongDetailsTable still renders but data is empty (defaults)
        expect(screen.getByTestId("sdt-loading")).toHaveTextContent("loading");
    });

    it("propagates page/sort/search changes", async () => {
        render(<EventSongsPage />);

        await waitFor(() => {
            expect(screen.getByTestId("sdt-loading")).toHaveTextContent("ready");
        });

        fireEvent.click(screen.getByTestId("sdt-sort-btn"));
        await waitFor(() => {
            expect(screen.getByTestId("sdt-sort")).toHaveTextContent("artista");
        });

        fireEvent.click(screen.getByTestId("sdt-next-page"));
        await waitFor(() => {
            expect(screen.getByTestId("sdt-page")).toHaveTextContent("2");
        });
    });

    it("renders BackButton with event-specific href", async () => {
        render(<EventSongsPage />);

        await waitFor(() => {
            expect(screen.getByTestId("back-button")).toBeInTheDocument();
        });
        expect(screen.getByTestId("back-button")).toHaveAttribute("href", "/stats/events/evt-456");
    });

    it("renders card header with correct text", async () => {
        render(<EventSongsPage />);

        await waitFor(() => {
            expect(screen.getByTestId("sdt-loading")).toHaveTextContent("ready");
        });

        expect(screen.getByText("Historial del Evento")).toBeInTheDocument();
        expect(screen.getByText("Visualiza todas las canciones solicitadas durante este evento")).toBeInTheDocument();
    });

    it("renders static descriptive text", async () => {
        render(<EventSongsPage />);

        await waitFor(() => {
            expect(screen.getByTestId("sdt-loading")).toHaveTextContent("ready");
        });

        expect(screen.getByText("Detalle de pedidos para este evento específico.")).toBeInTheDocument();
    });
});
