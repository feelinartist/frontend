import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import RoleSelectionPage from "../page";
import ContenidoSeleccionRol, { roles } from "../role-selection-content";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/api";

// Mock next-auth and getServerSession
vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));

// Mock next/navigation redirect and useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    redirect: vi.fn((url: string) => {
        const err = new Error("NEXT_REDIRECT");
        (err as any).url = url;
        throw err;
    }),
    useRouter: () => ({
        push: mockPush,
    }),
}));

vi.mock("@/lib/auth", () => ({
    getAuthOptions: vi.fn(() => ({})),
}));

vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        fetchApi: vi.fn(),
    };
});

vi.mock("@/components/ui/back-button", () => ({
    BackButton: ({ href }: any) => <a href={href} data-testid="back-button">Back</a>,
}));

vi.mock("@/components/animated-background", () => ({
    AnimatedBackground: () => <div data-testid="animated-bg" />,
}));

describe("RoleSelectionPage (Server Component)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("redirects to /login if there is no session", async () => {
        (getServerSession as any).mockResolvedValueOnce(null);

        await expect(RoleSelectionPage()).rejects.toThrow("NEXT_REDIRECT");

        expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("redirects to /home if user already has a role", async () => {
        (getServerSession as any).mockResolvedValueOnce({
            user: { id: "user-1", rol: "ARTISTA" },
        });

        await expect(RoleSelectionPage()).rejects.toThrow("NEXT_REDIRECT");

        expect(redirect).toHaveBeenCalledWith("/home");
    });

    it("renders ContenidoSeleccionRol if user has no role", async () => {
        (getServerSession as any).mockResolvedValueOnce({
            user: { id: "user-1" }, // no role
        });

        const result = await RoleSelectionPage();
        expect(result.type).toBe(ContenidoSeleccionRol);
    });
});

describe("ContenidoSeleccionRol (Client Component)", () => {
    const mockUser = {
        id: "user-123",
        email: "test@user.com",
    };

    const mockReplace = vi.fn();
    const originalRoles = [...roles.map(r => ({ ...r }))];

    beforeEach(() => {
        vi.resetAllMocks();
        mockPush.mockReset();
        mockReplace.mockReset();

        // Restore original roles before each test
        roles.forEach((r, idx) => {
            roles[idx] = { ...originalRoles[idx] };
        });

        Object.defineProperty(window, "location", {
            value: {
                replace: mockReplace,
            },
            writable: true,
            configurable: true,
        });

        (useSession as any).mockReturnValue({
            data: { user: mockUser },
            status: "authenticated",
        });

        (fetchApi as any).mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });
    });

    afterEach(() => {
        // Restore original roles after each test
        roles.forEach((r, idx) => {
            roles[idx] = { ...originalRoles[idx] };
        });
    });

    it("renders all role selection cards", () => {
        render(<ContenidoSeleccionRol />);

        expect(screen.getByText("Soy Artista")).toBeInTheDocument();
        expect(screen.getByText("Soy Público")).toBeInTheDocument();
        expect(screen.getByText("Soy Discoteca")).toBeInTheDocument();
    });

    it("redirects to /artist-registration when Artista card is clicked", () => {
        render(<ContenidoSeleccionRol />);

        const artistCard = screen.getByText("Soy Artista");
        fireEvent.click(artistCard);

        expect(mockPush).toHaveBeenCalledWith("/artist-registration");
        expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });

    it("redirects to /public-registration when Publico card is clicked", () => {
        render(<ContenidoSeleccionRol />);

        const publicCard = screen.getByText("Soy Público");
        fireEvent.click(publicCard);

        expect(mockPush).toHaveBeenCalledWith("/public-registration");
    });

    it("redirects to /venue-registration when Discoteca card is clicked", () => {
        render(<ContenidoSeleccionRol />);

        const venueCard = screen.getByText("Soy Discoteca");
        fireEvent.click(venueCard);

        expect(mockPush).toHaveBeenCalledWith("/venue-registration");
    });

    it("handles backend role update for custom role selection", async () => {
        // Mutate first role card to be ADMIN
        roles[0].id = "ADMIN";

        render(<ContenidoSeleccionRol />);

        const cardElement = screen.getByText("Soy Artista");
        fireEvent.click(cardElement);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/rol", expect.objectContaining({
                method: "PATCH",
                body: JSON.stringify({ correo: "test@user.com", rol: "ADMIN" }),
            }));
            expect(mockReplace).toHaveBeenCalledWith("/home");
        });
    });

    it("handles backend role update failure", async () => {
        roles[0].id = "ADMIN";
        (fetchApi as any).mockResolvedValueOnce({
            ok: false,
        });

        render(<ContenidoSeleccionRol />);

        const cardElement = screen.getByText("Soy Artista");
        
        // Spy on console.error
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        fireEvent.click(cardElement);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error al actualizar rol");
        });
        consoleSpy.mockRestore();
    });

    it("handles backend role update exception", async () => {
        roles[0].id = "ADMIN";
        (fetchApi as any).mockRejectedValueOnce(new Error("Network Error"));

        render(<ContenidoSeleccionRol />);

        const cardElement = screen.getByText("Soy Artista");
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        fireEvent.click(cardElement);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error actualizando rol:", expect.any(Error));
        });
        consoleSpy.mockRestore();
    });
});
