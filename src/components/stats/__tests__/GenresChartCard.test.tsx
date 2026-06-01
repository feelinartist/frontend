import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GenresChartCard } from "../GenresChartCard";

// Mock Recharts
vi.mock("recharts", () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
    Cell: () => <div data-testid="cell" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
}));

describe("GenresChartCard Component", () => {
    it("renders the empty state when no genres data is provided", () => {
        render(<GenresChartCard generosPorConteo={[]} />);
        expect(screen.getByText("No hay datos de géneros disponibles")).toBeInTheDocument();
    });

    it("renders the pie chart when genres data is provided", () => {
        const mockData = [
            { genero: "Rock", conteo: 10, porcentaje: 50 },
            { genero: "Pop", conteo: 10, porcentaje: 50 },
        ];

        render(<GenresChartCard generosPorConteo={mockData} />);

        expect(screen.getByText("Géneros Más Pedidos")).toBeInTheDocument();
        expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });
});
