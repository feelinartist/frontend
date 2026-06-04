import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UsernameInput } from "../UsernameInput";
import { fetchApi } from "@/lib/api";

vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        fetchApi: vi.fn(),
    };
});

describe("UsernameInput Component", () => {
    const defaultProps = {
        value: "",
        onChange: vi.fn(),
        onStatusChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders label and input", () => {
        render(<UsernameInput {...defaultProps} />);
        expect(screen.getByLabelText(/Usuario/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText("usuario")).toBeInTheDocument();
    });

    it("cleans and converts input to lowercase and removes invalid characters", () => {
        render(<UsernameInput {...defaultProps} />);
        const input = screen.getByPlaceholderText("usuario") as HTMLInputElement;

        fireEvent.change(input, { target: { value: "John_Doe.123!" } });

        // '!' is invalid, should be stripped, capital J and D should be lowercase
        expect(defaultProps.onChange).toHaveBeenCalledWith("john_doe.123");
    });

    it("verifies and accepts current username immediately on blur without api call", async () => {
        render(<UsernameInput {...defaultProps} value="currentuser" currentUsername="currentuser" />);
        const input = screen.getByPlaceholderText("usuario");

        fireEvent.blur(input);

        expect(fetchApi).not.toHaveBeenCalled();
        expect(defaultProps.onStatusChange).toHaveBeenCalledWith(true);
    });

    it("shows error if value is less than 3 characters on blur", async () => {
        render(<UsernameInput {...defaultProps} value="ab" />);
        const input = screen.getByPlaceholderText("usuario");

        fireEvent.blur(input);

        expect(screen.getByText(/MÍNIMO 3 CARACTERES/i)).toBeInTheDocument();
        expect(defaultProps.onStatusChange).toHaveBeenCalledWith(false);
    });

    it("calls API and succeeds if username is available on blur", async () => {
        (fetchApi as any).mockResolvedValue({
            ok: true,
            json: async () => ({ disponible: true }),
        });

        render(<UsernameInput {...defaultProps} value="newuser" usuarioId="user-1" />);
        const input = screen.getByPlaceholderText("usuario");

        fireEvent.blur(input);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith(
                "/api/usuarios/verificar-nombre-usuario",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ nombreUsuario: "newuser", usuarioId: "user-1" }),
                })
            );
        });

        await waitFor(() => {
            expect(defaultProps.onStatusChange).toHaveBeenCalledWith(true);
        });
    });

    it("calls API and shows suggestions if username is taken", async () => {
        (fetchApi as any).mockResolvedValue({
            ok: true,
            json: async () => ({ disponible: false, sugerencias: ["sug1", "sug2"] }),
        });

        render(<UsernameInput {...defaultProps} value="takenuser" />);
        const input = screen.getByPlaceholderText("usuario");

        fireEvent.blur(input);

        await waitFor(() => {
            expect(screen.getByText(/No disponible/i)).toBeInTheDocument();
        });

        expect(screen.getByText("sug1")).toBeInTheDocument();
        expect(screen.getByText("sug2")).toBeInTheDocument();

        // Click suggestion
        fireEvent.click(screen.getByText("sug1"));
        expect(defaultProps.onChange).toHaveBeenCalledWith("sug1");
        expect(defaultProps.onStatusChange).toHaveBeenCalledWith(true);
    });

    it("handles API failure gracefully", async () => {
        (fetchApi as any).mockResolvedValue({
            ok: false,
        });

        render(<UsernameInput {...defaultProps} value="testuser" />);
        const input = screen.getByPlaceholderText("usuario");

        fireEvent.blur(input);

        await waitFor(() => {
            expect(screen.getByText(/Error al verificar/i)).toBeInTheDocument();
            expect(defaultProps.onStatusChange).toHaveBeenCalledWith(false);
        });
    });

    it("handles API exception gracefully", async () => {
        (fetchApi as any).mockRejectedValue(new Error("Network error"));

        render(<UsernameInput {...defaultProps} value="testuser" />);
        const input = screen.getByPlaceholderText("usuario");

        fireEvent.blur(input);

        await waitFor(() => {
            expect(screen.getByText(/Error de conexión/i)).toBeInTheDocument();
            expect(defaultProps.onStatusChange).toHaveBeenCalledWith(false);
        });
    });

    it("does not verify if value is empty on blur", async () => {
        render(<UsernameInput {...defaultProps} value="" />);
        const input = screen.getByPlaceholderText("usuario");

        fireEvent.blur(input);

        expect(fetchApi).not.toHaveBeenCalled();
    });

    it("handles non-array suggestions gracefully", async () => {
        (fetchApi as any).mockResolvedValue({
            ok: true,
            json: async () => ({ disponible: false, sugerencias: null }),
        });

        render(<UsernameInput {...defaultProps} value="takenuser" />);
        const input = screen.getByPlaceholderText("usuario");

        fireEvent.blur(input);

        await waitFor(() => {
            expect(screen.getByText(/No disponible/i)).toBeInTheDocument();
        });
    });
});
