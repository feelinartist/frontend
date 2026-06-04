import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../useDebounce";
import { vi } from "vitest";

describe("useDebounce", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should return initial value", () => {
        const { result } = renderHook(() => useDebounce("test", 500));
        expect(result.current).toBe("test");
    });

    it("should update value after delay", () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: { value: "test", delay: 500 }
        });
        
        rerender({ value: "test2", delay: 500 });
        
        expect(result.current).toBe("test"); // Not updated yet
        
        act(() => {
            vi.advanceTimersByTime(500);
        });
        
        expect(result.current).toBe("test2"); // Updated
    });

    it("should cancel timeout on unmount", () => {
        const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
        const { unmount } = renderHook(() => useDebounce("test", 500));
        
        unmount();
        
        expect(clearTimeoutSpy).toHaveBeenCalled();
    });
});
