import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSession, signOut } from "next-auth/react";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
    getSession: vi.fn(),
    signOut: vi.fn(),
}));

describe("fetchApi", () => {
    const mockFetch = vi.fn();
    let originalWindow: any;
    let fetchApi: any;

    beforeEach(async () => {
        vi.resetModules();
        vi.resetAllMocks();
        originalWindow = global.window;
        global.fetch = mockFetch;
        process.env.NEXT_PUBLIC_BACKEND_URL = "http://test-backend";
        
        // Dynamically import to ensure process.env changes are picked up
        const apiModule = await import("../api");
        fetchApi = apiModule.fetchApi;
    });

    afterEach(() => {
        global.window = originalWindow;
    });

    it("fetches relative path using BACKEND_URL and headers without token if session is null", async () => {
        (getSession as any).mockResolvedValue(null);
        mockFetch.mockResolvedValue({ status: 200 } as Response);

        const response = await fetchApi("/api/data");

        expect(mockFetch).toHaveBeenCalledWith("http://test-backend/api/data", {
            headers: {
                "Content-Type": "application/json",
            },
        });
        expect(response.status).toBe(200);
    });

    it("fetches absolute path when path starts with http", async () => {
        (getSession as any).mockResolvedValue(null);
        mockFetch.mockResolvedValue({ status: 200 } as Response);

        await fetchApi("https://external-api.com/data");

        expect(mockFetch).toHaveBeenCalledWith("https://external-api.com/data", {
            headers: {
                "Content-Type": "application/json",
            },
        });
    });

    it("appends Authorization header when accessToken is present in session", async () => {
        (getSession as any).mockResolvedValue({ accessToken: "secret-token" });
        mockFetch.mockResolvedValue({ status: 200 } as Response);

        await fetchApi("/api/data");

        expect(mockFetch).toHaveBeenCalledWith("http://test-backend/api/data", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer secret-token",
            },
        });
    });

    it("merges custom headers with default headers", async () => {
        (getSession as any).mockResolvedValue({ accessToken: "secret-token" });
        mockFetch.mockResolvedValue({ status: 200 } as Response);

        await fetchApi("/api/data", {
            headers: {
                "X-Custom-Header": "custom-value",
            },
        });

        expect(mockFetch).toHaveBeenCalledWith("http://test-backend/api/data", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer secret-token",
                "X-Custom-Header": "custom-value",
            },
        });
    });

    it("signs out and redirects to /login on 401 response when window is defined", async () => {
        (getSession as any).mockResolvedValue(null);
        mockFetch.mockResolvedValue({ status: 401 } as Response);

        const response = await fetchApi("/api/data");

        expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
        expect(response.status).toBe(401);
    });

    it("signs out and redirects to /login on 403 response when window is defined", async () => {
        (getSession as any).mockResolvedValue(null);
        mockFetch.mockResolvedValue({ status: 403 } as Response);

        const response = await fetchApi("/api/data");

        expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
        expect(response.status).toBe(403);
    });

    it("does not sign out on 401/403 response if window is undefined", async () => {
        // Temporarily delete window from global
        // @ts-expect-error window is not available in the Node test environment
        delete global.window;

        (getSession as any).mockResolvedValue(null);
        mockFetch.mockResolvedValue({ status: 401 } as Response);

        const response = await fetchApi("/api/data");

        expect(signOut).not.toHaveBeenCalled();
        expect(response.status).toBe(401);
    });

    it("falls back to default BACKEND_URL when NEXT_PUBLIC_BACKEND_URL is not set", async () => {
        vi.resetModules();
        delete process.env.NEXT_PUBLIC_BACKEND_URL;
        const apiModule = await import("../api");
        const localFetchApi = apiModule.fetchApi;

        (getSession as any).mockResolvedValue(null);
        mockFetch.mockResolvedValue({ status: 200 } as Response);

        await localFetchApi("/api/data");

        expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/api/data", {
            headers: {
                "Content-Type": "application/json",
            },
        });
    });
});
