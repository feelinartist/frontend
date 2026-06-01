import React from "react";
import { render, screen } from "@testing-library/react";
import { ArtistCard } from "../ArtistCard";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock next/link to just render anchor tag
vi.mock("next/link", () => ({
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock @/components/ui/avatar
vi.mock("@/components/ui/avatar", () => ({
    Avatar: ({ children }: any) => <div data-testid="mock-avatar">{children}</div>,
    AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt || ""} />,
    AvatarFallback: ({ children }: any) => <span>{children}</span>,
}));

describe("ArtistCard Component", () => {
    const baseArtist = {
        id: "artist-1",
        nombre: "John Doe",
        nombreUsuario: "johndoe",
        imagen: "https://example.com/john.jpg",
        perfilArtista: {
            nombreArtistico: "DJ John",
            categoria: "Electrónica",
            pais: "CO",
            ciudad: "Bogotá",
            fechaInicio: "2020-06-01",
            lugaresConocidos: ["Club A", "Club B"],
            codigoTelefono: "+57",
            numeroTelefono: "3001234567",
            tarifaPorHora: 150,
            moneda: "USD",
        },
    };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-05-27T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders basic artist information and experiences", () => {
        render(<ArtistCard artista={baseArtist} />);

        expect(screen.getByText("DJ John")).toBeInTheDocument();
        expect(screen.getByText("@johndoe")).toBeInTheDocument();
        expect(screen.getByText("Electrónica")).toBeInTheDocument();
        expect(screen.getByText("Bogotá, Colombia")).toBeInTheDocument();
        
        // Experience calculation: 2026 (mocked current time) - 2020 = 6 years
        expect(screen.getByText("6 años")).toBeInTheDocument();

        // Places
        expect(screen.getByText("Club A, Club B")).toBeInTheDocument();

        // Rate
        expect(screen.getByText(/150 USD\/hr/)).toBeInTheDocument();

        // Contact
        expect(screen.getByText("+57 3001234567")).toBeInTheDocument();
    });

    it("uses legal name if artistic name is missing", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                nombreArtistico: null,
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders experience as less than 1 year if start date is current year", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                fechaInicio: "2026-06-01",
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.getByText("Menos de 1 año")).toBeInTheDocument();
    });

    it("renders experience as 1 year if difference is exactly 1", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                fechaInicio: "2025-06-01",
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.getByText("1 año")).toBeInTheDocument();
    });

    it("handles missing start date or experience metadata", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                fechaInicio: null,
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.queryByText(/Experiencia/)).not.toBeInTheDocument();
    });

    it("handles unknown country codes", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                pais: "XX", // Non-existent code
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.getByText("Bogotá, XX")).toBeInTheDocument();
    });

    it("handles missing country code", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                pais: null,
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.getByText("Bogotá")).toBeInTheDocument();
    });

    it("formats places list with '+X more' when there are more than 2 venues", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                lugaresConocidos: ["Club A", "Club B", "Club C", "Club D"],
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.getByText("Club A, Club B y 2 más")).toBeInTheDocument();
    });

    it("handles places stored as a raw string", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                lugaresConocidos: "Varios clubes locales" as any,
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.getByText("Varios clubes locales")).toBeInTheDocument();
    });

    it("handles missing places or unknown formats", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                lugaresConocidos: 123 as any,
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.queryByText(/Ha tocado en/)).not.toBeInTheDocument();
    });

    it("handles phone code prefix being missing", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                codigoTelefono: null,
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.getByText("3001234567")).toBeInTheDocument();
    });

    it("handles missing phone number contact details", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                numeroTelefono: null,
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.queryByText(/Contacto/)).not.toBeInTheDocument();
    });

    it("handles default currency value if currency is missing", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                moneda: null,
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.getByText(/150 PEN\/hr/)).toBeInTheDocument();
    });

    it("handles zero or empty booking rate value", () => {
        const artist = {
            ...baseArtist,
            perfilArtista: {
                ...baseArtist.perfilArtista,
                tarifaPorHora: 0,
            },
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.queryByText(/Desde/)).not.toBeInTheDocument();
    });

    it("renders avatar fallback when image is missing", () => {
        const artist = {
            ...baseArtist,
            imagen: null,
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("renders fallback character A when name is missing and image is missing", () => {
        const artist = {
            ...baseArtist,
            nombre: "",
            imagen: null,
        };
        render(<ArtistCard artista={artist} />);
        expect(screen.getByText("A")).toBeInTheDocument();
    });
});
