import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VenueProfileForm } from "../VenueProfileForm";

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

// Mock CountryPhoneSelector
vi.mock("@/components/ui/country-phone-selector", () => ({
    CountryPhoneSelector: ({ value, onValueChange }: any) => (
        <select data-testid="phone-selector" value={value} onChange={(e) => onValueChange(e.target.value)}>
            <option value="+51">+51</option>
            <option value="+1">+1</option>
        </select>
    ),
}));

// Mock TimezoneSelect
vi.mock("@/components/ui/timezone-select", () => ({
    TimezoneSelect: ({ value, onValueChange }: any) => (
        <select data-testid="timezone-selector" value={value} onChange={(e) => onValueChange(e.target.value)}>
            <option value="America/Lima">America/Lima</option>
            <option value="UTC">UTC</option>
        </select>
    ),
}));

// Mock CountrySelect
vi.mock("@/components/ui/country-select", () => ({
    CountrySelect: ({ value, onValueChange }: any) => (
        <select data-testid="country-selector" value={value} onChange={(e) => onValueChange(e.target.value)}>
            <option value="PE">Peru</option>
            <option value="US">USA</option>
        </select>
    ),
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

describe("VenueProfileForm Component", () => {
    const mockCountries = [
        { name: "Perú", code: "PE", phoneCode: "+51" },
        { name: "Estados Unidos", code: "US", phoneCode: "+1" },
    ];
    const mockTimezones = ["America/Lima", "UTC"];

    const defaultProps = {
        userData: {
            nombre: "Discoteca Test",
            nombreUsuario: "discotecatest",
            correo: "test@venue.com",
            perfilDiscoteca: {
                ciudad: "Lima",
                pais: "PE",
                codigoTelefono: "+51",
                numeroTelefono: "999888777",
                zonaHoraria: "America/Lima",
                fechaFundacion: "2020-01-01T00:00:00.000Z",
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

    it("renders form fields initialized with user data", () => {
        render(<VenueProfileForm {...defaultProps} />);

        expect(screen.getByLabelText("Nombre de la Discoteca")).toHaveValue("Discoteca Test");
        expect(screen.getByLabelText("Correo Electrónico")).toHaveValue("test@venue.com");
        expect(screen.getByLabelText("Ciudad")).toHaveValue("Lima");
        expect(screen.getByLabelText("Número de celular")).toHaveValue("999888777");
    });

    it("handles inputs change including phone numbers and timezones", () => {
        render(<VenueProfileForm {...defaultProps} />);

        const nameInput = screen.getByLabelText("Nombre de la Discoteca");
        fireEvent.change(nameInput, { target: { name: "nombre", value: "New Venue Name" } });
        expect(nameInput).toHaveValue("New Venue Name");

        const phoneInput = screen.getByLabelText("Número de celular");
        fireEvent.change(phoneInput, { target: { name: "numeroTelefono", value: "123a456" } });
        // non-digits should be removed
        expect(phoneInput).toHaveValue("123456");

        const timezoneSelect = screen.getByTestId("timezone-selector");
        fireEvent.change(timezoneSelect, { target: { value: "UTC" } });
        expect(timezoneSelect).toHaveValue("UTC");
    });

    it("handles date picking popover interaction", () => {
        render(<VenueProfileForm {...defaultProps} />);
        
        const dateButton = screen.getByText(/2019|2020/);
        expect(dateButton).toBeInTheDocument();
        
        fireEvent.click(dateButton);
        
        const mockDay = screen.getByTestId("mock-calendar-day");
        fireEvent.click(mockDay);

        expect(dateButton).toHaveTextContent("15 de mayo de 2020");
    });

    it("submits form data on submit", async () => {
        render(<VenueProfileForm {...defaultProps} />);

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                nombre: "Discoteca Test",
                nombreUsuario: "discotecatest",
                ciudad: "Lima",
                pais: "PE",
                numeroTelefono: "999888777",
                zonaHoraria: "America/Lima",
            })
        );
    });

    it("syncs state when userData prop changes dynamically", () => {
        const { rerender } = render(<VenueProfileForm {...defaultProps} />);

        const newUserData = {
            nombre: "Updated Venue name",
            nombreUsuario: "updatedusername",
            correo: "test@venue.com",
            perfilDiscoteca: {
                ciudad: "Cusco",
                pais: "PE",
                codigoTelefono: "+51",
                numeroTelefono: "999555444",
                zonaHoraria: "UTC",
                fechaFundacion: "2015-05-15T00:00:00.000Z",
            },
        };

        rerender(<VenueProfileForm {...defaultProps} userData={newUserData} />);

        expect(screen.getByLabelText("Nombre de la Discoteca")).toHaveValue("Updated Venue name");
        expect(screen.getByLabelText("Ciudad")).toHaveValue("Cusco");
        expect(screen.getByLabelText("Número de celular")).toHaveValue("999555444");
    });

    it("covers fallback normalization and selector callbacks", () => {
        const customProps = {
            ...defaultProps,
            userData: {
                nombre: "Discoteca Test",
                nombreUsuario: "discotecatest",
                correo: "test@venue.com",
                perfilDiscoteca: {
                    ciudad: "Lima",
                    pais: "Estados Unidos",
                    codigoTelefono: "+51",
                    numeroTelefono: "999888777",
                    zonaHoraria: "America/Lima",
                    fechaFundacion: undefined,
                },
            },
        };
        const { rerender } = render(<VenueProfileForm {...customProps} />);

        const countrySelector = screen.getByTestId("country-selector");
        expect(countrySelector).toHaveValue("US");

        fireEvent.change(countrySelector, { target: { value: "PE" } });
        expect(countrySelector).toHaveValue("PE");

        const phoneSelector = screen.getByTestId("phone-selector");
        fireEvent.change(phoneSelector, { target: { value: "+1" } });
        expect(phoneSelector).toHaveValue("+1");

        const usernameInput = screen.getByLabelText("Username");
        fireEvent.change(usernameInput, { target: { value: "newusername" } });
        expect(usernameInput).toHaveValue("newusername");

        const unmatchedProps = {
            ...defaultProps,
            userData: {
                ...defaultProps.userData,
                perfilDiscoteca: {
                    ...defaultProps.userData.perfilDiscoteca,
                    pais: "Unknown Country",
                },
            },
        };
        rerender(<VenueProfileForm {...unmatchedProps} />);
        expect(screen.getByTestId("country-selector")).toHaveValue("PE");
    });
});
