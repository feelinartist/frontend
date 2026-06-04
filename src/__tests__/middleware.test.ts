import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { middleware, config } from "../../middleware";
import * as nextAuthJwt from "next-auth/jwt";

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

const { mockRedirect, mockNext } = vi.hoisted(() => ({
  mockRedirect: vi.fn((url) => ({ status: 307, url: url.toString(), isRedirect: true })),
  mockNext: vi.fn(() => ({ status: 200, isNext: true })),
}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      redirect: mockRedirect,
      next: mockNext,
    },
  };
});

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (path: string) => {
    return {
      nextUrl: {
        pathname: path,
        startsWith: (p: string) => path.startsWith(p),
      },
      url: `http://localhost${path}`,
    } as unknown as NextRequest;
  };

  it("exports valid config", () => {
    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
  });

  describe("authenticated user with a role", () => {
    beforeEach(() => {
      vi.mocked(nextAuthJwt.getToken).mockResolvedValue({ rol: "ARTIST" } as any);
    });

    const redirectPages = ["/role-selection", "/artist-registration", "/public-registration", "/venue-registration"];
    redirectPages.forEach(path => {
      it(`redirects to /home if accessing ${path}`, async () => {
        const req = createRequest(path);
        await middleware(req);
        expect(mockRedirect).toHaveBeenCalledWith(new URL("/home", req.url));
      });
    });

    it("allows access to dashboard pages (e.g. /home)", async () => {
      const req = createRequest("/home");
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("authenticated user without a role", () => {
    beforeEach(() => {
      vi.mocked(nextAuthJwt.getToken).mockResolvedValue({} as any);
    });

    const allowedPages = ["/role-selection", "/artist-registration", "/public-registration", "/venue-registration"];
    allowedPages.forEach(path => {
      it(`allows access to ${path}`, async () => {
        const req = createRequest(path);
        await middleware(req);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    const redirectPages = ["/", "/home", "/dashboard", "/events", "/profile", "/settings", "/stats", "/search", "/admin"];
    redirectPages.forEach(path => {
      it(`redirects to /role-selection if accessing ${path}`, async () => {
        const req = createRequest(path);
        await middleware(req);
        expect(mockRedirect).toHaveBeenCalledWith(new URL("/role-selection", req.url));
      });
    });
  });

  describe("unauthenticated user", () => {
    beforeEach(() => {
      vi.mocked(nextAuthJwt.getToken).mockResolvedValue(null);
    });

    const redirectPages = [
      "/role-selection", "/artist-registration", "/home", "/events", 
      "/profile", "/settings", "/stats", "/search", "/admin", "/dashboard", "/"
    ];
    redirectPages.forEach(path => {
      it(`redirects to /login if accessing ${path}`, async () => {
        const req = createRequest(path);
        await middleware(req);
        expect(mockRedirect).toHaveBeenCalledWith(new URL("/login", req.url));
      });
    });

    it("allows access to unprotected pages like /login", async () => {
      const req = createRequest("/login");
      await middleware(req);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
