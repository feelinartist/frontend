import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatsMetricCards } from "../StatsMetricCards";

describe("StatsMetricCards Component", () => {
    it("renders all stats cards with the correct values", () => {
        render(
            <StatsMetricCards
                totalPedidos={150}
                totalAceptados={100}
                totalRechazados={50}
                tasaAceptacion={66.7}
            />
        );

        expect(screen.getByText("Total Pedidos")).toBeInTheDocument();
        expect(screen.getByText("150")).toBeInTheDocument();

        expect(screen.getByText("Aceptados")).toBeInTheDocument();
        expect(screen.getByText("100")).toBeInTheDocument();

        expect(screen.getByText("Rechazados")).toBeInTheDocument(); // Wait, label in StatsMetricCards is "Rechazados"
        expect(screen.getByText("50")).toBeInTheDocument();

        expect(screen.getByText("Tasa Aceptación")).toBeInTheDocument();
        expect(screen.getByText("66.7%")).toBeInTheDocument();
    });
});
