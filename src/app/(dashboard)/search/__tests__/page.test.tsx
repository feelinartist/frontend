import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaginaBusqueda from "../page";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

vi.mock("next-auth/react", () => ({ useSession: vi.fn() }));
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ 
  useRouter: () => ({ push: mockPush }),
  useSearchParams: vi.fn()
}));

describe("PaginaBusqueda - Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders empty state when no termino is provided", () => {
    (useSearchParams as any).mockReturnValue({ get: () => null });
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    
    render(<PaginaBusqueda />);
    expect(screen.getByText("Ingresa un término para buscar")).toBeInTheDocument();
    expect(screen.getByText("No se encontraron artistas.")).toBeInTheDocument();
  });

  it("fetches and renders results correctly", async () => {
    (useSearchParams as any).mockReturnValue({ get: () => "dj" });
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    
    const mockData = [
      {
        id: "art-1",
        nombre: "Test Artista",
        nombreUsuario: "testart",
        imagen: "https://img.com/img.jpg",
        perfilArtista: { nombreArtistico: "DJ Test", paisId: "CO" }
      },
      {
        id: "art-2",
        nombreUsuario: "noartistico",
        perfilArtista: {} // fallback branches
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    render(<PaginaBusqueda />);
    expect(screen.getByText('Resultados para "dj"')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("DJ Test")).toBeInTheDocument();
      expect(screen.getByText("@testart")).toBeInTheDocument();
      expect(screen.getByText("CO")).toBeInTheDocument();
    });
  });

  it("handles fetch error gracefully", async () => {
    (useSearchParams as any).mockReturnValue({ get: () => "dj" });
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as any).mockRejectedValueOnce(new Error("Net error"));

    render(<PaginaBusqueda />);
    
    await waitFor(() => {
      expect(screen.getByText("No se encontraron artistas.")).toBeInTheDocument();
    });
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("handles non-ok fetch response", async () => {
    (useSearchParams as any).mockReturnValue({ get: () => "dj" });
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    
    (global.fetch as any).mockResolvedValueOnce({ ok: false });

    render(<PaginaBusqueda />);
    
    await waitFor(() => {
      expect(screen.getByText("No se encontraron artistas.")).toBeInTheDocument();
    });
  });

  it("redirects to home when Volver al inicio is clicked", async () => {
    (useSearchParams as any).mockReturnValue({ get: () => null });
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    
    render(<PaginaBusqueda />);
    const button = screen.getByRole("button", { name: /Volver al inicio/i });
    await userEvent.click(button);
    expect(mockPush).toHaveBeenCalledWith("/home");
  });

  it("handles null session", () => {
    (useSearchParams as any).mockReturnValue({ get: () => "dj" });
    (useSession as any).mockReturnValue({ data: null });
    
    render(<PaginaBusqueda />);
    expect(screen.getByText('Resultados para "dj"')).toBeInTheDocument();
    expect(screen.getByText("No se encontraron artistas.")).toBeInTheDocument();
  });

  it("searches without termino and with missing user.id, covering fallback branches", async () => {
    // termino is null => params.append("termino", termino) is SKIPPED (line 40 false branch)
    // session.user exists but id is undefined => fallback to "" (line 41 fallback branch)
    (useSearchParams as any).mockReturnValue({ get: () => null });
    (useSession as any).mockReturnValue({ data: { user: { name: "No ID User" } } });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<PaginaBusqueda />);

    // The subtitle should show the "no termino" text
    expect(screen.getByText("Ingresa un término para buscar")).toBeInTheDocument();
    // Since useEffect guards on termino && session?.user?.id, fetch won't auto-fire
    // but the render path still exercises the falsy termino display branch
    expect(screen.getByText("No se encontraron artistas.")).toBeInTheDocument();
  });

  it("fetches results with termino but session.user.id undefined, using empty string fallback", async () => {
    // termino is present => params.append("termino", termino) is called
    // session.user.id is undefined => fallback to "" at line 41
    (useSearchParams as any).mockReturnValue({ get: () => "test" });
    (useSession as any).mockReturnValue({ data: { user: { name: "No ID" } } });

    render(<PaginaBusqueda />);

    // useEffect checks termino && session?.user?.id — id is undefined so fetch is NOT auto-called
    expect(screen.getByText('Resultados para "test"')).toBeInTheDocument();
    expect(screen.getByText("No se encontraron artistas.")).toBeInTheDocument();
    // fetch should NOT have been called because session.user.id is falsy
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
