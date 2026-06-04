import { renderHook, act } from "@testing-library/react";
import { useSongsFetch } from "../useSongsFetch";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { vi } from "vitest";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  fetchApi: vi.fn(),
}));

vi.mock("@/lib/useDebounce", () => ({
  useDebounce: (val: any) => val,
}));

describe("useSongsFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with defaults", () => {
    const apiEndpoint = vi.fn();
    const { result } = renderHook(() => useSongsFetch({ apiEndpoint }));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.page).toBe(1);
    expect(result.current.search).toBe("");
    expect(result.current.sort).toBe("pedidas");
  });

  it("should not fetch if enabled is false", async () => {
    const apiEndpoint = vi.fn();
    const { result } = renderHook(() =>
      useSongsFetch({ apiEndpoint, enabled: false })
    );

    await act(async () => {
      await result.current.fetchSongs();
    });

    expect(apiEndpoint).not.toHaveBeenCalled();
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it("should fetch data successfully when enabled is true and fetchSongs is called", async () => {
    const apiEndpoint = vi.fn().mockImplementation((params: URLSearchParams) => {
      return `/api/songs?${params.toString()}`;
    });
    const mockData = {
      canciones: [{ titulo: "Test Song", artista: "Test Artist", genero: "Pop", total: 1, aceptados: 1, rechazados: 0, ultimoPedido: "2023-01-01" }],
      total: 1,
      totalPages: 1,
    };

    (fetchApi as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useSongsFetch({ apiEndpoint }));

    await act(async () => {
      await result.current.fetchSongs();
    });

    expect(apiEndpoint).toHaveBeenCalled();
    expect(fetchApi).toHaveBeenCalledWith(expect.stringContaining("/api/songs"));
    expect(result.current.data).toEqual(mockData.canciones);
    expect(result.current.total).toBe(mockData.total);
    expect(result.current.totalPages).toBe(mockData.totalPages);
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle api error (not ok)", async () => {
    const apiEndpoint = vi.fn().mockReturnValue("/api/songs");
    (fetchApi as any).mockResolvedValue({
      ok: false,
    });

    const { result } = renderHook(() => useSongsFetch({ apiEndpoint }));

    await act(async () => {
      await result.current.fetchSongs();
    });

    expect(toast.error).toHaveBeenCalledWith("Error al cargar el reporte de canciones");
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle fetch throwing error", async () => {
    const apiEndpoint = vi.fn().mockReturnValue("/api/songs");
    (fetchApi as any).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSongsFetch({ apiEndpoint }));

    await act(async () => {
      await result.current.fetchSongs();
    });

    expect(toast.error).toHaveBeenCalledWith("Error al cargar el reporte de canciones");
    expect(result.current.isLoading).toBe(false);
  });

  it("should allow updating state values", () => {
    const apiEndpoint = vi.fn();
    const { result } = renderHook(() => useSongsFetch({ apiEndpoint }));

    act(() => {
      result.current.setPage(2);
      result.current.setSearch("search string");
      result.current.setSort("alfabetico");
    });

    expect(result.current.page).toBe(2);
    expect(result.current.search).toBe("search string");
    expect(result.current.sort).toBe("alfabetico");
  });
});
