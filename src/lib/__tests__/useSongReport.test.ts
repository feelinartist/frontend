import { renderHook, act, waitFor } from "@testing-library/react";
import { useSongReport } from "../useSongReport";
import { toast } from "sonner";
import { vi } from "vitest";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock useDebounce to be synchronous to simplify tests
vi.mock("@/lib/useDebounce", () => ({
  useDebounce: (val: any) => val,
}));

describe("useSongReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch data successfully", async () => {
    const mockData = {
      canciones: [{ id: 1, name: "Song 1" }],
      total: 10,
      totalPages: 2,
    };
    const fetchSongs = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useSongReport(fetchSongs));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData.canciones);
    expect(result.current.total).toBe(mockData.total);
    expect(result.current.totalPages).toBe(mockData.totalPages);
    
    expect(fetchSongs).toHaveBeenCalledWith({
      page: 1,
      search: "",
      sort: "pedidas",
    });
  });

  it("should handle error during fetch", async () => {
    const error = new Error("Fetch error");
    const fetchSongs = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useSongReport(fetchSongs));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith("Error al cargar el reporte de canciones");
    expect(result.current.data).toEqual([]);
  });

  it("should not update state if unmounted", async () => {
    let resolvePromise: any;
    const promise = new Promise<any>((resolve) => {
      resolvePromise = resolve;
    });
    const fetchSongs = vi.fn().mockReturnValue(promise);

    const { result, unmount } = renderHook(() => useSongReport(fetchSongs));

    unmount();
    
    resolvePromise({ canciones: [{ id: 1 }], total: 1, totalPages: 1 });

    // Wait a bit to ensure promises settle
    await new Promise((r) => setTimeout(r, 0));

    expect(result.current.data).toEqual([]);
  });

  it("should update page, search, and sort", async () => {
    const fetchSongs = vi.fn().mockResolvedValue({ canciones: [], total: 0, totalPages: 0 });

    const { result } = renderHook(() => useSongReport(fetchSongs));

    act(() => {
      result.current.setPage(2);
      result.current.setSearch("test");
      result.current.setSort("alfabetico");
    });

    await waitFor(() => {
      expect(fetchSongs).toHaveBeenCalledWith({
        page: 2,
        search: "test",
        sort: "alfabetico",
      });
    });

    expect(result.current.page).toBe(2);
    expect(result.current.search).toBe("test");
    expect(result.current.sort).toBe("alfabetico");
  });
});
