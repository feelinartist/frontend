import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SongDetailsTable } from "../song-details-table";
import { vi, describe, it, expect } from "vitest";

describe("SongDetailsTable Component", () => {
    const mockData = [
        {
            titulo: "Song 1",
            artista: "Artist 1",
            genero: "Rock",
            total: 10,
            aceptados: 6,
            rechazados: 4,
            ultimoPedido: "2026-05-27T10:00:00.000Z",
        },
        {
            titulo: "Song 2",
            artista: "Artist 2",
            genero: "",
            total: 0,
            aceptados: 0,
            rechazados: 0,
            ultimoPedido: "",
        },
    ];

    const mockProps = {
        data: mockData,
        totalPoints: 12,
        page: 1,
        totalPages: 2,
        isLoading: false,
        onPageChange: vi.fn(),
        onSearchChange: vi.fn(),
        onSortChange: vi.fn(),
        currentSort: "pedidas",
        currentSearch: "Query",
    };

    it("renders data rows and calculate percentages correctly", () => {
        render(<SongDetailsTable {...mockProps} />);

        // Search inputs
        expect(screen.getByPlaceholderText(/buscar canción o artista.../i)).toHaveValue("Query");

        // Headers
        expect(screen.getByText("Canción")).toBeInTheDocument();
        expect(screen.getByText("Artista")).toBeInTheDocument();

        // Row 1 Values
        expect(screen.getByText("Song 1")).toBeInTheDocument();
        expect(screen.getByText("Artist 1")).toBeInTheDocument();
        expect(screen.getByText("Rock")).toBeInTheDocument();
        expect(screen.getByText("10")).toBeInTheDocument(); // total
        expect(screen.getByText(/60%/)).toBeInTheDocument(); // 6 / 10 = 60%
        expect(screen.getByText(/40%/)).toBeInTheDocument(); // 4 / 10 = 40%
        // Date format: "27 May, 26" or similar
        expect(screen.getByText(/27 may/i)).toBeInTheDocument();

        // Row 2 Values (handling defaults/zeros)
        expect(screen.getByText("Song 2")).toBeInTheDocument();
        expect(screen.getByText("Artist 2")).toBeInTheDocument();
        expect(screen.getAllByText("0%")).toHaveLength(2); // acceptance/rejection percentages fallback
        expect(screen.getAllByText("-")).toHaveLength(2); // fallback for empty genre & date
    });

    it("renders skeleton rows when isLoading is true", () => {
        render(<SongDetailsTable {...mockProps} isLoading={true} />);

        // It renders 5 skeleton rows
        // Since Cell contains divs with animate-pulse, we can check for them, or check that loading indicators exist
        // Note: skeleton rows don't show the mock data
        expect(screen.queryByText("Song 1")).not.toBeInTheDocument();
        expect(screen.queryByText("Song 2")).not.toBeInTheDocument();
    });

    it("renders empty state when data is empty", () => {
        render(<SongDetailsTable {...mockProps} data={[]} />);

        expect(screen.getByText("No se encontraron canciones")).toBeInTheDocument();
        expect(screen.getByText("Mostrando 0 de 12 canciones")).toBeInTheDocument();
    });

    it("calls onSearchChange when typing in search input", () => {
        render(<SongDetailsTable {...mockProps} />);

        const input = screen.getByPlaceholderText(/buscar canción o artista.../i);
        fireEvent.change(input, { target: { value: "New Query" } });

        expect(mockProps.onSearchChange).toHaveBeenCalledWith("New Query");
    });

    it("calls onSortChange when clicking table header Sort button or select dropdown", () => {
        render(<SongDetailsTable {...mockProps} />);

        // Header Total Sort Button
        const totalSortBtn = screen.getByRole("button", { name: /total/i });
        fireEvent.click(totalSortBtn);
        expect(mockProps.onSortChange).toHaveBeenCalledWith("pedidas");

        // Click Select item from select mock
        const itemAceptadas = screen.getByTestId("mock-select-item-aceptadas");
        fireEvent.click(itemAceptadas);
        expect(mockProps.onSortChange).toHaveBeenCalledWith("aceptadas");
    });

    it("handles page changes in pagination footer", () => {
        const { rerender } = render(<SongDetailsTable {...mockProps} />);

        // Page 1 of 2: Prev is disabled, Next is enabled
        const buttons = screen.getAllByRole("button");
        // Looking at layout, buttons are:
        // Index 0: Total Header sort
        // Index 1: select trigger
        // Index 2: select items... (mocked)
        // Index Last-1: ChevronLeft button (Prev)
        // Index Last: ChevronRight button (Next)
        const prevBtn = buttons[buttons.length - 2];
        const nextBtn = buttons[buttons.length - 1];

        expect(prevBtn).toBeDisabled();
        expect(nextBtn).not.toBeDisabled();

        fireEvent.click(nextBtn);
        expect(mockProps.onPageChange).toHaveBeenCalledWith(2);

        // Re-render on page 2
        rerender(<SongDetailsTable {...mockProps} page={2} />);
        
        const newButtons = screen.getAllByRole("button");
        const newPrevBtn = newButtons[newButtons.length - 2];
        const newNextBtn = newButtons[newButtons.length - 1];

        expect(newPrevBtn).not.toBeDisabled();
        expect(newNextBtn).toBeDisabled();

        fireEvent.click(newPrevBtn);
        expect(mockProps.onPageChange).toHaveBeenLastCalledWith(1);
    });
});
