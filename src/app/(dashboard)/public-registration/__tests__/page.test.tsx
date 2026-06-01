import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaginaRegistroPublico from "../page";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

// Mock hooks and modules
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
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("@/components/ui/country-phone-selector", () => ({
    CountryPhoneSelector: ({ value, onValueChange }: any) => (
        <select
            data-testid="country-phone-selector"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
        >
            <option value="+51">+51</option>
            <option value="+1">+1</option>
        </select>
    ),
}));

vi.mock("@/components/ui/country-select", () => ({
    CountrySelect: ({ value, onValueChange }: any) => (
        <select
            data-testid="country-select"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
        >
            <option value="">Selecciona país</option>
            <option value="PE">PE</option>
            <option value="US">US</option>
        </select>
    ),
}));

vi.mock("@/components/ui/timezone-select", () => ({
    TimezoneSelect: ({ value, onValueChange }: any) => (
        <select
            data-testid="timezone-select"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
        >
            <option value="America/Lima">America/Lima</option>
            <option value="UTC">UTC</option>
        </select>
    ),
}));

vi.mock("@/components/auth/UsernameInput", () => ({
    UsernameInput: ({ value, onChange, onStatusChange }: any) => (
        <div>
            <label htmlFor="username-input">Nombre de usuario</label>
            <input
                id="username-input"
                data-testid="username-input"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                }}
            />
            <button type="button" onClick={() => onStatusChange(true)} data-testid="verify-username-btn">
                Verificar
            </button>
        </div>
    ),
}));

vi.mock("@/components/ui/back-button", () => ({
    BackButton: ({ href }: any) => <a href={href} data-testid="back-button">Back</a>,
}));

vi.mock("@/components/animated-background", () => ({
    AnimatedBackground: () => <div data-testid="animated-bg" />,
}));

describe("PaginaRegistroPublico Component", () => {
    const mockUser = {
        id: "user-789",
        email: "public@feelin.com",
        name: "Test Public User",
        rol: "PUBLICO",
    };

    const mockUpdate = vi.fn();
    const mockReplace = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
        mockPush.mockReset();
        mockUpdate.mockReset();
        mockReplace.mockReset();

        // Mock globalThis.location.replace
        Object.defineProperty(window, "location", {
            value: {
                replace: mockReplace,
            },
            writable: true,
            configurable: true,
        });

        // Set default useSession mock
        (useSession as any).mockReturnValue({
            data: { user: mockUser },
            update: mockUpdate,
            status: "authenticated",
        });

        // Set default fetchApi mock
        (fetchApi as any).mockResolvedValue({
            ok: true,
            json: async () => ({}),
        });
    });

    it("renders loading screen initially when status is loading", () => {
        (useSession as any).mockReturnValue({
            data: null,
            status: "loading",
        });

        render(<PaginaRegistroPublico />);
        expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });

    it("redirects to /login if status is unauthenticated", () => {
        (useSession as any).mockReturnValue({
            data: null,
            status: "unauthenticated",
        });

        render(<PaginaRegistroPublico />);
        expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("redirects to /home if user role is not admin, super_admin, or they are already a registered non-admin user", () => {
        (useSession as any).mockReturnValue({
            data: { user: { ...mockUser, rol: "PUBLICO" } }, // regular user, already registered public
            status: "authenticated",
        });

        render(<PaginaRegistroPublico />);
        // Wait, wait... in the page component, it checks:
        // const rolUsuario = session?.user?.rol;
        // if (rolUsuario && rolUsuario !== 'SUPER_ADMIN' && rolUsuario !== 'ADMIN') { router.push('/home') }
        // Yes! Since mockUser has rol = "PUBLICO", it redirects to /home!
        expect(mockPush).toHaveBeenCalledWith("/home");
    });

    it("does not redirect if user role is ADMIN or SUPER_ADMIN", () => {
        (useSession as any).mockReturnValue({
            data: { user: { ...mockUser, rol: "SUPER_ADMIN" } },
            status: "authenticated",
        });

        render(<PaginaRegistroPublico />);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it("renders all form elements and populates name from session", () => {
        render(<PaginaRegistroPublico />);

        expect(screen.getByLabelText(/Nombre Completo/i)).toHaveValue("Test Public User");
        expect(screen.getByText("Nombre de usuario")).toBeInTheDocument();
        expect(screen.getByText("Número de celular")).toBeInTheDocument();
        expect(screen.getByText("País")).toBeInTheDocument();
        expect(screen.getByText("Ciudad")).toBeInTheDocument();
        expect(screen.getByText("Zona Horaria")).toBeInTheDocument();
    });

    it("handles inputs and updates form state", () => {
        render(<PaginaRegistroPublico />);

        const nameInput = screen.getByLabelText(/Nombre Completo/i);
        fireEvent.change(nameInput, { target: { value: "New Public Name" } });
        expect(nameInput).toHaveValue("New Public Name");

        const cityInput = screen.getByLabelText(/Ciudad/i);
        fireEvent.change(cityInput, { target: { value: "Arequipa" } });
        expect(cityInput).toHaveValue("Arequipa");
    });

    it("handles telephone input correctly by stripping non-numeric characters", () => {
        render(<PaginaRegistroPublico />);

        const phoneInput = screen.getByLabelText(/Número de celular/i);
        fireEvent.change(phoneInput, { target: { value: "999-xyz-111" } });
        expect(phoneInput).toHaveValue("999111");
    });

    it("displays error toast if submit is clicked and username is not verified", async () => {
        const { container } = render(<PaginaRegistroPublico />);

        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        expect(toast.error).toHaveBeenCalledWith("Por favor verifica tu nombre de usuario");
    });

    it("handles submit success for a regular user", async () => {
        (fetchApi as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                rol: null,
                token: "new-public-jwt",
            }),
        });

        const { container } = render(<PaginaRegistroPublico />);

        // Fill required fields
        fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: "John Doe" } });
        
        // Telephone, Country, City, Timezone
        fireEvent.change(screen.getByLabelText(/Número de celular/i), { target: { value: "912345678" } });
        fireEvent.change(screen.getByTestId("country-phone-selector"), { target: { value: "+1" } });
        fireEvent.change(screen.getByTestId("country-select"), { target: { value: "PE" } });
        fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: "Lima" } });
        fireEvent.change(screen.getByTestId("timezone-select"), { target: { value: "America/Lima" } });

        // Verify username
        fireEvent.change(screen.getByLabelText(/Nombre de usuario/i), { target: { value: "johndoe" } });
        fireEvent.click(screen.getByTestId("verify-username-btn"));

        // Submit form directly
        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/rol", expect.objectContaining({
                method: "PATCH",
                body: expect.any(String),
            }));
        });

        const callPayload = JSON.parse((fetchApi as any).mock.calls[0][1].body);
        expect(callPayload).toEqual({
            correo: "public@feelin.com",
            rol: "PUBLICO",
            nombre: "John Doe",
            nombreUsuario: "johndoe",
            ciudad: "Lima",
            pais: "PE",
            codigoTelefono: "+1",
            numeroTelefono: "912345678",
            zonaHoraria: "America/Lima",
        });

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("¡Registro completado con éxito!");
            expect(mockUpdate).toHaveBeenCalledWith({
                rol: "PUBLICO",
                name: "John Doe",
                accessToken: "new-public-jwt",
            });
            expect(mockReplace).toHaveBeenCalledWith("/home");
        });
    });

    it("handles submit success for an admin user", async () => {
        (useSession as any).mockReturnValue({
            data: { user: { ...mockUser, rol: "ADMIN" } },
            update: mockUpdate,
            status: "authenticated",
        });

        (fetchApi as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                rol: { nombre: "PUBLICO" },
                token: "new-public-jwt",
            }),
        });

        const { container } = render(<PaginaRegistroPublico />);

        // Verify username
        fireEvent.click(screen.getByTestId("verify-username-btn"));

        // Fill phone, country, city
        fireEvent.change(screen.getByLabelText(/Número de celular/i), { target: { value: "912345678" } });
        fireEvent.change(screen.getByTestId("country-select"), { target: { value: "PE" } });
        fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: "Lima" } });

        // Submit form
        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("¡Registro completado con éxito!");
            expect(mockUpdate).toHaveBeenCalledWith({
                rol: "ADMIN",
                name: "Test Public User",
                accessToken: "new-public-jwt",
            });
            expect(mockReplace).toHaveBeenCalledWith("/settings");
        });
    });

    it("handles submit API failure response", async () => {
        (fetchApi as any).mockResolvedValueOnce({
            ok: false,
        });

        const { container } = render(<PaginaRegistroPublico />);

        // Verify username
        fireEvent.click(screen.getByTestId("verify-username-btn"));

        // Fill phone, country, city
        fireEvent.change(screen.getByLabelText(/Número de celular/i), { target: { value: "912345678" } });
        fireEvent.change(screen.getByTestId("country-select"), { target: { value: "PE" } });
        fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: "Lima" } });

        // Submit form
        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al registrar perfil público. Inténtalo de nuevo.");
        });
    });

    it("handles submit API network exception", async () => {
        (fetchApi as any).mockRejectedValueOnce(new Error("Network Error"));

        const { container } = render(<PaginaRegistroPublico />);

        // Verify username
        fireEvent.click(screen.getByTestId("verify-username-btn"));

        // Fill phone, country, city
        fireEvent.change(screen.getByLabelText(/Número de celular/i), { target: { value: "912345678" } });
        fireEvent.change(screen.getByTestId("country-select"), { target: { value: "PE" } });
        fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: "Lima" } });

        // Submit form
        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error de conexión. Verifica tu internet.");
        });
    });

    it("handles submit success when update is not provided", async () => {
        (useSession as any).mockReturnValue({
            data: { user: mockUser },
            update: undefined,
            status: "authenticated",
        });

        (fetchApi as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                rol: { nombre: "PUBLICO" },
                token: "token-xyz",
            }),
        });

        const { container } = render(<PaginaRegistroPublico />);

        // Verify username
        fireEvent.click(screen.getByTestId("verify-username-btn"));

        // Fill phone, country, city
        fireEvent.change(screen.getByLabelText(/Número de celular/i), { target: { value: "912345678" } });
        fireEvent.change(screen.getByTestId("country-select"), { target: { value: "PE" } });
        fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: "Lima" } });

        // Submit form
        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("¡Registro completado con éxito!");
            expect(mockReplace).toHaveBeenCalledWith("/home");
        });
    });
});
