import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaginaBusqueda from "../page";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

// --- Stable mock references ---
const mockPush = vi.fn();
const mockRouter = { push: mockPush, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn(), forward: vi.fn() };
const mockGet = vi.fn();

// --- Mocks ---
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useSearchParams: vi.fn(),
    useRouter: () => mockRouter,
}));

vi.mock("next/link", () => ({
    default: ({ children, href }: any) => React.createElement("a", { href }, children),
}));

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
    Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
    CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("@/components/ui/avatar", () => ({
    Avatar: ({ children, className }: any) => <div className={className} data-testid="avatar">{children}</div>,
    AvatarImage: ({ src, alt }: any) => <img src={src || undefined} alt={alt} data-testid="avatar-image" />,
    AvatarFallback: ({ children, className }: any) => <span className={className} data-testid="avatar-fallback">{children}</span>,
}));

vi.mock("@/components/ui/button", () => ({
    Button: ({ children, onClick, ...rest }: any) => (
        <button onClick={onClick} data-testid="button" {...rest}>{children}</button>
    ),
}));

describe("PaginaBusqueda (search page)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: authenticated session, search term present
        (useSession as any).mockReturnValue({
            data: { user: { id: "user-123" } },
        });
        (useSearchParams as any).mockReturnValue({ get: mockGet });
        mockGet.mockReturnValue("rock");
        vi.stubGlobal("fetch", vi.fn());
    });

    // ── Structural / Suspense ──────────────────────────────────────────────

    it("renders AnimatedBackground and Suspense wrapper", () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
        render(<PaginaBusqueda />);
        expect(screen.getByTestId("animated-bg")).toBeInTheDocument();
    });

    it("renders BackButton with href /home", () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
        render(<PaginaBusqueda />);
        expect(screen.getByTestId("back-button")).toHaveAttribute("href", "/home");
    });

    // ── No termino ────────────────────────────────────────────────────────

    it("shows 'Ingresa un término para buscar' when termino is null", () => {
        mockGet.mockReturnValue(null);
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
        render(<PaginaBusqueda />);
        expect(screen.getByText("Ingresa un término para buscar")).toBeInTheDocument();
    });

    it("does NOT call fetch when termino is null", async () => {
        mockGet.mockReturnValue(null);
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
        render(<PaginaBusqueda />);
        // Give time for potential async calls
        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    it("does NOT call fetch when session user id is missing", async () => {
        (useSession as any).mockReturnValue({ data: null });
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    // ── Termino present text ──────────────────────────────────────────────

    it("shows 'Resultados para \"rock\"' when termino is provided", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText('Resultados para "rock"')).toBeInTheDocument();
        });
    });

    it("renders heading 'Resultados de búsqueda'", () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
        render(<PaginaBusqueda />);
        expect(screen.getByText("Resultados de búsqueda")).toBeInTheDocument();
    });

    // ── Loading state ─────────────────────────────────────────────────────

    it("shows loading spinner while fetching", async () => {
        // Never-resolving fetch to keep loading state
        (fetch as any).mockReturnValue(new Promise(() => {}));
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText("Resultados de búsqueda")).toBeInTheDocument();
        });
        // The Loader2 icon renders with animate-spin
        const spinner = document.querySelector(".animate-spin");
        expect(spinner).toBeInTheDocument();
    });

    // ── Empty results ─────────────────────────────────────────────────────

    it("shows empty state when no results returned", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText("No se encontraron artistas.")).toBeInTheDocument();
        });
    });

    it("navigates to /home when 'Volver al inicio' button is clicked", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText("Volver al inicio")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText("Volver al inicio"));
        expect(mockPush).toHaveBeenCalledWith("/home");
    });

    // ── Results rendering ─────────────────────────────────────────────────

    const mockArtists = [
        {
            id: "a1",
            nombre: "Carlos",
            nombreUsuario: "carlos_music",
            imagen: "https://img.test/carlos.jpg",
            perfilArtista: {
                nombreArtistico: "DJ Carlos",
                paisId: "CO",
            },
        },
        {
            id: "a2",
            nombre: "Ana",
            nombreUsuario: "ana_band",
            imagen: "",
            perfilArtista: {
                nombreArtistico: "",
                paisId: "",
            },
        },
        {
            id: "a3",
            nombre: undefined,
            nombreUsuario: "unknown_user",
            imagen: undefined,
            perfilArtista: undefined,
        },
    ];

    it("renders artist cards when results are returned", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => mockArtists });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getAllByTestId("card")).toHaveLength(3);
        });
    });

    it("uses nombreArtistico in Link href when available", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[0]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            const link = screen.getByRole("link", { name: /DJ Carlos/i });
            expect(link).toHaveAttribute("href", "/artist/DJ Carlos");
        });
    });

    it("falls back to nombreUsuario in Link href when nombreArtistico is falsy", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[1]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            const link = screen.getByRole("link", { name: /ana_band/i });
            expect(link).toHaveAttribute("href", "/artist/ana_band");
        });
    });

    it("falls back to nombreUsuario in Link href when perfilArtista is undefined", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[2]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            const link = screen.getByRole("link", { name: /unknown_user/i });
            expect(link).toHaveAttribute("href", "/artist/unknown_user");
        });
    });

    it("displays nombreArtistico as the artist heading when available", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[0]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText("DJ Carlos")).toBeInTheDocument();
        });
    });

    it("falls back to nombre as the artist heading when nombreArtistico is falsy", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[1]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText("Ana")).toBeInTheDocument();
        });
    });

    it("displays @nombreUsuario for each artist", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[0]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText("@carlos_music")).toBeInTheDocument();
        });
    });

    it("shows paisId with MapPin when paisId is present", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[0]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText("CO")).toBeInTheDocument();
        });
        // Also ensure the separator dot is present
        expect(screen.getByText("•")).toBeInTheDocument();
    });

    it("does NOT show paisId section when paisId is empty", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[1]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText("Ana")).toBeInTheDocument();
        });
        expect(screen.queryByText("•")).not.toBeInTheDocument();
    });

    it("does NOT show paisId section when perfilArtista is undefined", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[2]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText("@unknown_user")).toBeInTheDocument();
        });
        expect(screen.queryByText("•")).not.toBeInTheDocument();
    });

    // ── Avatar fallback ───────────────────────────────────────────────────

    it("shows first letter of nombre uppercased as avatar fallback", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[0]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText("C")).toBeInTheDocument();
        });
    });

    it("shows 'A' as avatar fallback when nombre is undefined", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[2]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            // The fallback 'A' should be present
            const fallbacks = screen.getAllByTestId("avatar-fallback");
            expect(fallbacks[0].textContent).toBe("A");
        });
    });

    // ── Avatar image ──────────────────────────────────────────────────────

    it("passes imagen to AvatarImage src", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[0]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            const img = screen.getAllByTestId("avatar-image")[0];
            expect(img).toHaveAttribute("src", "https://img.test/carlos.jpg");
        });
    });

    it("passes empty string to AvatarImage src when imagen is falsy", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[1]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            const img = screen.getAllByTestId("avatar-image")[0];
            // Next/Image mock returns undefined/null for empty src to avoid DOM warnings
            expect(img.getAttribute('src')).toBeNull();
        });
    });

    // ── Fetch mechanics ───────────────────────────────────────────────────

    it("calls fetch with correct URL including termino and user id", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
        });
        const calledUrl: string = (fetch as any).mock.calls[0][0];
        expect(calledUrl).toContain("termino=rock");
        expect(calledUrl).toContain("usuarioSolicitanteId=user-123");
    });

    it("does not set results when response is not ok", async () => {
        (fetch as any).mockResolvedValue({ ok: false });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText("No se encontraron artistas.")).toBeInTheDocument();
        });
    });

    it("handles fetch rejection gracefully (catch branch)", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetch as any).mockRejectedValue(new Error("Network fail"));
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error buscando artistas:", expect.any(Error));
        });
        // Should still show empty state
        expect(screen.getByText("No se encontraron artistas.")).toBeInTheDocument();
        consoleSpy.mockRestore();
    });

    // ── Session user id as empty string fallback ──────────────────────────

    it("passes empty string for user id when session.user.id is absent but termino exists", async () => {
        (useSession as any).mockReturnValue({ data: { user: {} } });
        // With user.id undefined, the effect condition (session?.user?.id) is falsy, so fetch is NOT called
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
        render(<PaginaBusqueda />);
        // Give time - fetch should not be called because user.id is undefined (falsy)
        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    // ── "Artista" label always shown ──────────────────────────────────────

    it("always shows 'Artista' label on each card", async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [mockArtists[0]] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(screen.getByText("Artista")).toBeInTheDocument();
        });
    });

    // ── Environment variable fallback ─────────────────────────────────────

    it("uses NEXT_PUBLIC_BACKEND_URL env var in fetch URL when set", async () => {
        const originalEnv = process.env.NEXT_PUBLIC_BACKEND_URL;
        process.env.NEXT_PUBLIC_BACKEND_URL = "https://api.example.com";
        (fetch as any).mockResolvedValue({ ok: true, json: async () => [] });
        render(<PaginaBusqueda />);
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
        });
        const calledUrl: string = (fetch as any).mock.calls[0][0];
        expect(calledUrl).toContain("https://api.example.com");
        process.env.NEXT_PUBLIC_BACKEND_URL = originalEnv;
    });
});
