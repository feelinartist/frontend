import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "../Navbar";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
    signOut: vi.fn(),
}));

// Mock next/navigation
const mockPathname = vi.fn();
vi.mock("next/navigation", () => ({
    usePathname: () => mockPathname(),
}));

// Mock @/components/SearchBar
vi.mock("@/components/SearchBar", () => ({
    SearchBar: () => <div data-testid="mock-searchbar">SearchBar</div>,
}));

// Mock @/components/ui/dropdown-menu
vi.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: any) => <div data-testid="mock-dropdown">{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <div data-testid="mock-dropdown-trigger">{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div data-testid="mock-dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, onClick }: any) => (
        <button type="button" data-testid="mock-dropdown-item" onClick={onClick}>
            {children}
        </button>
    ),
    DropdownMenuLabel: ({ children }: any) => <div data-testid="mock-dropdown-label">{children}</div>,
    DropdownMenuSeparator: () => <hr data-testid="mock-dropdown-separator" />,
}));

// Mock @/components/ui/avatar
vi.mock("@/components/ui/avatar", () => ({
    Avatar: ({ children }: any) => <div data-testid="mock-avatar">{children}</div>,
    AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt || ""} />,
    AvatarFallback: ({ children }: any) => <span>{children}</span>,
}));

describe("Navbar Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPathname.mockReturnValue("/home");
        // Mock sessionStorage
        const sessionStorageMock = (() => {
            let store: Record<string, string> = {};
            return {
                getItem: (key: string) => store[key] || null,
                setItem: (key: string, value: string) => {
                    store[key] = value.toString();
                },
                removeItem: (key: string) => {
                    delete store[key];
                },
                clear: () => {
                    store = {};
                },
            };
        })();
        Object.defineProperty(window, "sessionStorage", {
            value: sessionStorageMock,
            writable: true,
            configurable: true,
        });
    });

    it("renders sign in button when user is not logged in", () => {
        (useSession as any).mockReturnValue({
            data: null,
            status: "unauthenticated",
        });

        render(<Navbar />);

        expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
        expect(screen.queryByTestId("mock-searchbar")).not.toBeInTheDocument();
        expect(screen.queryByTestId("mock-avatar")).not.toBeInTheDocument();
    });

    it("renders user information and navigation items for general logged in users", () => {
        (useSession as any).mockReturnValue({
            data: {
                user: {
                    name: "John Public",
                    email: "john@example.com",
                    rol: "PUBLICO",
                    image: "https://example.com/avatar.jpg",
                },
            },
            status: "authenticated",
        });

        render(<Navbar />);

        expect(screen.queryByRole("button", { name: /iniciar sesión/i })).not.toBeInTheDocument();
        expect(screen.getByTestId("mock-avatar")).toBeInTheDocument();
        expect(screen.getByText("PUBLICO")).toBeInTheDocument();

        // Check dropdown items contents (rendered directly in our mock)
        expect(screen.getByText("John Public")).toBeInTheDocument();
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
        expect(screen.getByText("Inicio")).toBeInTheDocument();
        expect(screen.getByText("Perfil")).toBeInTheDocument();
        expect(screen.getByText("Configuración")).toBeInTheDocument();
        expect(screen.queryByText("Eventos")).not.toBeInTheDocument();
        expect(screen.queryByText("Estadísticas")).not.toBeInTheDocument();
        expect(screen.queryByText("Panel Admin")).not.toBeInTheDocument();
    });

    it("renders Eventos and Estadísticas links for an ARTISTA", () => {
        (useSession as any).mockReturnValue({
            data: {
                user: {
                    name: "Jane Artist",
                    email: "jane@example.com",
                    rol: "ARTISTA",
                },
            },
            status: "authenticated",
        });

        render(<Navbar />);

        expect(screen.getByText("ARTISTA")).toBeInTheDocument();
        expect(screen.getByText("Eventos")).toBeInTheDocument();
        expect(screen.getByText("Estadísticas")).toBeInTheDocument();
        expect(screen.queryByText("Panel Admin")).not.toBeInTheDocument();
    });

    it("renders Panel Admin link for ADMIN and SUPER_ADMIN", () => {
        (useSession as any).mockReturnValue({
            data: {
                user: {
                    name: "Admin User",
                    email: "admin@example.com",
                    rol: "SUPER_ADMIN",
                },
            },
            status: "authenticated",
        });

        render(<Navbar />);

        expect(screen.getByText("SUPER ADMIN")).toBeInTheDocument();
        expect(screen.getByText("Eventos")).toBeInTheDocument();
        expect(screen.getByText("Estadísticas")).toBeInTheDocument();
        expect(screen.getByText("Panel Admin")).toBeInTheDocument();
    });

    it("applies restricted layout rules on registration pages", () => {
        (useSession as any).mockReturnValue({
            data: { user: { name: "User" } },
        });
        mockPathname.mockReturnValue("/artist-registration");

        render(<Navbar />);

        // Restricted flows don't show search bar or link hover states on the brand
        expect(screen.queryByTestId("mock-searchbar")).not.toBeInTheDocument();
        // Brand is rendered as non-interactive div instead of Link (tested by checking for Link element role/href)
        expect(screen.queryByRole("link", { name: /feelin/i })).not.toBeInTheDocument();
        expect(screen.getByText("Feelin")).toBeInTheDocument();
    });

    it("toggles mobile search overlay", () => {
        (useSession as any).mockReturnValue({
            data: { user: { name: "User", rol: "PUBLICO" } },
        });
        mockPathname.mockReturnValue("/home");

        render(<Navbar />);

        // Verify mobile search button click toggles overlay
        const searchBtns = screen.getAllByRole("button");
        const searchToggleBtn = searchBtns.find((btn) => btn.querySelector(".h-5.w-5"));
        
        expect(screen.queryByTestId("mock-searchbar")).toBeInTheDocument();
        
        fireEvent.click(searchToggleBtn!);
        expect(screen.getAllByTestId("mock-searchbar")).toHaveLength(2);

        fireEvent.click(searchToggleBtn!);
        expect(screen.getAllByTestId("mock-searchbar")).toHaveLength(1);
    });

    it("toggles mobile menu drawer overlay", () => {
        (useSession as any).mockReturnValue({
            data: { user: { name: "User", rol: "ARTISTA" } },
        });
        mockPathname.mockReturnValue("/home");

        render(<Navbar />);

        const mobileMenuTrigger = screen.getAllByRole("button").find(btn => btn.querySelector(".h-6.w-6"));
        expect(mobileMenuTrigger).toBeDefined();

        expect(screen.queryByText("Menu")).not.toBeInTheDocument();

        fireEvent.click(mobileMenuTrigger!);
        expect(screen.getByText("Menu")).toBeInTheDocument();

        expect(screen.getAllByText("Inicio")).toHaveLength(2);
        expect(screen.getAllByText("Eventos")).toHaveLength(2);
        expect(screen.getAllByText("Estadísticas")).toHaveLength(2);

        const closeBtn = screen.getAllByRole("button").find(btn => btn.querySelector(".h-6.w-6") && btn.closest("div")?.querySelector("span")?.textContent === "Menu");
        fireEvent.click(closeBtn!);
        expect(screen.queryByText("Menu")).not.toBeInTheDocument();
    });

    it("handles sign out and clears sessionStorage", () => {
        (useSession as any).mockReturnValue({
            data: { user: { name: "John", rol: "PUBLICO" } },
        });

        render(<Navbar />);

        const sessionStorageSpy = vi.spyOn(sessionStorage, "removeItem");

        // Click Cerrar Sesión button from dropdown
        const signOutButtons = screen.getAllByRole("button", { name: /cerrar sesión/i });
        fireEvent.click(signOutButtons[0]);

        expect(sessionStorageSpy).toHaveBeenCalledWith("eventRedirectChecked");
        expect(signOut).toHaveBeenCalled();
    });

    it("handles sign out from mobile menu drawer", () => {
        (useSession as any).mockReturnValue({
            data: { user: { name: "John", rol: "PUBLICO" } },
        });

        render(<Navbar />);

        // Open mobile drawer
        const mobileMenuTrigger = screen.getAllByRole("button").find(btn => btn.querySelector(".h-6.w-6"));
        fireEvent.click(mobileMenuTrigger!);

        const sessionStorageSpy = vi.spyOn(sessionStorage, "removeItem");

        // Click Cerrar Sesión in drawer (index 1 of all cerrar sesión buttons)
        const signOutButtons = screen.getAllByRole("button", { name: /cerrar sesión/i });
        fireEvent.click(signOutButtons[1]);

        expect(sessionStorageSpy).toHaveBeenCalledWith("eventRedirectChecked");
        expect(signOut).toHaveBeenCalled();
    });

    it("closes mobile menu drawer when links are clicked", () => {
        (useSession as any).mockReturnValue({
            data: { user: { name: "Admin", rol: "SUPER_ADMIN" } },
        });
        mockPathname.mockReturnValue("/home");

        render(<Navbar />);

        const linksToTest = ["Inicio", "Eventos", "Estadísticas", "Perfil", "Configuración", "Panel Admin"];

        for (const linkText of linksToTest) {
            // Open menu
            const mobileMenuTrigger = screen.getAllByRole("button").find(btn => btn.querySelector(".h-6.w-6"));
            fireEvent.click(mobileMenuTrigger!);
            expect(screen.getByText("Menu")).toBeInTheDocument();

            // Find mobile link (which has class "text-xl")
            const elements = screen.getAllByText(linkText);
            const mobileLink = elements.find(el => el.className.includes("text-xl")) || elements[0];
            fireEvent.click(mobileLink);

            // Verify menu closes
            expect(screen.queryByText("Menu")).not.toBeInTheDocument();
        }
    });
});
