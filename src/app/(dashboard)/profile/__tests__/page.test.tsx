import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaginaPerfil from "../page";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

// Mock hooks and API
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useSearchParams: vi.fn(() => ({
        get: vi.fn().mockReturnValue("personal"),
    })),
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
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock child forms
vi.mock("@/components/profile/ArtistProfileForm", () => ({
    ArtistProfileForm: ({ onSubmit }: any) => (
        <form data-testid="artist-form" onSubmit={(e) => { e.preventDefault(); onSubmit({ categoria: "BANDA" }); }}>
            Artist Form
            <button type="submit">Submit Artist</button>
        </form>
    ),
}));

vi.mock("@/components/profile/VenueProfileForm", () => ({
    VenueProfileForm: ({ onSubmit, userData }: any) => (
        <form data-testid="venue-form" onSubmit={(e) => { e.preventDefault(); onSubmit({ aforo: 500 }); }}>
            Venue Form
            <div data-testid="venue-city">{userData?.perfilDiscoteca?.ciudad || ''}</div>
            <button type="submit">Submit Venue</button>
        </form>
    ),
}));

vi.mock("@/components/auth/UsernameInput", () => ({
    UsernameInput: ({ value, onChange, onStatusChange }: any) => (
        <div>
            <input
                data-testid="username-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <button type="button" data-testid="set-unverified" onClick={() => onStatusChange(false)}>unverify</button>
            <button type="button" data-testid="set-verified" onClick={() => onStatusChange(true)}>verify</button>
        </div>
    ),
}));

vi.mock("@/components/ui/country-phone-selector", () => ({
    CountryPhoneSelector: ({ onValueChange }: any) => (
        <select data-testid="country-phone-selector" onChange={(e) => onValueChange(e.target.value)}>
            <option value="+51">+51</option>
            <option value="+1">+1</option>
        </select>
    ),
}));

vi.mock("@/components/profile/GalleryForm", () => ({
    GalleryForm: () => <div data-testid="gallery-form">Gallery Form</div>,
}));

vi.mock("@/components/profile/SocialMediaForm", () => ({
    SocialMediaForm: () => <div data-testid="social-form">Social Form</div>,
}));

vi.mock("@/components/profile/DonationForm", () => ({
    DonationForm: () => <div data-testid="donation-form">Donation Form</div>,
}));

describe("PaginaPerfil Component", () => {
    const mockUpdate = vi.fn();
    const defaultSession = {
        user: {
            id: "user-123",
            email: "test@user.com",
            rol: "PUBLICO",
            name: "John Public",
        },
    };

    const defaultProfile = {
        nombre: "John Public",
        correo: "test@user.com",
        nombreUsuario: "johnpublic",
        perfilPublico: {
            pais: "PE",
            ciudad: "Lima",
            numeroTelefono: "123456789",
            codigoTelefono: "+51",
            zonaHoraria: "America/Lima",
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        global.confirm = vi.fn(() => true);
        (useSession as any).mockReturnValue({
            data: defaultSession,
            update: mockUpdate,
        });
        (useSearchParams as any).mockReturnValue({
            get: vi.fn().mockReturnValue("personal"),
        });
        (fetchApi as any).mockResolvedValue({
            ok: true,
            json: async () => defaultProfile,
        });
    });

    it("shows loading screen initially", () => {
        (fetchApi as any).mockReturnValue(new Promise(() => {})); // Never resolves
        render(<PaginaPerfil />);
        expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });

    it("handles error when fetching profile fails", async () => {
        (fetchApi as any).mockRejectedValue(new Error("Network Error"));

        render(<PaginaPerfil />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al cargar datos del perfil");
        });
        
        // Should show "No tienes un perfil de Público" if nothing loaded (no profile)
        expect(screen.getByText("No tienes un perfil de Público")).toBeInTheDocument();
    });

    it("renders profile data once fetched", async () => {
        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByLabelText("Nombre Completo")).toHaveValue("John Public");
        });
        expect(screen.getByLabelText("Correo Electrónico")).toHaveValue("test@user.com");
    });

    it("handles form submission success for PUBLICO", async () => {
        (fetchApi as any).mockImplementation((url: string, options: any) => {
            if (options?.method === "PATCH") {
                return Promise.resolve({ ok: true, json: async () => ({}) });
            }
            return Promise.resolve({ ok: true, json: async () => defaultProfile });
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByLabelText("Nombre Completo")).toBeInTheDocument();
        });

        const nameInput = screen.getByLabelText("Nombre Completo");
        fireEvent.change(nameInput, { target: { value: "John Updated" } });
        
        fireEvent.click(screen.getByTestId("set-verified"));

        const submitBtn = screen.getByRole("button", { name: /guardar cambios/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/perfil', expect.objectContaining({
                method: 'PATCH',
                body: expect.stringContaining("John Updated"),
            }));
            expect(mockUpdate).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith("Perfil actualizado correctamente");
        });
    });

    it("disables submit button when username is not verified", async () => {
        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByLabelText("Nombre Completo")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId("set-unverified"));
        
        const submitBtn = screen.getByRole("button", { name: /guardar cambios/i });
        expect(submitBtn).toBeDisabled();
    });

    it("handles form submission failure for PUBLICO", async () => {
        (fetchApi as any).mockImplementation((url: string, options: any) => {
            if (options?.method === "PATCH") {
                return Promise.resolve({ ok: false, json: async () => ({ message: "Error in server" }) });
            }
            return Promise.resolve({ ok: true, json: async () => defaultProfile });
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByLabelText("Nombre Completo")).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByTestId("set-verified"));

        const submitBtn = screen.getByRole("button", { name: /guardar cambios/i });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error in server");
        });
    });

    it("renders ARTISTA profile and handles form submission", async () => {
        (useSession as any).mockReturnValue({
            data: { ...defaultSession, user: { ...defaultSession.user, rol: "ARTISTA" } },
            update: mockUpdate,
        });

        const artistProfile = {
            ...defaultProfile,
            perfilArtista: {
                nombreArtistico: "Artist John",
                categoria: "SOLISTA",
            }
        };

        (fetchApi as any).mockImplementation((url: string, options: any) => {
            if (options?.method === "PATCH") {
                return Promise.resolve({ ok: true, json: async () => ({}) });
            }
            return Promise.resolve({ ok: true, json: async () => artistProfile });
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByTestId("artist-form")).toBeInTheDocument();
        });

        const submitBtn = screen.getByText("Submit Artist");
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/perfil', expect.objectContaining({
                method: 'PATCH',
                body: expect.stringContaining("BANDA"),
            }));
            expect(toast.success).toHaveBeenCalledWith("Perfil de artista actualizado con éxito");
        });
    });

    it("handles artist form submission error", async () => {
        (useSession as any).mockReturnValue({
            data: { ...defaultSession, user: { ...defaultSession.user, rol: "ARTISTA" } },
            update: mockUpdate,
        });

        const artistProfile = {
            ...defaultProfile,
            perfilArtista: {
                nombreArtistico: "Artist John",
            }
        };

        (fetchApi as any).mockImplementation((url: string, options: any) => {
            if (options?.method === "PATCH") {
                return Promise.resolve({ ok: false, json: async () => ({}) });
            }
            return Promise.resolve({ ok: true, json: async () => artistProfile });
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByTestId("artist-form")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Submit Artist"));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al guardar cambios");
        });
    });

    it("shows placeholder when role is ARTISTA but no perfilArtista exists", async () => {
        (useSession as any).mockReturnValue({
            data: { ...defaultSession, user: { ...defaultSession.user, rol: "ARTISTA" } },
            update: mockUpdate,
        });

        (fetchApi as any).mockResolvedValue({
            ok: true,
            json: async () => defaultProfile, // Only has perfilPublico
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByText("No tienes un perfil de Artista")).toBeInTheDocument();
        });
    });

    it("creates ARTISTA profile when clicking create button in placeholder", async () => {
        (useSession as any).mockReturnValue({
            data: { ...defaultSession, user: { ...defaultSession.user, rol: "ARTISTA" } },
            update: mockUpdate,
        });

        (fetchApi as any).mockImplementation((url: string, options: any) => {
            if (options?.method === "PATCH") {
                return Promise.resolve({ ok: true, json: async () => ({}) });
            }
            return Promise.resolve({ ok: true, json: async () => defaultProfile });
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByText("Crear Perfil de Artista")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Crear Perfil de Artista"));

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/perfil', expect.objectContaining({
                method: 'PATCH',
                body: expect.stringContaining("perfilArtista"),
            }));
            expect(toast.success).toHaveBeenCalledWith("Perfil de artista creado exitosamente");
        });
    });

    it("renders DISCOTECA profile and handles form submission", async () => {
        (useSession as any).mockReturnValue({
            data: { ...defaultSession, user: { ...defaultSession.user, rol: "DISCOTECA" } },
            update: mockUpdate,
        });

        const venueProfile = {
            ...defaultProfile,
            perfilDiscoteca: {
                ciudad: "Lima",
            }
        };

        (fetchApi as any).mockImplementation((url: string, options: any) => {
            if (options?.method === "PATCH") {
                return Promise.resolve({ ok: true, json: async () => ({}) });
            }
            return Promise.resolve({ ok: true, json: async () => venueProfile });
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByTestId("venue-form")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Submit Venue"));

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/perfil', expect.objectContaining({
                method: 'PATCH',
                body: expect.stringContaining("500"),
            }));
            expect(toast.success).toHaveBeenCalledWith("Perfil de discoteca actualizado con éxito");
        });
    });

    it("shows placeholder and creates DISCOTECA profile", async () => {
        (useSession as any).mockReturnValue({
            data: { ...defaultSession, user: { ...defaultSession.user, rol: "DISCOTECA" } },
            update: mockUpdate,
        });

        (fetchApi as any).mockImplementation((url: string, options: any) => {
            if (options?.method === "PATCH") {
                return Promise.resolve({ ok: true, json: async () => ({}) });
            }
            return Promise.resolve({ ok: true, json: async () => defaultProfile });
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByText("Crear Perfil de Discoteca")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Crear Perfil de Discoteca"));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Perfil de discoteca creado exitosamente");
        });
    });

    it("handles creation failure", async () => {
        (useSession as any).mockReturnValue({
            data: { ...defaultSession, user: { ...defaultSession.user, rol: "DISCOTECA" } },
            update: mockUpdate,
        });

        (fetchApi as any).mockImplementation((url: string, options: any) => {
            if (options?.method === "PATCH") {
                return Promise.resolve({ ok: false, json: async () => ({}) });
            }
            return Promise.resolve({ ok: true, json: async () => defaultProfile });
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByText("Crear Perfil de Discoteca")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Crear Perfil de Discoteca"));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al crear el perfil");
        });
    });

    it("handles venue form submission exception", async () => {
        (useSession as any).mockReturnValue({
            data: { ...defaultSession, user: { ...defaultSession.user, rol: "DISCOTECA" } },
            update: mockUpdate,
        });

        const venueProfile = {
            ...defaultProfile,
            perfilDiscoteca: {
                pais: "PE",
                ciudad: "Lima",
                numeroTelefono: "987654321",
                codigoTelefono: "+51",
                zonaHoraria: "America/Lima",
            }
        };

        (fetchApi as any).mockImplementation((url: string, options: any) => {
            if (options?.method === "PATCH") {
                return Promise.reject(new Error("Network Error"));
            }
            return Promise.resolve({ ok: true, json: async () => venueProfile });
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByTestId("venue-form")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Submit Venue"));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al guardar cambios");
        });
    });

    it("displays public profile username and phone selector interactions", async () => {
        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByTestId("username-input")).toBeInTheDocument();
        });

        const usernameInput = screen.getByTestId("username-input");
        fireEvent.change(usernameInput, { target: { value: "johnupdated" } });
        expect(usernameInput).toHaveValue("johnupdated");

        const phoneSelector = screen.getByTestId("country-phone-selector");
        fireEvent.change(phoneSelector, { target: { value: "+1" } });
        expect(phoneSelector).toHaveValue("+1");
    });

    it("loads public profile with accent-insensitive country matching", async () => {
        const accentedProfile = {
            ...defaultProfile,
            perfilPublico: {
                ...defaultProfile.perfilPublico,
                pais: 'Perú',
            },
        };

        (fetchApi as any).mockResolvedValue({
            ok: true,
            json: async () => accentedProfile,
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByTestId("country-phone-selector")).toBeInTheDocument();
        });
    });

    it("handles missing saved country gracefully", async () => {
        const noCountryProfile = {
            ...defaultProfile,
            perfilPublico: {
                ...defaultProfile.perfilPublico,
                pais: '',
            },
        };

        (fetchApi as any).mockResolvedValue({
            ok: true,
            json: async () => noCountryProfile,
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByTestId("country-phone-selector")).toBeInTheDocument();
        });
    });

    it("creates PUBLICO profile when clicking create button in placeholder", async () => {
        (useSession as any).mockReturnValue({
            data: { ...defaultSession, user: { ...defaultSession.user, rol: "PUBLICO" } },
            update: mockUpdate,
        });

        (fetchApi as any).mockImplementation((url: string, options: any) => {
            if (options?.method === "PATCH") {
                return Promise.resolve({ ok: true, json: async () => ({}) });
            }
            return Promise.resolve({ ok: true, json: async () => ({ nombre: 'John Public', correo: 'test@user.com', nombreUsuario: 'johnpublic' }) });
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByText("Crear Perfil de Público")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Crear Perfil de Público"));

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/perfil', expect.objectContaining({ method: 'PATCH' }));
            expect(toast.success).toHaveBeenCalledWith('Perfil de publico creado exitosamente');
        });
    });

    it("handles create profile network error", async () => {
        (useSession as any).mockReturnValue({
            data: { ...defaultSession, user: { ...defaultSession.user, rol: "PUBLICO" } },
            update: mockUpdate,
        });

        (fetchApi as any).mockImplementation((url: string, options: any) => {
            if (options?.method === "PATCH") {
                return Promise.reject(new Error("Network failure"));
            }
            return Promise.resolve({ ok: true, json: async () => ({ nombre: 'John Public', correo: 'test@user.com', nombreUsuario: 'johnpublic' }) });
        });

        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getByText("Crear Perfil de Público")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("Crear Perfil de Público"));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al conectar con el servidor");
        });
    });

    it("changes country and timezone selects in PUBLICO profile", async () => {
        render(<PaginaPerfil />);
        await waitFor(() => {
            expect(screen.getAllByText(/País/i).length).toBeGreaterThan(0);
        });

        const countrySelect = screen.getByTestId('country-phone-selector');
        fireEvent.change(countrySelect, { target: { value: 'PE' } });
        expect(countrySelect).toBeInTheDocument();

        const timezoneTrigger = screen.getByText(/Selecciona zona horaria/i);
        fireEvent.click(timezoneTrigger);
        const timezoneOption = await screen.findByText(/America\/Lima/i);
        fireEvent.click(timezoneOption);

        expect(screen.getByText(/America\/Lima/i)).toBeInTheDocument();
    });

    it("shows error when deleting profile fails due to network error", async () => {
        (useSession as any).mockReturnValue({
            data: { ...defaultSession, user: { ...defaultSession.user, rol: "ADMIN" } },
            update: mockUpdate,
        });

        const discotecaProfile = {
            ...defaultProfile,
            perfilDiscoteca: {
                pais: "PE",
                ciudad: "Lima",
                numeroTelefono: "987654321",
                codigoTelefono: "+51",
                zonaHoraria: "America/Lima",
            }
        };

        (fetchApi as any).mockImplementation((url: string, options: any) => {
            if (url.includes('/api/admin/usuarios/perfil/discoteca')) {
                return Promise.reject(new Error("Network failure"));
            }
            return Promise.resolve({ ok: true, json: async () => discotecaProfile });
        });

        render(<PaginaPerfil />);
        const discotecaTabButton = await screen.findByRole("button", { name: /^Discoteca$/ });
        fireEvent.click(discotecaTabButton);

        const deleteButton = await screen.findByRole('button', { name: /Eliminar Perfil Discoteca/i });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error de conexión al eliminar el perfil");
        });
    });

    describe("Admin Mode", () => {
        beforeEach(() => {
            (useSession as any).mockReturnValue({
                data: { ...defaultSession, user: { ...defaultSession.user, rol: "ADMIN" } },
                update: mockUpdate,
            });
        });

        it("allows admin to switch views", async () => {
            const fullProfile = {
                ...defaultProfile,
                perfilArtista: { nombreArtistico: "Artist" },
                perfilDiscoteca: { ciudad: "Lima" },
            };

            (fetchApi as any).mockResolvedValue({
                ok: true,
                json: async () => fullProfile,
            });

            render(<PaginaPerfil />);
            
            await waitFor(() => {
                expect(screen.getByText("Modo Administrador")).toBeInTheDocument();
            });

            // Initially defaults to PUBLICO if none set, wait, effect sets it based on first found
            // In effect: if perfilArtista it sets 'ARTISTA'
            await waitFor(() => {
                expect(screen.getByTestId("artist-form")).toBeInTheDocument();
            });

            // Switch to Artista
            fireEvent.click(screen.getByRole("button", { name: "Artista" }));
            await waitFor(() => {
                expect(screen.getByTestId("artist-form")).toBeInTheDocument();
            });

            // Switch to Discoteca
            fireEvent.click(screen.getByRole("button", { name: "Discoteca" }));
            await waitFor(() => {
                expect(screen.getByTestId("venue-form")).toBeInTheDocument();
            });

            // Switch to Publico
            fireEvent.click(screen.getByRole("button", { name: "Público" }));
            await waitFor(() => {
                expect(screen.getByLabelText("Nombre Completo")).toBeInTheDocument();
            });
        });

        it("uses perfilDiscoteca branch for admin profile data and normalizes country names", async () => {
            const discotecaOnlyProfile = {
                ...defaultProfile,
                perfilDiscoteca: {
                    pais: "Perú",
                    ciudad: "Cusco",
                    numeroTelefono: "987654321",
                    codigoTelefono: "+51",
                    zonaHoraria: "America/Lima",
                },
            };

            (fetchApi as any).mockResolvedValue({
                ok: true,
                json: async () => discotecaOnlyProfile,
            });

            render(<PaginaPerfil />);

            await waitFor(() => {
                expect(screen.getByText("Modo Administrador")).toBeInTheDocument();
                expect(screen.getByTestId('venue-form')).toBeInTheDocument();
                expect(screen.getByTestId('venue-city')).toHaveTextContent('Cusco');
            });
        });

        it("allows admin to delete discoteca profile", async () => {
            const discotecaProfile = {
                ...defaultProfile,
                perfilDiscoteca: {
                    pais: "PE",
                    ciudad: "Lima",
                    numeroTelefono: "987654321",
                    codigoTelefono: "+51",
                    zonaHoraria: "America/Lima",
                },
            };

            (fetchApi as any).mockImplementation((url: string, options: any) => {
                if (url.includes('/api/usuarios/perfil/')) {
                    return Promise.resolve({ ok: true, json: async () => discotecaProfile });
                }
                if (url.includes('/api/admin/usuarios/perfil/discoteca')) {
                    return Promise.resolve({ ok: true, json: async () => ({}) });
                }
                return Promise.resolve({ ok: true, json: async () => ({}) });
            });

            render(<PaginaPerfil />);

            const deleteButton = await screen.findByRole('button', { name: /Eliminar Perfil Discoteca/i });
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(fetchApi).toHaveBeenCalledWith('/api/admin/usuarios/perfil/discoteca', expect.objectContaining({ method: 'DELETE' }));
                expect(toast.success).toHaveBeenCalledWith('Perfil de discoteca eliminado correctamente');
            });
        });

        it("allows admin to delete publico profile", async () => {
            const publicoProfile = {
                ...defaultProfile,
                perfilPublico: {
                    pais: "PE",
                    ciudad: "Lima",
                    numeroTelefono: "987654321",
                    codigoTelefono: "+51",
                    zonaHoraria: "America/Lima",
                },
            };

            (fetchApi as any).mockImplementation((url: string, options: any) => {
                if (url.includes('/api/usuarios/perfil/')) {
                    return Promise.resolve({ ok: true, json: async () => publicoProfile });
                }
                if (url.includes('/api/admin/usuarios/perfil/publico')) {
                    return Promise.resolve({ ok: true, json: async () => ({}) });
                }
                return Promise.resolve({ ok: true, json: async () => ({}) });
            });

            render(<PaginaPerfil />);

            const deleteButton = await screen.findByRole('button', { name: /Eliminar Perfil Público/i });
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(fetchApi).toHaveBeenCalledWith('/api/admin/usuarios/perfil/publico', expect.objectContaining({ method: 'DELETE' }));
                expect(toast.success).toHaveBeenCalledWith('Perfil de publico eliminado correctamente');
            });
        });

        it("handles profile deletion error", async () => {
            const fullProfile = {
                ...defaultProfile,
                perfilArtista: { nombreArtistico: "Artist" },
            };

            (fetchApi as any).mockImplementation((url: string, options: any) => {
                if (options?.method === "DELETE") {
                    return Promise.resolve({ ok: true, json: async () => ({}) });
                }
                return Promise.resolve({ ok: true, json: async () => fullProfile });
            });

            render(<PaginaPerfil />);
            
            await waitFor(() => {
                expect(screen.getByTestId("artist-form")).toBeInTheDocument();
            });

            const deleteBtn = screen.getByRole("button", { name: /Eliminar Perfil Artista/i });
            fireEvent.click(deleteBtn);

            expect(global.confirm).toHaveBeenCalled();

            await waitFor(() => {
                expect(fetchApi).toHaveBeenCalledWith('/api/admin/usuarios/perfil/artista', expect.objectContaining({
                    method: 'DELETE'
                }));
                expect(toast.success).toHaveBeenCalledWith("Perfil de artista eliminado correctamente");
            });
        });

        it("handles profile deletion error", async () => {
            const fullProfile = {
                ...defaultProfile,
                perfilArtista: { nombreArtistico: "Artist" },
            };

            (fetchApi as any).mockImplementation((url: string, options: any) => {
                if (options?.method === "DELETE") {
                    return Promise.resolve({ ok: false, json: async () => ({ message: "Delete failed" }) });
                }
                return Promise.resolve({ ok: true, json: async () => fullProfile });
            });

            render(<PaginaPerfil />);
            
            await waitFor(() => {
                expect(screen.getByTestId("artist-form")).toBeInTheDocument();
            });

            const deleteBtn = screen.getByRole("button", { name: /Eliminar Perfil Artista/i });
            fireEvent.click(deleteBtn);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("Delete failed");
            });
        });
        
        it("handles delete confirmation cancel", async () => {
            const fullProfile = {
                ...defaultProfile,
                perfilArtista: { nombreArtistico: "Artist" },
            };

            (global.confirm as any).mockReturnValue(false);

            (fetchApi as any).mockResolvedValue({
                ok: true,
                json: async () => fullProfile,
            });

            render(<PaginaPerfil />);
            
            await waitFor(() => {
                expect(screen.getByTestId("artist-form")).toBeInTheDocument();
            });

            const deleteBtn = screen.getByRole("button", { name: /Eliminar Perfil Artista/i });
            fireEvent.click(deleteBtn);

            expect(fetchApi).toHaveBeenCalledTimes(1); // Only the initial load
        });
    });

    describe("Artist Tabs", () => {
        beforeEach(() => {
            (useSession as any).mockReturnValue({
                data: { ...defaultSession, user: { ...defaultSession.user, rol: "ARTISTA" } },
                update: mockUpdate,
            });
        });

        it("renders artist specific tabs triggers (Gallery, Social, Donation)", async () => {
            const artistProfile = {
                ...defaultProfile,
                perfilArtista: {
                    nombreArtistico: "Artist John",
                    galeria: [],
                    redesSociales: [],
                    metodosDonacion: [],
                }
            };

            (fetchApi as any).mockResolvedValue({
                ok: true,
                json: async () => artistProfile,
            });

            render(<PaginaPerfil />);
            
            await waitFor(() => {
                expect(screen.getByRole("tab", { name: /Galería/i })).toBeInTheDocument();
            });
        });

        it("renders Gallery tab content when activeTab is gallery", async () => {
            (useSearchParams as any).mockReturnValue({
                get: vi.fn().mockReturnValue("gallery"),
            });

            const artistProfile = {
                ...defaultProfile,
                perfilArtista: { nombreArtistico: "Artist John" }
            };

            (fetchApi as any).mockResolvedValue({
                ok: true,
                json: async () => artistProfile,
            });

            render(<PaginaPerfil />);
            await waitFor(() => {
                expect(screen.getByTestId("gallery-form")).toBeInTheDocument();
            });
        });

        it("renders Social tab content when activeTab is social", async () => {
            (useSearchParams as any).mockReturnValue({
                get: vi.fn().mockReturnValue("social"),
            });

            const artistProfile = {
                ...defaultProfile,
                perfilArtista: { nombreArtistico: "Artist John" }
            };

            (fetchApi as any).mockResolvedValue({
                ok: true,
                json: async () => artistProfile,
            });

            render(<PaginaPerfil />);
            await waitFor(() => {
                expect(screen.getByTestId("social-form")).toBeInTheDocument();
            });
        });

        it("renders Donation tab content when activeTab is donation", async () => {
            (useSearchParams as any).mockReturnValue({
                get: vi.fn().mockReturnValue("donation"),
            });

            const artistProfile = {
                ...defaultProfile,
                perfilArtista: { nombreArtistico: "Artist John" }
            };

            (fetchApi as any).mockResolvedValue({
                ok: true,
                json: async () => artistProfile,
            });

            render(<PaginaPerfil />);
            await waitFor(() => {
                expect(screen.getByTestId("donation-form")).toBeInTheDocument();
            });
        });
    });
});
