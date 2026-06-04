import { renderHook, act, waitFor } from "@testing-library/react";
import { useConfigList } from "../useConfigList";
import { fetchApi, parseJsonSafe } from "@/lib/api";
import { vi, Mock } from "vitest";

vi.mock("@/lib/api", () => ({
  fetchApi: vi.fn(),
  parseJsonSafe: vi.fn(),
}));

describe("useConfigList", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("fetches data successfully", async () => {
        (fetchApi as Mock).mockResolvedValue({ ok: true });
        (parseJsonSafe as Mock).mockResolvedValue([{ id: 1 }]);

        const { result } = renderHook(() => useConfigList("/api/test"));

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([{ id: 1 }]);
    });

    it("handles fetch failure (not ok)", async () => {
        (fetchApi as Mock).mockResolvedValue({ ok: false });

        const { result } = renderHook(() => useConfigList("/api/test"));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
    });

    it("handles throw error gracefully with default log", async () => {
        (fetchApi as Mock).mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useConfigList("/api/other"));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
        expect(console.error).toHaveBeenCalledWith("Error loading config /api/other:", expect.any(Error));
    });

    it("handles throw error gracefully with donation specific log", async () => {
        (fetchApi as Mock).mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useConfigList("/api/metodos-donacion"));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(console.error).toHaveBeenCalledWith("Error loading donation methods:", expect.any(Error));
    });

    it("handles throw error gracefully with social specific log", async () => {
        (fetchApi as Mock).mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useConfigList("/api/redes-sociales"));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(console.error).toHaveBeenCalledWith("Error loading social networks:", expect.any(Error));
    });

    it("does not update state if unmounted before fetch completes", async () => {
        let resolveFetch: any;
        (fetchApi as Mock).mockImplementation(() => new Promise(res => {
            resolveFetch = res;
        }));

        const { result, unmount } = renderHook(() => useConfigList("/api/test"));

        unmount();

        resolveFetch({ ok: true });
        
        await new Promise(r => setTimeout(r, 10));

        expect(result.current.data).toEqual([]);
    });

    it("does not update state if unmounted before parse completes", async () => {
        (fetchApi as Mock).mockResolvedValue({ ok: true });
        
        let resolveParse: any;
        (parseJsonSafe as Mock).mockImplementation(() => new Promise(res => {
            resolveParse = res;
        }));

        const { result, unmount } = renderHook(() => useConfigList("/api/test"));

        await waitFor(() => {
            expect(parseJsonSafe).toHaveBeenCalled();
        });

        unmount();

        resolveParse([{ id: 1 }]);
        
        await new Promise(r => setTimeout(r, 10));

        expect(result.current.data).toEqual([]);
    });

    it("does not update state if unmounted on not ok response", async () => {
        let resolveFetch: any;
        (fetchApi as Mock).mockImplementation(() => new Promise(res => {
            resolveFetch = res;
        }));

        const { result, unmount } = renderHook(() => useConfigList("/api/test"));

        unmount();

        resolveFetch({ ok: false });
        
        await new Promise(r => setTimeout(r, 10));

        expect(result.current.data).toEqual([]);
    });

    it("does not update state if unmounted on throw", async () => {
        let rejectFetch: any;
        (fetchApi as Mock).mockImplementation(() => new Promise((_, rej) => {
            rejectFetch = rej;
        }));

        const { result, unmount } = renderHook(() => useConfigList("/api/test"));

        unmount();

        rejectFetch(new Error("err"));
        
        await new Promise(r => setTimeout(r, 10));

        expect(result.current.data).toEqual([]);
    });

    it("uses default [] when parsed is undefined", async () => {
        (fetchApi as Mock).mockResolvedValue({ ok: true });
        (parseJsonSafe as Mock).mockResolvedValue(undefined);

        const { result } = renderHook(() => useConfigList("/api/test"));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual([]);
    });

    it("setData can be used manually", () => {
         const { result } = renderHook(() => useConfigList("/api/test"));
         act(() => {
             result.current.setData([{ id: 2 }]);
         });
         expect(result.current.data).toEqual([{ id: 2 }]);
    });
});
