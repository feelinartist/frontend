import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DonationForm } from "../DonationForm";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

// Polyfill randomUUID
if (typeof crypto === "undefined" || !crypto.randomUUID) {
    Object.defineProperty(global, "crypto", {
        value: {
            randomUUID: () => "test-uuid-1234",
        },
        writable: true,
    });
}

vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        fetchApi: vi.fn(),
    };
});

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
}));

describe("DonationForm Component", () => {
    const mockMetodos = [
        { id: "1", nombre: "Yape" },
        { id: "2", nombre: "Plin" },
    ];

    const defaultProps = {
        metodosDonacion: [],
        perfilArtista: { urlPago: "", pagoQR: "", nombreQR: "" },
        usuarioId: "user-123",
        onSave: vi.fn(),
        onLoadingChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (fetchApi as any).mockResolvedValue({
            ok: true,
            json: async () => mockMetodos,
        });
    });

    it("renders form elements and loads methods on mount", async () => {
        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith("/api/config/metodos-donacion");
        });
        expect(screen.getByText("Información Adicional")).toBeInTheDocument();
    });

    it("renders with initial values and allows inputs", async () => {
        const metodosArtista = [
            { metodoDonacion: { id: "1", nombre: "Yape" }, metodoDonacionId: "1", numeroCuenta: "987654321" }
        ];
        render(
            <DonationForm
                {...defaultProps}
                metodosDonacion={metodosArtista}
                perfilArtista={{ urlPago: "https://paypal.me/test", pagoQR: "https://example.com/qr.png", nombreQR: "Yape" }}
            />
        );

        await waitFor(() => {
            expect(screen.getByDisplayValue("987654321")).toBeInTheDocument();
        });

        expect(screen.getByDisplayValue("https://paypal.me/test")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Yape")).toBeInTheDocument();
        expect(screen.getByAltText("QR Code")).toBeInTheDocument();

        // Remove QR
        const removeQRButton = screen.getByRole("button", { name: "Eliminar QR" });
        fireEvent.click(removeQRButton);
        expect(toast.success).toHaveBeenCalledWith("QR eliminado");
    });

    it("allows adding and removing donation methods", async () => {
        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText("Agregar Método")).toBeInTheDocument();
        });

        const addButton = screen.getByText("Agregar Método");
        fireEvent.click(addButton);

        expect(screen.getByText("Método")).toBeInTheDocument();
        expect(screen.getByText("Número de Cuenta")).toBeInTheDocument();

        const removeButton = screen.getByRole("button", { name: "Eliminar método" });
        fireEvent.click(removeButton);

        expect(screen.queryByText("Método")).not.toBeInTheDocument();
    });

    it("rejects files that exceed max QR size", async () => {
        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
        });

        const file = new File(["a".repeat(3 * 1024 * 1024)], "large_qr.png", { type: "image/png" });
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(toast.error).toHaveBeenCalledWith("El QR no puede exceder 2MB de tamaño");
    });

    it("handles FileReader base64 conversion and processes the QR", async () => {
        render(<DonationForm {...defaultProps} />);
        const file = new File(["test-qr"], "qr.png", { type: "image/png" });

        const readSpy = vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function(this: FileReader) {
            setTimeout(() => {
                Object.defineProperty(this, "result", { value: "data:image/png;base64,mock-qr-data", configurable: true });
                if (this.onload) {
                    this.onload({} as ProgressEvent);
                }
            }, 0);
        });

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("QR cargado. Haz click en 'Guardar Cambios' para subirlo.");
        });

        readSpy.mockRestore();
    });

    it("handles FileReader error gracefully", async () => {
        render(<DonationForm {...defaultProps} />);
        const file = new File(["test-qr"], "qr.png", { type: "image/png" });

        const readSpy = vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function(this: FileReader) {
            setTimeout(() => {
                if (this.onerror) {
                    this.onerror({} as ProgressEvent);
                }
            }, 0);
        });

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al procesar el QR");
        });

        readSpy.mockRestore();
    });


    it("validates that QR Name and Image must exist together", async () => {
        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
        });

        // 1. QR Name but no QR Image
        const qrNameInput = screen.getByPlaceholderText("Ej: Yape, Plin, PayPal");
        fireEvent.change(qrNameInput, { target: { value: "Yape" } });

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        expect(toast.error).toHaveBeenCalledWith("Debes subir una imagen para el QR si ingresas un nombre");

        // Reset name
        fireEvent.change(qrNameInput, { target: { value: "" } });
    });

    it("validates that donation methods must have an account number", async () => {
        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText("Agregar Método")).toBeInTheDocument();
        });

        const addButton = screen.getByText("Agregar Método");
        fireEvent.click(addButton);

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        expect(toast.error).toHaveBeenCalledWith("Todos los métodos de donación deben tener un número de cuenta");
    });

    it("uploads QR first if it is new base64, then saves successfully", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/config/metodos-donacion") {
                return Promise.resolve({ ok: true, json: async () => mockMetodos });
            }
            if (url === "/api/imagenes/qr-pago") {
                return Promise.resolve({ ok: true, json: async () => ({ url: "https://s3.com/uploaded.png" }) });
            }
            if (url === "/api/usuarios/perfil") {
                return Promise.resolve({ ok: true });
            }
            return Promise.resolve({ ok: false });
        });

        render(
            <DonationForm
                {...defaultProps}
                perfilArtista={{ urlPago: "", pagoQR: "data:image/png;base64,mock-qr-data", nombreQR: "Yape" }}
            />
        );

        await waitFor(() => {
            expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
        });

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith(
                "/api/imagenes/qr-pago",
                expect.objectContaining({ method: "POST" })
            );
            expect(fetchApi).toHaveBeenCalledWith(
                "/api/usuarios/perfil",
                expect.objectContaining({
                    method: "PATCH",
                    body: expect.stringContaining('"pagoQR":"https://s3.com/uploaded.png"')
                })
            );
        });

        expect(toast.success).toHaveBeenCalledWith("Métodos de donación actualizados correctamente");
    });

    it("handles QR upload API failure gracefully", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/config/metodos-donacion") {
                return Promise.resolve({ ok: true, json: async () => mockMetodos });
            }
            if (url === "/api/imagenes/qr-pago") {
                return Promise.resolve({ ok: false });
            }
            return Promise.resolve({ ok: false });
        });

        render(
            <DonationForm
                {...defaultProps}
                perfilArtista={{ urlPago: "", pagoQR: "data:image/png;base64,mock-qr-data", nombreQR: "Yape" }}
            />
        );

        await waitFor(() => {
            expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
        });

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al subir el QR");
        });
    });

    it("handles submit API failure response gracefully", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/config/metodos-donacion") {
                return Promise.resolve({ ok: true, json: async () => mockMetodos });
            }
            if (url === "/api/usuarios/perfil") {
                return Promise.resolve({
                    ok: false,
                    json: async () => ({ message: "Failed updating" })
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
        });

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Failed updating");
        });
    });

    it("handles submit API failure without message and exception throw", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/config/metodos-donacion") {
                return Promise.resolve({ ok: true, json: async () => mockMetodos });
            }
            if (url === "/api/usuarios/perfil") {
                return Promise.resolve({ ok: false, json: async () => ({}) });
            }
            return Promise.resolve({ ok: false });
        });

        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
        });

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al guardar");
        });
    });

    it("handles submit throw with non-Error object gracefully", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/config/metodos-donacion") {
                return Promise.resolve({ ok: true, json: async () => mockMetodos });
            }
            if (url === "/api/usuarios/perfil") {
                return Promise.reject("Raw string submit error");
            }
            return Promise.resolve({ ok: false });
        });

        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
        });

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al actualizar métodos de donación");
        });
    });

    it("handles input changes for payment url and qr name", async () => {
        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByPlaceholderText("https://paypal.me/tuusuario")).toBeInTheDocument();
        });

        const urlInput = screen.getByPlaceholderText("https://paypal.me/tuusuario");
        fireEvent.change(urlInput, { target: { value: "https://paypal.me/newurl" } });
        expect(urlInput).toHaveValue("https://paypal.me/newurl");

        const qrNameInput = screen.getByPlaceholderText("Ej: Yape, Plin, PayPal");
        fireEvent.change(qrNameInput, { target: { value: "Plin" } });
        expect(qrNameInput).toHaveValue("Plin");
    });

    it("handles input changes for account numbers in methods", async () => {
        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText("Agregar Método")).toBeInTheDocument();
        });

        const addButton = screen.getByText("Agregar Método");
        fireEvent.click(addButton);

        const accountInput = screen.getByPlaceholderText("Ingresa el número de cuenta, teléfono, email, etc.");
        fireEvent.change(accountInput, { target: { value: "12345678" } });
        expect(accountInput).toHaveValue("12345678");
    });

    it("triggers file input click when upload button is clicked", async () => {
        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText("Subir QR")).toBeInTheDocument();
        });

        const uploadButton = screen.getByText("Subir QR");
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const clickSpy = vi.spyOn(fileInput, "click");

        fireEvent.click(uploadButton);
        expect(clickSpy).toHaveBeenCalled();
    });

    it("handles error when fetching available methods on mount", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchApi as any).mockRejectedValueOnce(new Error("API Error"));

        render(<DonationForm {...defaultProps} />);
        
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error loading donation methods:", expect.any(Error));
        });
        consoleErrorSpy.mockRestore();
    });

    it("handles changing selected donation method type", async () => {
        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText("Agregar Método")).toBeInTheDocument();
        });

        const addButton = screen.getByText("Agregar Método");
        fireEvent.click(addButton);

        const plinOption = screen.getByTestId("mock-select-item-2");
        fireEvent.click(plinOption);
    });

    it("shows error when trying to add more methods than available", async () => {
        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText("Agregar Método")).toBeInTheDocument();
        });

        const addButton = screen.getByText("Agregar Método");
        // Add Yape
        fireEvent.click(addButton);
        await waitFor(() => {
            expect(screen.getAllByText("Método").length).toBe(1);
        });

        // Add Plin
        fireEvent.click(addButton);
        await waitFor(() => {
            expect(screen.getAllByText("Método").length).toBe(2);
        });

        // Trigger onClick directly from React props to bypass disabled button check
        const reactPropsKey = Object.keys(addButton).find(
            (key) => key.startsWith("__reactProps$") || key.startsWith("__reactEventHandlers$")
        );
        if (reactPropsKey && (addButton as any)[reactPropsKey].onClick) {
            (addButton as any)[reactPropsKey].onClick({
                preventDefault: () => {},
                stopPropagation: () => {},
            });
        }

        expect(toast.error).toHaveBeenCalledWith("Ya has agregado todos los métodos disponibles");
    });

    it("submits successfully with an existing QR URL instead of base64", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/config/metodos-donacion") {
                return Promise.resolve({ ok: true, json: async () => mockMetodos });
            }
            if (url === "/api/usuarios/perfil") {
                return Promise.resolve({ ok: true });
            }
            return Promise.resolve({ ok: false });
        });

        render(
            <DonationForm
                {...defaultProps}
                perfilArtista={{ urlPago: "", pagoQR: "https://s3.com/existing-qr.png", nombreQR: "Yape" }}
            />
        );

        await waitFor(() => {
            expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
        });

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith(
                "/api/usuarios/perfil",
                expect.objectContaining({
                    method: "PATCH",
                    body: expect.stringContaining('"pagoQR":"https://s3.com/existing-qr.png"')
                })
            );
        });
    });

    it("filters out donation methods with missing metodoDonacionId on submit", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/config/metodos-donacion") {
                return Promise.resolve({ ok: true, json: async () => mockMetodos });
            }
            if (url === "/api/usuarios/perfil") {
                return Promise.resolve({ ok: true });
            }
            return Promise.resolve({ ok: false });
        });

        const metodosArtista = [
            { metodoDonacionId: "", numeroCuenta: "987654321" }
        ];

        render(
            <DonationForm
                {...defaultProps}
                metodosDonacion={metodosArtista}
            />
        );

        await waitFor(() => {
            expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
        });

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith(
                "/api/usuarios/perfil",
                expect.objectContaining({
                    method: "PATCH",
                    body: expect.stringContaining('"metodosDonacion":[]')
                })
            );
        });
    });

    it("handles error response when fetching available methods fails", async () => {
        (fetchApi as any).mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        render(<DonationForm {...defaultProps} />);
        
        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith("/api/config/metodos-donacion");
        });
    });

    it("does nothing if handleQRUpload is called with no file", async () => {
        render(<DonationForm {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
        });

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(fileInput, { target: { files: [] } });
        expect(toast.success).not.toHaveBeenCalled();
    });

    it("validates that QR Name is required if QR Image is uploaded", async () => {
        render(
            <DonationForm
                {...defaultProps}
                perfilArtista={{ urlPago: "", pagoQR: "data:image/png;base64,mock-qr-data", nombreQR: "" }}
            />
        );
        await waitFor(() => {
            expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
        });

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        expect(toast.error).toHaveBeenCalledWith("Debes ingresar un nombre para identificar el QR");
    });

    it("initializes donations correctly when metodosDonacion is undefined or contains alternate account fields", () => {
        render(
            <DonationForm
                {...defaultProps}
                metodosDonacion={undefined as any}
            />
        );

        expect(screen.queryByPlaceholderText("Ingresa el número de cuenta, teléfono, email, etc.")).not.toBeInTheDocument();

        const altMethods = [
            { id: "a", metodoDonacionId: "1", numeroCuenta: "", identificador: "my-id" },
            { id: "b", metodoDonacionId: "2", numeroCuenta: "", numeroTelefono: "999888777" },
            { id: "c", metodoDonacionId: "3", numeroCuenta: "", identificador: "", numeroTelefono: "" }
        ];

        render(
            <DonationForm
                {...defaultProps}
                metodosDonacion={altMethods}
            />
        );

        expect(screen.getByDisplayValue("my-id")).toBeInTheDocument();
        expect(screen.getByDisplayValue("999888777")).toBeInTheDocument();
    });
});
