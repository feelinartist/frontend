import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SocialMediaForm } from "../SocialMediaForm";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        fetchApi: vi.fn(),
    };
});

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
}));

describe("SocialMediaForm Component", () => {
    const mockNetworks = [
        { id: "1", nombre: "Facebook", urlBase: "https://facebook.com/" },
        { id: "2", nombre: "Instagram", urlBase: "https://instagram.com/" },
        { id: "3", nombre: "Twitter", urlBase: "https://twitter.com/" },
        { id: "4", nombre: "TikTok", urlBase: "https://tiktok.com/@" },
        { id: "5", nombre: "YouTube", urlBase: "https://youtube.com/c/" },
        { id: "6", nombre: "SoundCloud", urlBase: "https://soundcloud.com/" },
        { id: "7", nombre: "Twitch", urlBase: "https://twitch.tv/" },
        { id: "8", nombre: "Kick", urlBase: "https://kick.com/" },
        { id: "9", nombre: "WhatsApp", urlBase: "" },
        { id: "10", nombre: "CustomNet", urlBase: "https://custom.com/", icono: "https://custom.com/icon.png" },
        { id: "11", nombre: "Other", urlBase: "" }
    ];

    const defaultProps = {
        redesSociales: [
            { id: "s1", nombreUsuario: "existing_fb", redSocial: { id: "1", nombre: "Facebook", icono: "", urlBase: "https://facebook.com/" } }
        ],
        usuarioId: "user-123",
        onSave: vi.fn(),
        onLoadingChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (fetchApi as any).mockResolvedValue({
            ok: true,
            json: async () => mockNetworks,
        });
    });

    it("renders loading screen initially and loads available networks", async () => {
        render(<SocialMediaForm {...defaultProps} />);

        expect(screen.getByText("Cargando redes sociales...")).toBeInTheDocument();

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith("/api/config/redes-sociales");
        });

            expect(screen.getByText("Facebook")).toBeInTheDocument();
            expect(screen.getByText("Instagram")).toBeInTheDocument();
    });

    it("handles API fetch error gracefully", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchApi as any).mockRejectedValue(new Error("Network failed"));

        render(<SocialMediaForm {...defaultProps} />);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalled();
        });

        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    it("handles API fetch ok: false response gracefully", async () => {
        (fetchApi as any).mockResolvedValue({
            ok: false,
        });

        render(<SocialMediaForm {...defaultProps} />);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalled();
        });
        expect(screen.getByText("Cargando redes sociales...")).toBeInTheDocument();
    });

    it("initializes with existing user social media data and maps empty ones", async () => {
        render(<SocialMediaForm {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText("Facebook")).toBeInTheDocument();
            const fbInput = screen.getByPlaceholderText("tu.nombre") as HTMLInputElement;
            expect(fbInput.value).toBe("existing_fb");

            const instaLabel = screen.getByText("Instagram");
            const instaInput = instaLabel.closest("div")?.querySelector("input") as HTMLInputElement;
            expect(instaInput.value).toBe("");
        });
    });
    it("handles input changes and updates state", async () => {
        render(<SocialMediaForm {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText("Instagram")).toBeInTheDocument();
            expect(screen.getByText("Other")).toBeInTheDocument();
        });

        const instaLabel = screen.getByText("Instagram");
        const instaInput = instaLabel.closest("div")?.querySelector("input") as HTMLInputElement;
        fireEvent.change(instaInput, { target: { value: "new_insta" } });
        expect(instaInput.value).toBe("new_insta");

        const otherLabel = screen.getByText("Other");
        const otherInput = otherLabel.closest("div")?.querySelector("input") as HTMLInputElement;
        fireEvent.change(otherInput, { target: { value: "other_val" } });
        expect(otherInput.value).toBe("other_val");
    });

    it("submits empty or non-empty entries correctly", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/config/redes-sociales") {
                return Promise.resolve({ ok: true, json: async () => mockNetworks });
            }
            if (url === "/api/usuarios/perfil") {
                return Promise.resolve({ ok: true });
            }
            return Promise.resolve({ ok: false });
        });

        render(<SocialMediaForm {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText("Instagram")).toBeInTheDocument();
        });

        const instaLabel = screen.getByText("Instagram");
        const instaInput = instaLabel.closest("div")?.querySelector("input") as HTMLInputElement;
        fireEvent.input(instaInput, { target: { value: "new_insta" } });
        fireEvent.change(instaInput, { target: { value: "new_insta" } });

        const submitBtn = screen.getByText("Guardar Cambios");
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith(
                "/api/usuarios/perfil",
                expect.objectContaining({
                    method: "PATCH",
                    body: JSON.stringify({
                        usuarioId: "user-123",
                        redesSociales: [
                            { redSocialId: "1", nombreUsuario: "existing_fb" },
                            { redSocialId: "2", nombreUsuario: "new_insta" }
                        ]
                    })
                })
            );
        });

        expect(toast.success).toHaveBeenCalledWith("Redes sociales actualizadas correctamente");
        expect(defaultProps.onSave).toHaveBeenCalled();
    });

    it("handles submit API failure response gracefully", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/config/redes-sociales") {
                return Promise.resolve({ ok: true, json: async () => mockNetworks });
            }
            if (url === "/api/usuarios/perfil") {
                return Promise.resolve({
                    ok: false,
                    json: async () => ({ message: "Failed updating" })
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<SocialMediaForm {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText("Facebook")).toBeInTheDocument();
        });

        const submitBtn = screen.getByText("Guardar Cambios");
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Failed updating");
        });
    });

    it("handles submit exception gracefully", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/config/redes-sociales") {
                return Promise.resolve({ ok: true, json: async () => mockNetworks });
            }
            if (url === "/api/usuarios/perfil") {
                return Promise.reject(new Error("Network connection error"));
            }
            return Promise.resolve({ ok: false });
        });

        render(<SocialMediaForm {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText("Facebook")).toBeInTheDocument();
        });

        const submitBtn = screen.getByText("Guardar Cambios");
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Network connection error");
        });
    });

    it("uses redSocialId fallback in match, and triggers fallback for empty username", async () => {
        const propsWithFallback = {
            ...defaultProps,
            redesSociales: [
                { id: "s1", nombreUsuario: "", redSocialId: "1", redSocial: undefined as any }
            ]
        };
        render(<SocialMediaForm {...propsWithFallback} />);

        await waitFor(() => {
            expect(screen.getByText("Facebook")).toBeInTheDocument();
            const fbInput = screen.getByPlaceholderText("tu.nombre") as HTMLInputElement;
            expect(fbInput.value).toBe("");
        });
    });

    it("triggers fallback error message on submit fail without message", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/config/redes-sociales") {
                return Promise.resolve({ ok: true, json: async () => mockNetworks });
            }
            if (url === "/api/usuarios/perfil") {
                return Promise.resolve({
                    ok: false,
                    json: async () => ({})
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<SocialMediaForm {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText("Facebook")).toBeInTheDocument();
        });

        const submitBtn = screen.getByText("Guardar Cambios");
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al guardar");
        });
    });

    it("triggers fallback error message when non-Error object is thrown on submit", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/config/redes-sociales") {
                return Promise.resolve({ ok: true, json: async () => mockNetworks });
            }
            if (url === "/api/usuarios/perfil") {
                return Promise.reject("Raw string error");
            }
            return Promise.resolve({ ok: false });
        });

        render(<SocialMediaForm {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText("Facebook")).toBeInTheDocument();
        });

        const submitBtn = screen.getByText("Guardar Cambios");
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al actualizar redes sociales");
        });
    });
});

