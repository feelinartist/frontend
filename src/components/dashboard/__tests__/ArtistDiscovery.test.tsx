import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ArtistDiscovery } from "../ArtistDiscovery";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));

// Mock next/navigation
const mockGetParam = vi.fn();
const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
    useSearchParams: () => ({
        get: mockGetParam,
    }),
    useRouter: () => ({
        push: mockRouterPush,
    }),
}));

// Mock @/lib/api
vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        fetchApi: vi.fn(),
    };
});

// Mock ArtistCard to simplify mounting details
vi.mock("../ArtistCard", () => ({
    ArtistCard: ({ artista }: any) => <div data-testid="mock-artistcard">{artista.nombre}</div>,
}));

describe("ArtistDiscovery Component", () => {
    const mockArtists = [
        { id: "artist-1", nombre: "DJ Alice", nombreUsuario: "alice" },
        { id: "artist-2", nombre: "DJ Bob", nombreUsuario: "bob" },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Default session mock
        (useSession as any).mockReturnValue({
            data: { user: { id: "user-123" } },
        });
        // Default URL params mock
        mockGetParam.mockImplementation((param: string) => {
            if (param === "termino") return "";
            if (param === "pais") return "all";
            return null;
        });
        // Default fetchApi mock
        (fetchApi as any).mockImplementation(async () => ({
            ok: true,
            json: async () => mockArtists,
        }));
        // Mock pathname
        Object.defineProperty(window, "location", {
            value: {
                pathname: "/home",
            },
            writable: true,
            configurable: true,
        });
    });

    it("renders loading state initially and then renders list of artists", async () => {
        render(<ArtistDiscovery />);

        expect(screen.getByText("Buscando talentos...")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText("Buscando talentos...")).not.toBeInTheDocument();
        });

        expect(screen.getByText("Descubrir Artistas")).toBeInTheDocument();
        expect(screen.getByText("2 artistas encontrados")).toBeInTheDocument();
        expect(screen.getAllByTestId("mock-artistcard")).toHaveLength(2);
        expect(screen.getByText("DJ Alice")).toBeInTheDocument();
        expect(screen.getByText("DJ Bob")).toBeInTheDocument();

        expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/buscar?usuarioSolicitanteId=user-123");
    });

    it("includes term and country in search request", async () => {
        mockGetParam.mockImplementation((param: string) => {
            if (param === "termino") return "Techno";
            if (param === "pais") return "CO";
            return null;
        });

        render(<ArtistDiscovery />);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/buscar?termino=Techno&paisId=CO&usuarioSolicitanteId=user-123");
            expect(screen.getByText("Resultados de búsqueda")).toBeInTheDocument();
        });
    });

    it("handles empty results and allows resetting filters", async () => {
        mockGetParam.mockImplementation((param: string) => {
            if (param === "termino") return "Jazz";
            if (param === "pais") return "CO";
            return null;
        });
        (fetchApi as any).mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        render(<ArtistDiscovery />);

        await waitFor(() => {
            expect(screen.getByText("No se encontraron artistas")).toBeInTheDocument();
        });

        const clearBtn = screen.getByRole("button", { name: /limpiar filtros/i });
        expect(clearBtn).toBeInTheDocument();

        fireEvent.click(clearBtn);
        expect(mockRouterPush).toHaveBeenCalledWith("/home");
    });

    it("handles search failure logging error", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchApi as any).mockRejectedValueOnce(new Error("API Down"));

        render(<ArtistDiscovery />);

        await waitFor(() => {
            expect(screen.getByText("No se encontraron artistas")).toBeInTheDocument();
            expect(consoleSpy).toHaveBeenCalledWith("Error buscando artistas:", expect.any(Error));
        });
        consoleSpy.mockRestore();
    });

    it("does not fetch if session user ID is missing", async () => {
        (useSession as any).mockReturnValue({
            data: null,
        });

        render(<ArtistDiscovery />);

        // Loading should finish early or remain since no session is found
        // Wait:
        // if (!session?.user?.id) return;
        // setCargando is set to true. If we return, it remains cargando (true).
        // Let's verify that fetchApi is not called.
        expect(fetchApi).not.toHaveBeenCalled();
    });
});
