import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "../SearchBar";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

describe("SearchBar Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset location pathname mock
        Object.defineProperty(window, "location", {
            value: {
                pathname: "/home",
            },
            writable: true,
            configurable: true,
        });
    });

    it("renders search input and country select trigger", () => {
        render(<SearchBar />);

        expect(screen.getByPlaceholderText(/buscar artistas, usuarios.../i)).toBeInTheDocument();
        expect(screen.getByTestId("mock-select-trigger")).toBeInTheDocument();
    });

    it("triggers search on query input submit and pushes to path /home", () => {
        render(<SearchBar />);

        const input = screen.getByPlaceholderText(/buscar artistas, usuarios.../i);
        fireEvent.change(input, { target: { value: "DJ Rock" } });

        // Submit form
        const form = input.closest("form");
        fireEvent.submit(form!);

        expect(mockPush).toHaveBeenCalledWith("/home?termino=DJ+Rock");
    });

    it("pushes to current path if already on /search", () => {
        globalThis.location.pathname = "/search";

        render(<SearchBar />);

        const input = screen.getByPlaceholderText(/buscar artistas, usuarios.../i);
        fireEvent.change(input, { target: { value: "Jazz" } });

        const form = input.closest("form");
        fireEvent.submit(form!);

        expect(mockPush).toHaveBeenCalledWith("/search?termino=Jazz");
    });

    it("redirects to /home if path is not /search or /home", () => {
        globalThis.location.pathname = "/dashboard/profile";

        render(<SearchBar />);

        const input = screen.getByPlaceholderText(/buscar artistas, usuarios.../i);
        fireEvent.change(input, { target: { value: "Techno" } });

        const form = input.closest("form");
        fireEvent.submit(form!);

        expect(mockPush).toHaveBeenCalledWith("/home?termino=Techno");
    });

    it("includes selected country in query parameters when onCountryChange is called", () => {
        render(<SearchBar />);

        // In our vitest.setup.ts, select options are mocked.
        // The trigger is a button, but let's select an item.
        // Let's use the mocked SelectItem with test id: mock-select-item-{value}
        // Let's select 'CO' (Colombia)
        // Wait, does the select item render on screen immediately?
        // Since Select is mocked in setup.ts as:
        // Select: ({ children }) => <div data-testid="mock-select">{children}</div>
        // And SelectItem is: onClick: () => onValueChange(value)
        // We can search for the Item and click it. Let's find it.
        const itemCO = screen.getByTestId("mock-select-item-CO");
        fireEvent.click(itemCO);

        // This triggers onCountryChange, which calls handleSearch(undefined, 'CO')
        expect(mockPush).toHaveBeenCalledWith("/home?pais=CO");
    });

    it("ignores country param if set to 'all'", () => {
        render(<SearchBar />);

        const itemAll = screen.getByTestId("mock-select-item-all");
        fireEvent.click(itemAll);

        expect(mockPush).toHaveBeenCalledWith("/home?");
    });

    it("combines query term and country in push params", () => {
        render(<SearchBar />);

        const input = screen.getByPlaceholderText(/buscar artistas, usuarios.../i);
        fireEvent.change(input, { target: { value: "DJ" } });

        const itemCO = screen.getByTestId("mock-select-item-CO");
        fireEvent.click(itemCO);

        expect(mockPush).toHaveBeenCalledWith("/home?termino=DJ&pais=CO");
    });
});
