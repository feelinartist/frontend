import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PaginaConfiguracionAdmin from "../page";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockGet = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useSearchParams: () => ({
        get: mockGet,
    }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock components
vi.mock("@/components/animated-background", () => ({
    AnimatedBackground: () => <div data-testid="animated-bg" />,
}));

vi.mock("@/components/ui/loading-screen", () => ({
    LoadingScreen: () => <div data-testid="loading-screen">Cargando...</div>,
}));

vi.mock("@/components/ui/back-button", () => ({
    BackButton: ({ href }: any) => <a href={href} data-testid="back-button">Atrás</a>,
}));

// Mock Dialog locally
vi.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="mock-dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

// Mock sweetalert2 and sweetalert2-react-content
const mockSwalFire = vi.fn().mockResolvedValue({ isConfirmed: true });
vi.mock("sweetalert2", () => ({
    default: {
        fire: (...args: any[]) => mockSwalFire(...args),
    },
}));

vi.mock("sweetalert2-react-content", () => ({
    default: vi.fn().mockImplementation((swal) => swal),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("PaginaConfiguracionAdmin", () => {
    const originalEnv = process.env.NEXT_PUBLIC_BACKEND_URL;

    const mockRedesData = [
        { id: "red-1", nombre: "Instagram", urlBase: "https://instagram.com/", icono: "instagram" },
        { id: "red-2", nombre: "Youtube", urlBase: "https://youtube.com/", icono: "" },
        { id: "red-3", nombre: "Custom Web", urlBase: "https://custom.com/", icono: "http://custom-icon.png" },
        { id: "red-4", nombre: "Twitter", urlBase: "https://twitter.com/", icono: "twitter" },
        { id: "red-5", nombre: "Facebook", urlBase: "https://facebook.com/", icono: "facebook" },
        { id: "red-6", nombre: "TikTok", urlBase: "https://tiktok.com/", icono: "tiktok" },
        { id: "red-7", nombre: "WhatsApp", urlBase: "https://wa.me/", icono: "whatsapp" },
        { id: "red-8", nombre: "SoundCloud", urlBase: "https://soundcloud.com/", icono: "soundcloud" },
    ];

    const mockMetodosData = [
        { id: "met-1", nombre: "PayPal", icono: "http://paypal-icon.png" },
        { id: "met-2", nombre: "", icono: "" },
    ];

    beforeEach(() => {
        vi.resetAllMocks();
        mockPush.mockReset();
        mockGet.mockReturnValue(null);
        process.env.NEXT_PUBLIC_BACKEND_URL = "http://backend";

        // Default authenticated as ADMIN
        (useSession as any).mockReturnValue({
            data: { user: { email: "admin@test.com", rol: "ADMIN" } },
            status: "authenticated",
        });

        // Default fetch mock resolve
        mockFetch.mockImplementation(async (url: string) => {
            if (url.includes("/api/config/redes-sociales")) {
                return {
                    ok: true,
                    json: async () => mockRedesData,
                };
            }
            if (url.includes("/api/config/metodos-donacion")) {
                return {
                    ok: true,
                    json: async () => mockMetodosData,
                };
            }
            return { ok: false };
        });
    });

    afterEach(() => {
        process.env.NEXT_PUBLIC_BACKEND_URL = originalEnv;
    });

    it("renders loading screen when session status is loading", () => {
        (useSession as any).mockReturnValue({
            data: null,
            status: "loading",
        });

        render(<PaginaConfiguracionAdmin />);
        expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
    });

    it("redirects non-admin users to /home", () => {
        (useSession as any).mockReturnValue({
            data: { user: { email: "user@test.com", rol: "PUBLICO" } },
            status: "authenticated",
        });

        render(<PaginaConfiguracionAdmin />);
        expect(mockPush).toHaveBeenCalledWith("/home");
    });

    it("allows loading page for ADMIN role and fetches config data", async () => {
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        expect(screen.getByText("Configuración Global")).toBeInTheDocument();
        expect(screen.getByText("Instagram")).toBeInTheDocument();
        expect(screen.getByText("Youtube")).toBeInTheDocument();
    });

    it("handles data fetching failures properly", async () => {
        mockFetch.mockResolvedValueOnce({ ok: false }); // fails redes-sociales

        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        expect(toast.error).toHaveBeenCalledWith("Error al cargar los datos de configuración");
    });

    it("handles data fetching exceptions properly", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Fetch Failure"));

        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        expect(toast.error).toHaveBeenCalledWith("Error al cargar los datos de configuración");
    });

    it("switches tabs correctly", async () => {
        mockGet.mockReturnValue("donations"); // start on donations tab

        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        expect(screen.getByText("Opciones de Apoyo")).toBeInTheDocument();
        expect(screen.getByText("PayPal")).toBeInTheDocument();
    });

    it("handles adding new social media item", async () => {
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        const addBtn = screen.getByText("Nueva Red");
        fireEvent.click(addBtn);

        expect(screen.getByTestId("mock-dialog")).toBeInTheDocument();
        expect(screen.getByText("Nueva Red Social")).toBeInTheDocument();

        // Fill form using accessible labels
        const nameInput = screen.getByLabelText("Nombre");
        const urlInput = screen.getByLabelText("URL Base (Sin el @/usuario)");
        const iconInput = screen.getByLabelText("Icono (Opcional - Clase Lucide)");

        fireEvent.change(nameInput, { target: { value: "NewSocial" } });
        fireEvent.change(urlInput, { target: { value: "https://newsocial.com/" } });
        fireEvent.change(iconInput, { target: { value: "globe" } });

        mockFetch.mockResolvedValueOnce({ ok: true });

        const saveBtn = screen.getByText("Guardar");
        fireEvent.click(saveBtn);

        await actAndFlush();

        expect(mockFetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/admin/config/redes-sociales",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ nombre: "NewSocial", urlBase: "https://newsocial.com/", icono: "globe" }),
            })
        );
        expect(toast.success).toHaveBeenCalledWith("Red social creada");
        expect(screen.queryByTestId("mock-dialog")).not.toBeInTheDocument();
    });

    it("handles editing an existing social media item", async () => {
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        // click edit on second card (Youtube, which has empty icon string)
        const editBtns = screen.getAllByRole("button").filter(b => b.querySelector("svg.lucide-pencil"));
        expect(editBtns[1]).toBeInTheDocument();
        fireEvent.click(editBtns[1]);

        expect(screen.getByText("Editar Red Social")).toBeInTheDocument();

        // form should be populated
        const nameInput = screen.getByLabelText("Nombre");
        expect((nameInput as HTMLInputElement).value).toBe("Youtube");

        // modify name
        fireEvent.change(nameInput, { target: { value: "Youtube Edit" } });

        mockFetch.mockResolvedValueOnce({ ok: true });

        const saveBtn = screen.getByText("Guardar");
        fireEvent.click(saveBtn);

        await actAndFlush();

        expect(mockFetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/admin/config/redes-sociales/red-2",
            expect.objectContaining({
                method: "PATCH",
                body: JSON.stringify({ nombre: "Youtube Edit", urlBase: "https://youtube.com/", icono: "" }),
            })
        );
        expect(toast.success).toHaveBeenCalledWith("Red social actualizada");
    });

    it("shows toast error if validation fails in social form", async () => {
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        const addBtn = screen.getByText("Nueva Red");
        fireEvent.click(addBtn);

        const saveBtn = screen.getByText("Guardar");
        fireEvent.click(saveBtn);

        expect(toast.error).toHaveBeenCalledWith("Nombre y URL Base son requeridos");
    });

    it("handles save social failures and exceptions", async () => {
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        const addBtn = screen.getByText("Nueva Red");
        fireEvent.click(addBtn);

        const nameInput = screen.getByLabelText("Nombre");
        const urlInput = screen.getByLabelText("URL Base (Sin el @/usuario)");
        fireEvent.change(nameInput, { target: { value: "Test" } });
        fireEvent.change(urlInput, { target: { value: "http://test" } });

        // Fail response
        mockFetch.mockResolvedValueOnce({ ok: false });
        const saveBtn = screen.getByText("Guardar");
        fireEvent.click(saveBtn);
        await actAndFlush();
        expect(toast.error).toHaveBeenCalledWith("Error al guardar");

        // Throw exception
        mockFetch.mockRejectedValueOnce(new Error("Net"));
        fireEvent.click(saveBtn);
        await actAndFlush();
        expect(toast.error).toHaveBeenCalledWith("Error de conexión");
    });

    it("handles adding new donation method", async () => {
        mockGet.mockReturnValue("donations");
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        const addBtn = screen.getByText("Nuevo Método");
        fireEvent.click(addBtn);

        expect(screen.getByText("Nuevo Método de Donación")).toBeInTheDocument();

        const nameInput = screen.getByLabelText("Nombre del Método");
        const iconInput = screen.getByLabelText("URL del Icono (Opcional)");

        fireEvent.change(nameInput, { target: { value: "Bizum" } });
        fireEvent.change(iconInput, { target: { value: "http://bizum" } });

        mockFetch.mockResolvedValueOnce({ ok: true });

        const saveBtn = screen.getByText("Guardar");
        fireEvent.click(saveBtn);

        await actAndFlush();

        expect(mockFetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/admin/config/metodos-donacion",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ nombre: "Bizum", icono: "http://bizum" }),
            })
        );
        expect(toast.success).toHaveBeenCalledWith("Método creado");
    });

    it("handles editing an existing donation method", async () => {
        mockGet.mockReturnValue("donations");
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        const editBtns = screen.getAllByRole("button").filter(b => b.querySelector("svg.lucide-pencil"));
        fireEvent.click(editBtns[1]); // Zelle (empty icon/name)

        expect(screen.getByText("Editar Método")).toBeInTheDocument();

        const nameInput = screen.getByLabelText("Nombre del Método");
        fireEvent.change(nameInput, { target: { value: "Zelle Edited" } });

        mockFetch.mockResolvedValueOnce({ ok: true });

        const saveBtn = screen.getByText("Guardar");
        fireEvent.click(saveBtn);

        await actAndFlush();

        expect(mockFetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/admin/config/metodos-donacion/met-2",
            expect.objectContaining({
                method: "PATCH",
                body: JSON.stringify({ nombre: "Zelle Edited", icono: "" }),
            })
        );
    });

    it("shows toast error if validation fails in donation form", async () => {
        mockGet.mockReturnValue("donations");
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        const addBtn = screen.getByText("Nuevo Método");
        fireEvent.click(addBtn);

        const saveBtn = screen.getByText("Guardar");
        fireEvent.click(saveBtn);

        expect(toast.error).toHaveBeenCalledWith("El nombre es requerido");
    });

    it("handles save donation failures and exceptions", async () => {
        mockGet.mockReturnValue("donations");
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        const addBtn = screen.getByText("Nuevo Método");
        fireEvent.click(addBtn);

        const nameInput = screen.getByLabelText("Nombre del Método");
        fireEvent.change(nameInput, { target: { value: "Bizum" } });

        // Fail response with no message property
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({}),
        });
        const saveBtn = screen.getByText("Guardar");
        fireEvent.click(saveBtn);
        await actAndFlush();
        expect(toast.error).toHaveBeenCalledWith("Error al guardar");

        // Throw exception
        mockFetch.mockRejectedValueOnce(new Error("Net"));
        fireEvent.click(saveBtn);
        await actAndFlush();
        expect(toast.error).toHaveBeenCalledWith("Error de conexión");
    });

    it("handles delete action correctly", async () => {
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        // click delete on first social media
        const deleteBtn = screen.getAllByRole("button").find(b => b.querySelector("svg.lucide-trash-2"));
        expect(deleteBtn).toBeInTheDocument();

        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });
        mockFetch.mockResolvedValueOnce({ ok: true });

        fireEvent.click(deleteBtn!);

        await actAndFlush();

        expect(mockSwalFire).toHaveBeenCalled();
        expect(mockFetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/admin/config/redes-sociales/red-1",
            expect.objectContaining({ method: "DELETE" })
        );
        expect(toast.success).toHaveBeenCalledWith("Eliminado correctamente");
    });

    it("handles delete failures and exceptions", async () => {
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        const deleteBtn = screen.getAllByRole("button").find(b => b.querySelector("svg.lucide-trash-2"));
        
        // Failure
        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });
        mockFetch.mockResolvedValueOnce({ ok: false });
        fireEvent.click(deleteBtn!);
        await actAndFlush();
        expect(toast.error).toHaveBeenCalledWith("Error al eliminar");

        // Exception
        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });
        mockFetch.mockRejectedValueOnce(new Error("Net"));
        fireEvent.click(deleteBtn!);
        await actAndFlush();
        expect(toast.error).toHaveBeenCalledWith("Error de conexión");
    });

    it("does not delete if SweetAlert is cancelled", async () => {
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        const deleteBtn = screen.getAllByRole("button").find(b => b.querySelector("svg.lucide-trash-2"));
        mockSwalFire.mockResolvedValueOnce({ isConfirmed: false });

        fireEvent.click(deleteBtn!);
        await actAndFlush();

        expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining("redes-sociales/red-1"), expect.objectContaining({ method: "DELETE" }));
    });

    it("closes social modal when Cancel button clicked", async () => {
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        const addBtn = screen.getByText("Nueva Red");
        fireEvent.click(addBtn);
        expect(screen.getByTestId("mock-dialog")).toBeInTheDocument();

        const cancelBtn = screen.getByText("Cancelar");
        fireEvent.click(cancelBtn);
        expect(screen.queryByTestId("mock-dialog")).not.toBeInTheDocument();
    });

    it("closes donation modal when Cancel button clicked", async () => {
        mockGet.mockReturnValue("donations");
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        const addBtn = screen.getByText("Nuevo Método");
        fireEvent.click(addBtn);
        expect(screen.getByTestId("mock-dialog")).toBeInTheDocument();

        const cancelBtn = screen.getByText("Cancelar");
        fireEvent.click(cancelBtn);
        expect(screen.queryByTestId("mock-dialog")).not.toBeInTheDocument();
    });

    it("handles delete donation method correctly", async () => {
        mockGet.mockReturnValue("donations");
        render(<PaginaConfiguracionAdmin />);
        await actAndFlush();

        // click delete on first donation method
        const deleteBtn = screen.getAllByRole("button").find(b => b.querySelector("svg.lucide-trash-2"));
        expect(deleteBtn).toBeInTheDocument();

        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });
        mockFetch.mockResolvedValueOnce({ ok: true });

        fireEvent.click(deleteBtn!);

        await actAndFlush();

        expect(mockSwalFire).toHaveBeenCalled();
        expect(mockFetch).toHaveBeenCalledWith(
            "http://localhost:3001/api/admin/config/metodos-donacion/met-1",
            expect.objectContaining({ method: "DELETE" })
        );
        expect(toast.success).toHaveBeenCalledWith("Eliminado correctamente");
    });

    // Helper function to process all microtasks/promises wrapped in act
    async function actAndFlush() {
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });
    }
});
