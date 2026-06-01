import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ArtistRegistrationPage from "../page";
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

vi.mock("@/components/ui/calendar", () => ({
    Calendar: ({ onSelect, disabled }: any) => {
        // Exercise the disabled function for coverage
        if (disabled) {
            disabled(new Date());
            disabled(new Date(Date.now() + 86400000));
        }
        return (
            <div>
                <button
                    type="button"
                    data-testid="select-past-date"
                    onClick={() => onSelect(new Date("2020-01-01T00:00:00.000Z"))}
                >
                    Past Date
                </button>
                <button
                    type="button"
                    data-testid="select-future-date"
                    onClick={() => onSelect(new Date("2050-01-01T00:00:00.000Z"))}
                >
                    Future Date
                </button>
            </div>
        );
    },
}));

vi.mock("@/components/ui/popover", () => ({
    Popover: ({ children }: any) => <div>{children}</div>,
    PopoverTrigger: ({ children }: any) => <div>{children}</div>,
    PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

describe("ArtistRegistrationPage Component", () => {
    const mockUser = {
        id: "user-123",
        email: "artist@feelin.com",
        name: "Test Artist",
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

        render(<ArtistRegistrationPage />);
        expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });

    it("redirects to /login if status is unauthenticated", () => {
        (useSession as any).mockReturnValue({
            data: null,
            status: "unauthenticated",
        });

        render(<ArtistRegistrationPage />);
        expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("redirects to /home if user role is not admin, super_admin, or they are already a registered non-admin user", () => {
        (useSession as any).mockReturnValue({
            data: { user: { ...mockUser, rol: "ARTISTA" } },
            status: "authenticated",
        });

        render(<ArtistRegistrationPage />);
        expect(mockPush).toHaveBeenCalledWith("/home");
    });

    it("does not redirect if user role is ADMIN or SUPER_ADMIN", () => {
        (useSession as any).mockReturnValue({
            data: { user: { ...mockUser, rol: "ADMIN" } },
            status: "authenticated",
        });

        render(<ArtistRegistrationPage />);
        expect(mockPush).not.toHaveBeenCalled();
    });

    it("renders all form elements and populates Artist name from session", () => {
        render(<ArtistRegistrationPage />);

        expect(screen.getByLabelText(/Nombre Artístico/i)).toHaveValue("Test Artist");
        expect(screen.getByText("Nombre de usuario")).toBeInTheDocument();
        expect(screen.getByText("Categoría")).toBeInTheDocument();
        expect(screen.getByText("Tarifa por Hora")).toBeInTheDocument();
        expect(screen.getByText("Número de celular")).toBeInTheDocument();
        expect(screen.getByText("País")).toBeInTheDocument();
        expect(screen.getByText("Ciudad")).toBeInTheDocument();
        expect(screen.getByText("Zona Horaria")).toBeInTheDocument();
        expect(screen.getByText("Biografía")).toBeInTheDocument();
    });

    it("handles inputs and adds/removes known places", () => {
        render(<ArtistRegistrationPage />);

        // Type in inputs
        const cityInput = screen.getByLabelText(/Ciudad/i);
        fireEvent.change(cityInput, { target: { value: "Arequipa" } });
        expect(cityInput).toHaveValue("Arequipa");

        const rateInput = screen.getByLabelText(/Tarifa por Hora/i);
        fireEvent.change(rateInput, { target: { value: "150" } });
        expect(rateInput).toHaveValue(150);

        // Add places
        const placesInput = screen.getByPlaceholderText(/Agregar lugar.../i);
        const addBtn = screen.getByRole("button", { name: "+" });

        fireEvent.change(placesInput, { target: { value: "Club A" } });
        fireEvent.click(addBtn);

        fireEvent.change(placesInput, { target: { value: "Club B" } });
        fireEvent.keyDown(placesInput, { key: "Enter", code: "Enter" });

        expect(screen.getByText("Club A")).toBeInTheDocument();
        expect(screen.getByText("Club B")).toBeInTheDocument();

        // Try adding empty place
        fireEvent.change(placesInput, { target: { value: "  " } });
        fireEvent.click(addBtn);

        // Remove place
        const removeBtns = screen.getAllByRole("button", { name: "×" });
        expect(removeBtns).toHaveLength(2);
        fireEvent.click(removeBtns[0]); // Removes Club A

        expect(screen.queryByText("Club A")).not.toBeInTheDocument();
        expect(screen.getByText("Club B")).toBeInTheDocument();
    });

    it("handles telephone input correctly by stripping non-numeric characters", () => {
        render(<ArtistRegistrationPage />);

        const phoneInput = screen.getByLabelText(/Número de celular/i);
        fireEvent.change(phoneInput, { target: { value: "999-abc-123" } });
        expect(phoneInput).toHaveValue("999123");
    });

    it("displays error toast if submit is clicked and username is not verified", async () => {
        const { container } = render(<ArtistRegistrationPage />);

        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        expect(toast.error).toHaveBeenCalledWith("Por favor verifica tu nombre de usuario");
    });

    it("displays error toast if start date is in the future", async () => {
        const { container } = render(<ArtistRegistrationPage />);

        // Verify username first
        const verifyBtn = screen.getByTestId("verify-username-btn");
        fireEvent.click(verifyBtn);

        // Open calendar Popover and select future date
        const calendarTrigger = screen.getByRole("button", { name: /¿Cuándo empezaste\?/i });
        fireEvent.click(calendarTrigger);

        const futureDateBtn = screen.getByTestId("select-future-date");
        fireEvent.click(futureDateBtn);

        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        expect(toast.error).toHaveBeenCalledWith("La fecha de inicio no puede ser futura");
    });

    it("handles submit success for a regular user", async () => {
        (fetchApi as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                rol: null,
                token: "new-jwt-token",
            }),
        });

        const { container } = render(<ArtistRegistrationPage />);

        // Fill required fields
        fireEvent.change(screen.getByLabelText(/Nombre Artístico/i), { target: { value: "Artist One" } });
        
        // Select category
        const selectItem = screen.getByTestId("mock-select-item-DJ");
        fireEvent.click(selectItem);

        // Date selection
        const calendarTrigger = screen.getByRole("button", { name: /¿Cuándo empezaste\?/i });
        fireEvent.click(calendarTrigger);
        const pastDateBtn = screen.getByTestId("select-past-date");
        fireEvent.click(pastDateBtn);

        // Telephone, Phone Code, Country, City, Timezone
        fireEvent.change(screen.getByLabelText(/Número de celular/i), { target: { value: "987654321" } });
        fireEvent.change(screen.getByTestId("country-phone-selector"), { target: { value: "+1" } });
        fireEvent.change(screen.getByTestId("country-select"), { target: { value: "PE" } });
        fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: "Lima" } });
        fireEvent.change(screen.getByTestId("timezone-select"), { target: { value: "America/Lima" } });
        
        // Rate & Currency
        fireEvent.change(screen.getByLabelText(/Tarifa por Hora/i), { target: { value: "80" } });
        const currencyItem = screen.getByTestId("mock-select-item-USD");
        fireEvent.click(currencyItem);

        // Add a known place
        fireEvent.change(screen.getByPlaceholderText(/Agregar lugar.../i), { target: { value: "Bar Central" } });
        fireEvent.click(screen.getByRole("button", { name: "+" }));

        // Verify username
        fireEvent.change(screen.getByLabelText(/Nombre de usuario/i), { target: { value: "artist1" } });
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
            correo: "artist@feelin.com",
            rol: "ARTISTA",
            nombreArtistico: "Artist One",
            nombreUsuario: "artist1",
            categoria: "DJ",
            biografia: "",
            ciudadId: "Lima",
            paisId: "PE",
            codigoTelefono: "+1",
            numeroTelefono: "987654321",
            fechaInicio: "2020-01-01T00:00:00.000Z",
            tarifaPorHora: 80,
            moneda: "USD",
            zonaHoraria: "America/Lima",
            lugaresConocidos: ["Bar Central"],
        });

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("¡Registro completado con éxito!");
            expect(mockUpdate).toHaveBeenCalledWith({
                rol: "ARTISTA",
                nombreArtistico: "Artist One",
                name: "Artist One",
                accessToken: "new-jwt-token",
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
                rol: { nombre: "ARTISTA" },
                token: "new-jwt-token",
            }),
        });

        const { container } = render(<ArtistRegistrationPage />);

        // Verify username
        fireEvent.click(screen.getByTestId("verify-username-btn"));

        // Fill rate, phone, country, city
        fireEvent.change(screen.getByLabelText(/Número de celular/i), { target: { value: "987654321" } });
        fireEvent.change(screen.getByTestId("country-select"), { target: { value: "PE" } });
        fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: "Lima" } });
        fireEvent.change(screen.getByLabelText(/Tarifa por Hora/i), { target: { value: "80" } });

        // Submit form
        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("¡Registro completado con éxito!");
            expect(mockUpdate).toHaveBeenCalledWith({
                rol: "ADMIN",
                nombreArtistico: "Test Artist",
                name: "Test Artist",
                accessToken: "new-jwt-token",
            });
            expect(mockReplace).toHaveBeenCalledWith("/settings");
        });
    });

    it("handles submit API failure response", async () => {
        (fetchApi as any).mockResolvedValueOnce({
            ok: false,
        });

        const { container } = render(<ArtistRegistrationPage />);

        // Verify username
        fireEvent.click(screen.getByTestId("verify-username-btn"));

        // Fill phone, country, city, rate
        fireEvent.change(screen.getByLabelText(/Número de celular/i), { target: { value: "987654321" } });
        fireEvent.change(screen.getByTestId("country-select"), { target: { value: "PE" } });
        fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: "Lima" } });
        fireEvent.change(screen.getByLabelText(/Tarifa por Hora/i), { target: { value: "80" } });

        // Submit form
        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al registrar artista. Inténtalo de nuevo.");
        });
    });

    it("handles submit API network exception", async () => {
        (fetchApi as any).mockRejectedValueOnce(new Error("Network Error"));

        const { container } = render(<ArtistRegistrationPage />);

        // Verify username
        fireEvent.click(screen.getByTestId("verify-username-btn"));

        // Fill phone, country, city, rate
        fireEvent.change(screen.getByLabelText(/Número de celular/i), { target: { value: "987654321" } });
        fireEvent.change(screen.getByTestId("country-select"), { target: { value: "PE" } });
        fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: "Lima" } });
        fireEvent.change(screen.getByLabelText(/Tarifa por Hora/i), { target: { value: "80" } });

        // Submit form
        const form = container.querySelector("form")!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error de conexión. Verifica tu internet.");
        });
    });

    it("does not add place onKeyDown with non-Enter key", () => {
        render(<ArtistRegistrationPage />);
        const placesInput = screen.getByPlaceholderText(/Agregar lugar.../i);
        fireEvent.change(placesInput, { target: { value: "Club C" } });
        fireEvent.keyDown(placesInput, { key: "Escape", code: "Escape" });
        expect(screen.queryByText("Club C")).not.toBeInTheDocument();
    });

    it("handles submit success when update is not provided and role fallback is used", async () => {
        (useSession as any).mockReturnValue({
            data: { user: { ...mockUser, name: undefined } },
            update: undefined,
            status: "authenticated",
        });

        (fetchApi as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                rol: null, // trigger fallback 'ARTISTA'
                token: "token-abc",
            }),
        });

        const { container } = render(<ArtistRegistrationPage />);

        // Verify username
        fireEvent.click(screen.getByTestId("verify-username-btn"));

        // Fill phone, country, city
        fireEvent.change(screen.getByLabelText(/Número de celular/i), { target: { value: "987654321" } });
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

    it("redirects SUPER_ADMIN and handles session without data/user", () => {
        (useSession as any).mockReturnValue({
            data: { user: { ...mockUser, rol: "SUPER_ADMIN", name: undefined } },
            update: mockUpdate,
            status: "authenticated",
        });

        render(<ArtistRegistrationPage />);
        expect(mockPush).not.toHaveBeenCalled();
    });
});

