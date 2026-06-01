import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileCompletionChecklist } from "../ProfileCompletionChecklist";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { fetchApi } from "@/lib/api";

// Mock @/lib/api
vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        fetchApi: vi.fn(),
    };
});

describe("ProfileCompletionChecklist Component", () => {
    const mockArtistProfileIncomplete = {
        biografia: "",
        categoria: "",
        galeria: [],
        redesSociales: [],
        metodosDonacion: [],
    };

    const mockArtistProfilePartial = {
        biografia: "Hola, soy un artista",
        categoria: "Músico",
        galeria: ["img1.jpg"],
        redesSociales: [],
        metodosDonacion: [],
    };

    const mockArtistProfileComplete = {
        biografia: "Biografía completa",
        categoria: "DJ",
        galeria: ["img1.jpg"],
        redesSociales: [{ id: "ig" }],
        metodosDonacion: [{ id: "bank" }],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock global fetch for session
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ user: { id: "user-123" } }),
        });

        // Mock globalThis.location.href and globalThis.location.reload
        Object.defineProperty(window, "location", {
            value: {
                href: "",
                reload: vi.fn(),
            },
            writable: true,
            configurable: true,
        });
    });

    it("renders progress as 0% when empty profile is provided", async () => {
        render(<ProfileCompletionChecklist perfilArtista={mockArtistProfileIncomplete} />);

        expect(screen.getByText("0%")).toBeInTheDocument();
        expect(screen.getByText("0 de 4 completados")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /entendido/i })).not.toBeInTheDocument();

        // Check fetch is called to reset acknowledgment since progress is < 100%
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/auth/session");
            expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/marcar-perfil-completado", expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ usuarioId: "user-123", perfilCompletadoReconocido: false }),
            }));
        });
    });

    it("renders partial progress and allows navigation click on items", async () => {
        render(<ProfileCompletionChecklist perfilArtista={mockArtistProfilePartial} />);

        expect(screen.getByText("50%")).toBeInTheDocument();
        expect(screen.getByText("2 de 4 completados")).toBeInTheDocument();

        // Click basic-info checklist card (should redirect to tab=personal)
        const basicInfoCard = screen.getByText("Información básica").closest("div");
        fireEvent.click(basicInfoCard!);
        expect(globalThis.location.href).toBe("/profile?tab=personal");

        // Click gallery checklist card (should redirect to tab=gallery)
        const galleryCard = screen.getByText("Galería de imágenes").closest("div");
        fireEvent.click(galleryCard!);
        expect(globalThis.location.href).toBe("/profile?tab=gallery");

        // Click social checklist card (should redirect to tab=social)
        const socialCard = screen.getByText("Redes sociales").closest("div");
        fireEvent.click(socialCard!);
        expect(globalThis.location.href).toBe("/profile?tab=social");

        // Click donation checklist card (should redirect to tab=donation)
        const donationCard = screen.getByText("Métodos de donación").closest("div");
        fireEvent.click(donationCard!);
        expect(globalThis.location.href).toBe("/profile?tab=donation");
    });

    it("shows 100% complete screen and handles completion submission successfully", async () => {
        const onDismissMock = vi.fn();
        (fetchApi as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(<ProfileCompletionChecklist perfilArtista={mockArtistProfileComplete} onDismiss={onDismissMock} />);

        expect(screen.getByText("100%")).toBeInTheDocument();
        expect(screen.getByText("¡Perfil completo! 🎉")).toBeInTheDocument();

        // Entendido button should be visible
        const completeBtn = screen.getByRole("button", { name: /entendido/i });
        expect(completeBtn).toBeInTheDocument();

        // Click complete
        fireEvent.click(completeBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/auth/session");
            expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/marcar-perfil-completado", expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ usuarioId: "user-123" }),
            }));
        });

        await waitFor(() => {
            expect(globalThis.location.reload).toHaveBeenCalled();
            expect(onDismissMock).not.toHaveBeenCalled();
        });
    });

    it("dismisses checklist if submit API request fails", async () => {
        const onDismissMock = vi.fn();
        (fetchApi as any).mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => "Internal Error",
        });

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        render(<ProfileCompletionChecklist perfilArtista={mockArtistProfileComplete} onDismiss={onDismissMock} />);

        const completeBtn = screen.getByRole("button", { name: /entendido/i });
        fireEvent.click(completeBtn);

        await waitFor(() => {
            expect(onDismissMock).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });

    it("dismisses checklist if submit API throws exception", async () => {
        const onDismissMock = vi.fn();
        (fetchApi as any).mockRejectedValueOnce(new Error("Timeout"));
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        render(<ProfileCompletionChecklist perfilArtista={mockArtistProfileComplete} onDismiss={onDismissMock} />);

        const completeBtn = screen.getByRole("button", { name: /entendido/i });
        fireEvent.click(completeBtn);

        await waitFor(() => {
            expect(onDismissMock).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });

    it("dismisses immediately on close button click", () => {
        const onDismissMock = vi.fn();
        render(<ProfileCompletionChecklist perfilArtista={mockArtistProfilePartial} onDismiss={onDismissMock} />);

        // The button has no text label, search by X icon or use its layout class/first button
        const closeBtn = screen.getByRole("button");
        fireEvent.click(closeBtn);

        expect(onDismissMock).toHaveBeenCalled();
    });

    it("handles error in resetCompletionAcknowledgment", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        global.fetch = vi.fn().mockRejectedValueOnce(new Error("Session Fetch Failed"));

        render(<ProfileCompletionChecklist perfilArtista={mockArtistProfileIncomplete} />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                "Error resetting completion acknowledgment:",
                expect.any(Error)
            );
        });
        consoleSpy.mockRestore();
    });

    it("handles missing session ID on complete", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => ({ user: null }),
        });

        render(<ProfileCompletionChecklist perfilArtista={mockArtistProfileComplete} />);

        const completeBtn = screen.getByRole("button", { name: /entendido/i });
        fireEvent.click(completeBtn);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("No session or user ID found");
        });
        consoleSpy.mockRestore();
    });
});
