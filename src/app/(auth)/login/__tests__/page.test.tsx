import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoginPage from "../page";
import { signIn } from "next-auth/react";

// Mock next-auth
vi.mock("next-auth/react", () => ({
    signIn: vi.fn(),
}));

describe("LoginPage Component", () => {
    it("renders LoginPage elements", () => {
        render(<LoginPage />);
        expect(screen.getByText("Siente la música en vivo")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Continuar con Google/i })).toBeInTheDocument();
    });

    it("triggers signIn with google when Google button is clicked", () => {
        render(<LoginPage />);
        const googleButton = screen.getByRole("button", { name: /Continuar con Google/i });

        fireEvent.click(googleButton);

        expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/home" });
        // The component triggers loading state after click
        expect(screen.getByText("Cargando...")).toBeInTheDocument();
    });
});
