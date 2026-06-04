import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtistDiscovery } from "../ArtistDiscovery";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  fetchApi: vi.fn(),
}));

vi.mock("./ArtistCard", () => ({
  ArtistCard: ({ artista }: any) => <div data-testid="artist-card">{artista.nombre}</div>,
}));

describe("ArtistDiscovery", () => {
  const mockPush = vi.fn();
  let searchParamsMock: Map<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    searchParamsMock = new Map();
    (useSearchParams as any).mockImplementation(() => searchParamsMock);
  });

  it("does not fetch if no user session", () => {
    (useSession as any).mockReturnValue({ data: null });
    render(<ArtistDiscovery />);
    expect(fetchApi).not.toHaveBeenCalled();
    expect(screen.getByText("Buscando talentos...")).toBeInTheDocument();
  });

  it("fetches and renders artists", async () => {
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    (fetchApi as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "1", nombre: "Artist 1" }, { id: "2", nombre: "Artist 2" }],
    });

    render(<ArtistDiscovery />);

    await waitFor(() => {
      expect(screen.queryByText("Buscando talentos...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Descubrir Artistas")).toBeInTheDocument();
    expect(screen.getByText("2 artistas encontrados")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(4);
    expect(screen.getByText("Artist 1")).toBeInTheDocument();
  });

  it("shows empty state when no artists found", async () => {
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    (fetchApi as any).mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<ArtistDiscovery />);

    await waitFor(() => {
      expect(screen.getByText("No se encontraron artistas")).toBeInTheDocument();
    });
  });

  it("shows clean filters button when filters applied and no artists", async () => {
    searchParamsMock.set("termino", "DJ Test");
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    (fetchApi as any).mockResolvedValueOnce({ ok: true, json: async () => [] });
    
    // globalThis.location.pathname mock
    Object.defineProperty(globalThis, "location", {
      value: { pathname: "/discovery" },
      writable: true,
    });

    render(<ArtistDiscovery />);

    await waitFor(() => {
      expect(screen.getByText("Resultados de búsqueda")).toBeInTheDocument();
      expect(screen.getByText("Limpiar filtros")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Limpiar filtros"));
    expect(mockPush).toHaveBeenCalledWith("/discovery");
  });

  it("handles fetch failure gracefully", async () => {
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    (fetchApi as any).mockRejectedValueOnce(new Error("Network Error"));

    render(<ArtistDiscovery />);

    await waitFor(() => {
      expect(screen.getByText("No se encontraron artistas")).toBeInTheDocument();
    });
  });

  it("handles fetch response not ok", async () => {
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    (fetchApi as any).mockResolvedValueOnce({ ok: false });

    render(<ArtistDiscovery />);

    await waitFor(() => {
      expect(screen.getByText("No se encontraron artistas")).toBeInTheDocument();
    });
  });

  it("fetches with search params", async () => {
    searchParamsMock.set("termino", "DJ");
    searchParamsMock.set("pais", "AR");
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    (fetchApi as any).mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<ArtistDiscovery />);

    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/buscar?termino=DJ&paisId=AR&usuarioSolicitanteId=user-1");
    });
  });
});
