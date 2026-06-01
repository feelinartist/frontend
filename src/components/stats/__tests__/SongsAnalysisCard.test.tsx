import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SongsAnalysisCard } from "../SongsAnalysisCard";

describe("SongsAnalysisCard Component", () => {
    const mockSongs = [
        { titulo: "Song A", artista: "Artist X", total: 10, aceptados: 8, rechazados: 2 },
        { titulo: "Song B", artista: "Artist Y", total: 5 },
    ];
    const mockAceptadas = [
        { titulo: "Song A", artista: "Artist X", total: 8 },
    ];
    const mockRechazadas = [
        { titulo: "Song B", artista: "Artist Y", total: 2 },
    ];

    const defaultProps = {
        topCanciones: mockSongs,
        topAceptadas: mockAceptadas,
        topRechazadas: mockRechazadas,
        onViewReport: vi.fn(),
    };

    it("renders the tabs and default active content", () => {
        render(<SongsAnalysisCard {...defaultProps} />);

        expect(screen.getByText("Análisis de Canciones")).toBeInTheDocument();
        expect(screen.getByText("🎵 Más Pedidas")).toBeInTheDocument();
        expect(screen.getByText("Song A")).toBeInTheDocument();
        expect(screen.getByText("Artist X")).toBeInTheDocument();
    });

    it("calls onViewReport callback when clicking report button", () => {
        render(<SongsAnalysisCard {...defaultProps} />);

        const reportButton = screen.getByText("Ver reporte completo →");
        fireEvent.click(reportButton);

        expect(defaultProps.onViewReport).toHaveBeenCalled();
    });

    it("renders empty states if no data provided", () => {
        render(
            <SongsAnalysisCard
                topCanciones={[]}
                topAceptadas={[]}
                topRechazadas={[]}
                onViewReport={vi.fn()}
            />
        );

        expect(screen.getByText("No hay datos disponibles")).toBeInTheDocument();
    });
});
