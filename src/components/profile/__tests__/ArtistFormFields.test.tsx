import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ArtistFormFields } from "../ArtistFormFields";

vi.mock("@/components/profile/ProfileContactSection", () => ({
    ProfileContactSection: ({ onCountryChange, onCityChange, onPhoneCodeChange, onPhoneNumberChange, onTimezoneChange }: any) => (
        <div data-testid="profile-contact-section">
            <button onClick={() => onCountryChange("PE")}>Country</button>
            <button onClick={() => onCityChange("Lima")}>City</button>
            <button onClick={() => onPhoneCodeChange("+51")}>Phone Code</button>
            <button onClick={() => onPhoneNumberChange("123456789")}>Phone Number</button>
            <button onClick={() => onTimezoneChange("America/Lima")}>Timezone</button>
        </div>
    )
}));

vi.mock("@/components/profile/ProfileFormHeader", () => ({
    ProfileFormHeader: ({ onDateOpenChange, onDateSelect, onNameChange, onUsernameChange, onStatusChange }: any) => (
        <div data-testid="profile-form-header">
            <button onClick={() => onDateOpenChange(true)}>Date Open</button>
            <button onClick={() => onDateSelect(new Date())}>Date Select</button>
            <button onClick={() => onNameChange("New Name")}>Name Change</button>
            <button onClick={() => onUsernameChange("newusername")}>Username Change</button>
            <button onClick={() => onStatusChange(true)}>Status Change</button>
        </div>
    )
}));

vi.mock("@/components/profile/PlacesEditor", () => ({
    PlacesEditor: ({ onChange }: any) => (
        <div data-testid="places-editor">
            <button onClick={() => onChange(["Place 1"])}>Places Change</button>
        </div>
    )
}));

describe("ArtistFormFields Component", () => {
    const defaultProps = {
        email: "test@example.com",
        formData: {
            nombreArtistico: "",
            nombreUsuario: "",
            categoria: "",
            biografia: "",
            ciudad: "",
            pais: "",
            codigoTelefono: "",
            numeroTelefono: "",
            tarifaPorHora: "",
            moneda: "PEN",
            zonaHoraria: "",
            urlYoutubeFavorito: "",
            urlSoundCloudFavorito: "",
        },
        dateLabel: "Date Label",
        date: undefined,
        dateOpen: false,
        datePlaceholder: "Select Date",
        onDateOpenChange: vi.fn(),
        onDateSelect: vi.fn(),
        onNameChange: vi.fn(),
        onUsernameChange: vi.fn(),
        onStatusChange: vi.fn(),
        onCategoryChange: vi.fn(),
        onCurrencyChange: vi.fn(),
        onFieldChange: vi.fn(),
        places: [],
        onPlacesChange: vi.fn(),
    };

    it("renders and delegates callbacks properly", () => {
        render(<ArtistFormFields {...defaultProps} />);

        // Interaction with mocked sub-components
        fireEvent.click(screen.getByText("Country"));
        expect(defaultProps.onFieldChange).toHaveBeenCalledWith("pais", "PE");

        fireEvent.click(screen.getByText("City"));
        expect(defaultProps.onFieldChange).toHaveBeenCalledWith("ciudad", "Lima");

        fireEvent.click(screen.getByText("Phone Code"));
        expect(defaultProps.onFieldChange).toHaveBeenCalledWith("codigoTelefono", "+51");

        fireEvent.click(screen.getByText("Phone Number"));
        expect(defaultProps.onFieldChange).toHaveBeenCalledWith("numeroTelefono", "123456789");

        fireEvent.click(screen.getByText("Timezone"));
        expect(defaultProps.onFieldChange).toHaveBeenCalledWith("zonaHoraria", "America/Lima");

        fireEvent.click(screen.getByText("Date Open"));
        expect(defaultProps.onDateOpenChange).toHaveBeenCalledWith(true);

        fireEvent.click(screen.getByText("Date Select"));
        expect(defaultProps.onDateSelect).toHaveBeenCalled();

        fireEvent.click(screen.getByText("Name Change"));
        expect(defaultProps.onNameChange).toHaveBeenCalledWith("New Name");

        fireEvent.click(screen.getByText("Username Change"));
        expect(defaultProps.onUsernameChange).toHaveBeenCalledWith("newusername");

        fireEvent.click(screen.getByText("Status Change"));
        expect(defaultProps.onStatusChange).toHaveBeenCalledWith(true);

        fireEvent.click(screen.getByText("Places Change"));
        expect(defaultProps.onPlacesChange).toHaveBeenCalledWith(["Place 1"]);

        // Tarifa por Hora
        const tarifaInput = screen.getByPlaceholderText("0.00");
        fireEvent.change(tarifaInput, { target: { value: "150" } });
        expect(defaultProps.onFieldChange).toHaveBeenCalledWith("tarifaPorHora", "150");

        // Biografia
        const biografiaInput = screen.getByPlaceholderText("Cuéntanos un poco sobre ti...");
        fireEvent.change(biografiaInput, { target: { value: "Hello" } });
        expect(defaultProps.onFieldChange).toHaveBeenCalledWith("biografia", "Hello");

        // URL YouTube
        const youtubeInput = screen.getByPlaceholderText("https://www.youtube.com/watch?v=...");
        fireEvent.change(youtubeInput, { target: { value: "yturl" } });
        expect(defaultProps.onFieldChange).toHaveBeenCalledWith("urlYoutubeFavorito", "yturl");

        // URL SoundCloud
        const soundcloudInput = screen.getByPlaceholderText("https://soundcloud.com/...");
        fireEvent.change(soundcloudInput, { target: { value: "scurl" } });
        expect(defaultProps.onFieldChange).toHaveBeenCalledWith("urlSoundCloudFavorito", "scurl");
    });
});
