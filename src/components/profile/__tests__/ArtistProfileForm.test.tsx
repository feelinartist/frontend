import React, { createContext, useContext } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtistProfileForm } from "../ArtistProfileForm";

// Mock UsernameInput
vi.mock("@/components/auth/UsernameInput", () => ({
    UsernameInput: ({ value, onChange, onStatusChange }: any) => (
        <div>
            <label htmlFor="username">Username</label>
            <input
                id="username"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    onStatusChange(true);
                }}
            />
        </div>
    ),
}));

// Mock CountryPhoneSelector, CountrySelect, and TimezoneSelect
vi.mock("@/components/ui/country-phone-selector", () => ({
    CountryPhoneSelector: ({ value, onValueChange }: any) => (
        <select data-testid="phone-selector" value={value} onChange={(e) => onValueChange(e.target.value)}>
            <option value="+51">+51</option>
            <option value="+1">+1</option>
        </select>
    ),
}));

vi.mock("@/components/ui/country-select", () => ({
    CountrySelect: ({ value, onValueChange }: any) => (
        <select data-testid="country-selector" value={value} onChange={(e) => onValueChange(e.target.value)}>
            <option value="PE">Peru</option>
            <option value="US">USA</option>
        </select>
    ),
}));

vi.mock("@/components/ui/timezone-select", () => ({
    TimezoneSelect: ({ value, onValueChange }: any) => (
        <select data-testid="timezone-selector" value={value} onChange={(e) => onValueChange(e.target.value)}>
            <option value="America/Lima">America/Lima</option>
            <option value="UTC">UTC</option>
        </select>
    ),
}));

const SelectContext = createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
}>({});

// Mock @/components/ui/select
vi.mock("@/components/ui/select", () => ({
    Select: ({ children, value, onValueChange }: any) => (
        <SelectContext.Provider value={{ value, onValueChange }}>
            <div data-testid="mock-radix-select" data-value={value}>
                {children}
            </div>
        </SelectContext.Provider>
    ),
    SelectTrigger: ({ children, className }: any) => <button type="button" data-testid="mock-radix-select-trigger" className={className}>{children}</button>,
    SelectValue: ({ placeholder }: any) => <span data-testid="mock-radix-select-value">{placeholder}</span>,
    SelectContent: ({ children, className }: any) => <div data-testid="mock-radix-select-content" className={className}>{children}</div>,
    SelectItem: ({ children, value }: any) => {
        const { onValueChange, value: selectedValue } = useContext(SelectContext);
        const isSelected = selectedValue === value;
        return (
            <button
                type="button"
                data-testid={`mock-radix-select-item-${value}`}
                data-selected={isSelected}
                onClick={() => onValueChange?.(value)}
            >
                {children}
            </button>
        );
    },
}));

// Mock @/components/ui/calendar
vi.mock("@/components/ui/calendar", () => ({
    Calendar: ({ selected, onSelect, disabled }: any) => {
        disabled?.(new Date("2020-01-01"));
        disabled?.(new Date("2030-01-01"));
        return (
            <button
                data-testid="mock-calendar-day"
                onClick={() => onSelect(new Date("2020-05-15T12:00:00.000Z"))}
                type="button"
            >
                Select Date
            </button>
        );
    },
}));

describe("ArtistProfileForm Component", () => {
    const mockCountries = [
        { name: "Perú", code: "PE", phoneCode: "+51" },
        { name: "Estados Unidos", code: "US", phoneCode: "+1" },
    ];
    const mockTimezones = ["America/Lima", "UTC"];

    const defaultProps = {
        userData: {
            nombre: "Artist Test",
            nombreUsuario: "artisttest",
            correo: "artist@test.com",
            perfilArtista: {
                nombreArtistico: "Art Test",
                categoria: "DJ",
                biografia: "Test bio",
                ciudad: "Lima",
                pais: "PE",
                codigoTelefono: "+51",
                numeroTelefono: "999111222",
                tarifaPorHora: "150",
                moneda: "PEN",
                zonaHoraria: "America/Lima",
                fechaInicio: "2018-05-20T00:00:00.000Z",
                lugaresConocidos: ["Club A", "Club B"],
                urlYoutubeFavorito: "https://youtube.com/fav",
                urlSoundCloudFavorito: "https://soundcloud.com/fav",
            },
        },
        onSubmit: vi.fn().mockResolvedValue(undefined),
        countries: mockCountries,
        timezones: mockTimezones,
        isLoading: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders form fields initialized with artist user data", () => {
        render(<ArtistProfileForm {...defaultProps} />);

        expect(screen.getByLabelText("Nombre Artístico")).toHaveValue("Art Test");
        expect(screen.getByLabelText("Correo Electrónico")).toHaveValue("artist@test.com");
        expect(screen.getByLabelText("Ciudad")).toHaveValue("Lima");
        expect(screen.getByLabelText("Número de celular")).toHaveValue("999111222");
        expect(screen.getByLabelText("Tarifa por Hora")).toHaveValue(150);
        expect(screen.getByLabelText("Biografía")).toHaveValue("Test bio");
        expect(screen.getByLabelText("Video Favorito de YouTube (URL)")).toHaveValue("https://youtube.com/fav");
        expect(screen.getByLabelText("Canción Favorita de SoundCloud (URL)")).toHaveValue("https://soundcloud.com/fav");
        expect(screen.getByText("Club A")).toBeInTheDocument();
        expect(screen.getByText("Club B")).toBeInTheDocument();
    });

    it("handles standard text input changes", () => {
        render(<ArtistProfileForm {...defaultProps} />);

        const artisticNameInput = screen.getByLabelText("Nombre Artístico");
        fireEvent.change(artisticNameInput, { target: { name: "nombreArtistico", value: "New Art Name" } });
        expect(artisticNameInput).toHaveValue("New Art Name");

        const phoneInput = screen.getByLabelText("Número de celular");
        fireEvent.change(phoneInput, { target: { name: "numeroTelefono", value: "987a654" } });
        expect(phoneInput).toHaveValue("987654"); // sanitization replaces non-digits
    });

    it("handles select category change", () => {
        render(<ArtistProfileForm {...defaultProps} />);
        
        const categoryTrigger = screen.getAllByTestId("mock-radix-select-trigger")[0];
        expect(categoryTrigger).toBeInTheDocument();

        const categoryItemBanda = screen.getByTestId("mock-radix-select-item-BANDA");
        fireEvent.click(categoryItemBanda);
    });

    it("handles adding and removing known places", () => {
        render(<ArtistProfileForm {...defaultProps} />);

        const placeInput = screen.getByPlaceholderText("Agregar lugar...");
        const addButton = screen.getByText("+");

        // Add a new place
        fireEvent.change(placeInput, { target: { value: "New Club" } });
        fireEvent.click(addButton);
        expect(screen.getByText("New Club")).toBeInTheDocument();

        // Add a place by pressing Enter key
        fireEvent.change(placeInput, { target: { value: "Enter Club" } });
        fireEvent.keyDown(placeInput, { key: "Enter", code: "Enter" });
        expect(screen.getByText("Enter Club")).toBeInTheDocument();

        // Try adding empty place
        fireEvent.change(placeInput, { target: { value: "   " } });
        fireEvent.click(addButton);

        // Remove a place
        const removeButtons = screen.getAllByRole("button", { name: "×" });
        // Let's click the first "×" button to remove "Club A"
        fireEvent.click(removeButtons[0]);
        expect(screen.queryByText("Club A")).not.toBeInTheDocument();
    });

    it("handles date picker rendering and selection", async () => {
        render(<ArtistProfileForm {...defaultProps} />);
        
        // Find career start date button
        const dateButton = screen.getByText(/2018/);
        expect(dateButton).toBeInTheDocument();
        
        // Click to open popover
        fireEvent.click(dateButton);
        
        // Select date from mock calendar
        const mockDay = screen.getByTestId("mock-calendar-day");
        fireEvent.click(mockDay);

        expect(dateButton).toHaveTextContent("15 de mayo de 2020");
    });

    it("submits full payload on submit", () => {
        render(<ArtistProfileForm {...defaultProps} />);

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                nombreArtistico: "Art Test",
                nombreUsuario: "artisttest",
                categoria: "DJ",
                biografia: "Test bio",
                ciudad: "Lima",
                pais: "PE",
                numeroTelefono: "999111222",
                tarifaPorHora: "150",
                moneda: "PEN",
                zonaHoraria: "America/Lima",
                lugaresConocidos: ["Club A", "Club B"],
                urlYoutubeFavorito: "https://youtube.com/fav",
                urlSoundCloudFavorito: "https://soundcloud.com/fav",
            })
        );
    });

    it("displays loading state and disables submit", () => {
        render(<ArtistProfileForm {...defaultProps} isLoading={true} />);
        expect(screen.getByText("Guardando cambios...")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Guardando cambios..." })).toBeDisabled();
    });

    it("parses stringified places correctly in initialization", () => {
        const propsWithStringPlaces = {
            ...defaultProps,
            userData: {
                ...defaultProps.userData,
                perfilArtista: {
                    ...defaultProps.userData.perfilArtista,
                    lugaresConocidos: JSON.stringify(["Place C", "Place D"]),
                },
            },
        };
        render(<ArtistProfileForm {...propsWithStringPlaces} />);
        expect(screen.getByText("Place C")).toBeInTheDocument();
        expect(screen.getByText("Place D")).toBeInTheDocument();
    });

    it("handles invalid JSON string in places gracefully", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const propsWithInvalidPlaces = {
            ...defaultProps,
            userData: {
                ...defaultProps.userData,
                perfilArtista: {
                    ...defaultProps.userData.perfilArtista,
                    lugaresConocidos: "{invalid json",
                },
            },
        };
        render(<ArtistProfileForm {...propsWithInvalidPlaces} />);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it("syncs state when userData prop changes dynamically and triggers callbacks", () => {
        const { rerender } = render(<ArtistProfileForm {...defaultProps} />);

        const countrySelector = screen.getByTestId("country-selector");
        fireEvent.change(countrySelector, { target: { value: "US" } });
        expect(countrySelector).toHaveValue("US");

        const timezoneSelector = screen.getByTestId("timezone-selector");
        fireEvent.change(timezoneSelector, { target: { value: "UTC" } });
        expect(timezoneSelector).toHaveValue("UTC");

        const phoneSelector = screen.getByTestId("phone-selector");
        fireEvent.change(phoneSelector, { target: { value: "+1" } });
        expect(phoneSelector).toHaveValue("+1");

        const usernameInput = screen.getByLabelText("Username");
        fireEvent.change(usernameInput, { target: { value: "newusername" } });
        expect(usernameInput).toHaveValue("newusername");

        const currencyItemUSD = screen.getByTestId("mock-radix-select-item-USD");
        fireEvent.click(currencyItemUSD);

        const newUserData = {
            nombre: "Artist Test 2",
            nombreUsuario: "artisttest2",
            correo: "artist2@test.com",
            perfilArtista: {
                nombreArtistico: "Art Test 2",
                categoria: "BANDA",
                biografia: "Test bio 2",
                ciudad: "Cusco",
                pais: "US",
                codigoTelefono: "+1",
                numeroTelefono: "999222333",
                tarifaPorHora: "200",
                moneda: "USD",
                zonaHoraria: "UTC",
                fechaInicio: "2019-06-21T00:00:00.000Z",
                lugaresConocidos: ["Club C"],
                urlYoutubeFavorito: "https://youtube.com/fav2",
                urlSoundCloudFavorito: "https://soundcloud.com/fav2",
            },
        };

        rerender(<ArtistProfileForm {...defaultProps} userData={newUserData} />);

        expect(screen.getByLabelText("Nombre Artístico")).toHaveValue("Art Test 2");
        expect(screen.getByLabelText("Ciudad")).toHaveValue("Cusco");
        expect(screen.getByLabelText("Número de celular")).toHaveValue("999222333");
    });

    it("covers country normalization fallback and empty fields case", () => {
        const customProps = {
            ...defaultProps,
            userData: {
                nombre: "Artist Test",
                nombreUsuario: "artisttest",
                correo: "artist@test.com",
                perfilArtista: {
                    pais: "Estados Unidos",
                    fechaInicio: undefined,
                    lugaresConocidos: undefined,
                },
            },
        };

        const { rerender } = render(<ArtistProfileForm {...customProps} />);
        expect(screen.getByTestId("country-selector")).toHaveValue("US");

        const unmatchedProps = {
            ...defaultProps,
            userData: {
                ...defaultProps.userData,
                perfilArtista: {
                    ...defaultProps.userData.perfilArtista,
                    pais: "Unknown Country Name",
                },
            },
        };
        rerender(<ArtistProfileForm {...unmatchedProps} />);
        expect(screen.getByTestId("country-selector")).toHaveValue("PE");
    });
});
