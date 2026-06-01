import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PaginaPanelControl from "../page";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

// Mock hooks & components
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        fetchApi: vi.fn(),
    };
});

vi.mock("sonner", () => ({
    toast: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("@/components/animated-background", () => ({
    AnimatedBackground: () => <div data-testid="animated-bg" />,
}));

vi.mock("@/components/ui/loading-screen", () => ({
    LoadingScreen: () => <div data-testid="loading-screen">Cargando...</div>,
}));

vi.mock("@/components/ProfileCompletionChecklist", () => ({
    ProfileCompletionChecklist: ({ onDismiss }: any) => (
        <div data-testid="profile-checklist">
            Checklist
            <button onClick={onDismiss} data-testid="dismiss-checklist-btn">Dismiss</button>
        </div>
    ),
}));

vi.mock("@/components/dashboard/ArtistDiscovery", () => ({
    ArtistDiscovery: () => <div data-testid="artist-discovery">Artist Discovery</div>,
}));

describe("PaginaPanelControl Component", () => {
    const originalLocalStorage = global.localStorage;
    const originalSessionStorage = global.sessionStorage;

    // LocalStorage mock
    const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
            getItem: (key: string) => store[key] || null,
            setItem: (key: string, value: string) => {
                store[key] = value.toString();
            },
            clear: () => {
                store = {};
            },
        };
    })();

    // SessionStorage mock
    const sessionStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
            getItem: (key: string) => store[key] || null,
            setItem: (key: string, value: string) => {
                store[key] = value.toString();
            },
            clear: () => {
                store = {};
            },
        };
    })();

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup mock APIs
        Object.defineProperty(global, "localStorage", { value: localStorageMock });
        Object.defineProperty(global, "sessionStorage", { value: sessionStorageMock });
        localStorage.clear();
        sessionStorage.clear();
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        Object.defineProperty(global, "localStorage", { value: originalLocalStorage });
        Object.defineProperty(global, "sessionStorage", { value: originalSessionStorage });
    });

    it("renders LoadingScreen when status is loading", () => {
        (useSession as any).mockReturnValue({
            data: null,
            status: "loading",
        });
        render(<PaginaPanelControl />);
        expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
    });

    it("renders LoadingScreen when status is unauthenticated", () => {
        (useSession as any).mockReturnValue({
            data: null,
            status: "unauthenticated",
        });
        render(<PaginaPanelControl />);
        expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
        expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("renders LoadingScreen when session is missing user role", () => {
        (useSession as any).mockReturnValue({
            data: { user: { name: "User" } },
            status: "authenticated",
        });
        render(<PaginaPanelControl />);
        expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
    });

    it("renders discovery dashboard for non-artist user", () => {
        (useSession as any).mockReturnValue({
            data: {
                user: { id: "user-1", name: "Public User", rol: "PUBLICO" },
            },
            status: "authenticated",
        });

        render(<PaginaPanelControl />);

        expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
        expect(screen.getByText("Bienvenido, Public User")).toBeInTheDocument();
        expect(screen.getByTestId("artist-discovery")).toBeInTheDocument();
        expect(screen.queryByTestId("profile-checklist")).not.toBeInTheDocument();
    });

    it("renders LoadingScreen for artist while fetching their profile", () => {
        (useSession as any).mockReturnValue({
            data: {
                user: { id: "artist-1", name: "Artist User", rol: "ARTISTA" },
            },
            status: "authenticated",
        });

        // Mock fetchApi to never resolve to simulate loading profile state
        (fetchApi as any).mockReturnValue(new Promise(() => {}));

        render(<PaginaPanelControl />);
        expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
    });

    it("renders artist home page with profile completion checklist if profile is incomplete", async () => {
        (useSession as any).mockReturnValue({
            data: {
                user: { id: "artist-1", name: "Artist User", rol: "ARTISTA" },
            },
            status: "authenticated",
        });

        // Mock incomplete profile response
        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil/")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        perfilArtista: {
                            id: "artist-profile-1",
                            biografia: "Biografía incompleta",
                            // Missing gallery, social networks, donation methods
                        },
                        perfilCompletadoReconocido: false,
                    }),
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<PaginaPanelControl />);

        await waitFor(() => {
            expect(screen.getByText("Bienvenido, Artist User")).toBeInTheDocument();
        });

        expect(screen.getByTestId("profile-checklist")).toBeInTheDocument();
    });

    it("checks for active event and redirects if found (only once per session)", async () => {
        (useSession as any).mockReturnValue({
            data: {
                user: { id: "artist-1", name: "Artist User", rol: "ARTISTA" },
            },
            status: "authenticated",
        });

        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil/")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        perfilArtista: {
                            id: "artist-profile-1",
                            biografia: "bio",
                            categoria: "rock",
                            galeria: [{ urlImagen: "url1" }],
                            redesSociales: [{ plataforma: "IG", url: "url" }],
                            metodosDonacion: [{ tipo: "paypal" }],
                        },
                        perfilCompletadoReconocido: true,
                    }),
                });
            }
            if (url.includes("/api/eventos/activo/")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        id: "active-event-id",
                    }),
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<PaginaPanelControl />);

        await waitFor(() => {
            expect(toast.info).toHaveBeenCalledWith("Retomando tu evento activo...");
        });
        expect(mockPush).toHaveBeenCalledWith("/events/live");
        expect(sessionStorage.getItem("eventRedirectChecked")).toBe("true");
    });

    it("does not redirect if eventRedirectChecked is already set in sessionStorage", async () => {
        sessionStorage.setItem("eventRedirectChecked", "true");

        (useSession as any).mockReturnValue({
            data: {
                user: { id: "artist-1", name: "Artist User", rol: "ARTISTA" },
            },
            status: "authenticated",
        });

        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil/")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        perfilArtista: { id: "artist-profile-1" },
                        perfilCompletadoReconocido: true,
                    }),
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<PaginaPanelControl />);

        await waitFor(() => {
            expect(screen.getByText("Bienvenido, Artist User")).toBeInTheDocument();
        });
        expect(toast.info).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
    });

    it("resets profile completed acknowledgment if profile becomes incomplete", async () => {
        (useSession as any).mockReturnValue({
            data: {
                user: { id: "artist-1", name: "Artist User", rol: "ARTISTA" },
            },
            status: "authenticated",
        });

        const resetAcknowledgmentMock = vi.fn().mockResolvedValue({ ok: true });

        (fetchApi as any).mockImplementation((url: string, init?: RequestInit) => {
            if (url.includes("/api/usuarios/perfil/")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        perfilArtista: {
                            id: "artist-profile-1",
                            biografia: "bio",
                            // incomplete profile
                        },
                        perfilCompletadoReconocido: true, // Mock that was previously acknowledged
                    }),
                });
            }
            if (url.includes("/api/usuarios/marcar-perfil-completado") && init?.method === "POST") {
                return resetAcknowledgmentMock();
            }
            return Promise.resolve({ ok: false });
        });

        render(<PaginaPanelControl />);

        await waitFor(() => {
            expect(resetAcknowledgmentMock).toHaveBeenCalled();
        });
    });

    it("handles failure when fetching profile", async () => {
        (useSession as any).mockReturnValue({
            data: {
                user: { id: "artist-1", name: "Artist User", rol: "ARTISTA" },
            },
            status: "authenticated",
        });

        (fetchApi as any).mockResolvedValue({
            ok: false,
            text: async () => "Internal Server Error",
        });

        render(<PaginaPanelControl />);

        await waitFor(() => {
            expect(console.warn).toHaveBeenCalledWith(
                "Error response from profile fetch:",
                "Internal Server Error"
            );
        });
    });

    it("handles exceptions when fetching profile", async () => {
        (useSession as any).mockReturnValue({
            data: {
                user: { id: "artist-1", name: "Artist User", rol: "ARTISTA" },
            },
            status: "authenticated",
        });

        (fetchApi as any).mockRejectedValue(new Error("Network Failure"));

        render(<PaginaPanelControl />);

        await waitFor(() => {
            expect(console.warn).toHaveBeenCalledWith(
                "Error cargando perfil de artista:",
                expect.any(Error)
            );
        });
    });

    it("allows dismissing and restoring the profile checklist", async () => {
        (useSession as any).mockReturnValue({
            data: {
                user: { id: "artist-1", name: "Artist User", rol: "ARTISTA" },
            },
            status: "authenticated",
        });

        (fetchApi as any).mockImplementation((url: string) => {
            if (url.includes("/api/usuarios/perfil/")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        perfilArtista: {
                            id: "artist-profile-1",
                            biografia: "bio",
                        },
                        perfilCompletadoReconocido: false,
                    }),
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<PaginaPanelControl />);

        await waitFor(() => {
            expect(screen.getByTestId("profile-checklist")).toBeInTheDocument();
        });

        // Dismiss
        fireEvent.click(screen.getByTestId("dismiss-checklist-btn"));
        expect(screen.queryByTestId("profile-checklist")).not.toBeInTheDocument();
        expect(localStorage.getItem("checklist-dismissed")).toBe("true");

        // Restore button should be shown
        const restoreBtn = screen.getByRole("button", { name: "Mostrar sugerencias de perfil" });
        expect(restoreBtn).toBeInTheDocument();

        // Restore
        fireEvent.click(restoreBtn);
        expect(screen.getByTestId("profile-checklist")).toBeInTheDocument();
        expect(localStorage.getItem("checklist-dismissed")).toBe("false");
    });
});
