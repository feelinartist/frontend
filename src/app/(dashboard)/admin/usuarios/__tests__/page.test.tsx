import React from "react";
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PaginaGestionUsuarios from "../page";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
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
    LoadingScreen: () => <div data-testid="loading-screen">Cargando pantalla...</div>,
}));

vi.mock("@/components/ui/back-button", () => ({
    BackButton: ({ href }: any) => <a href={href} data-testid="back-button">Atrás</a>,
}));

// Mock Dialog locally to render children inline for easier DOM querying
vi.mock("@/components/ui/dialog", () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="mock-dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

// Mock sweetalert2 and sweetalert2-react-content
let containerReturnNull = false;
const mockSwalFire = vi.fn().mockImplementation((options: any) => {
    if (options && typeof options.didOpen === "function") {
        options.didOpen();
    }
    return Promise.resolve({ isConfirmed: true });
});
const mockSwalGetContainer = vi.fn().mockImplementation(() => {
    if (containerReturnNull) {
        return null;
    }
    return document.createElement("div");
});

vi.mock("sweetalert2", () => ({
    default: {
        fire: (...args: any[]) => mockSwalFire(...args),
        getContainer: () => mockSwalGetContainer(),
    },
}));

vi.mock("sweetalert2-react-content", () => ({
    default: vi.fn().mockImplementation((swal) => swal),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue("blob-url");

describe("PaginaGestionUsuarios", () => {
    const originalEnv = process.env.NEXT_PUBLIC_BACKEND_URL;

    const mockRolesData = [
        { id: "1", nombre: "SUPER_ADMIN" },
        { id: "2", nombre: "ADMIN" },
        { id: "3", nombre: "ARTISTA" },
        { id: "4", nombre: "DISCOTECA" },
        { id: "5", nombre: "PUBLICO" },
    ];

    const mockUsersData = {
        usuarios: [
            {
                id: "user-1",
                nombre: "Juan Perez",
                correo: "juan@perez.com",
                imagen: "https://example.com/juan.jpg",
                rol: { id: "3", nombre: "ARTISTA" },
                estadoCuenta: "ACTIVO",
                nombreUsuario: "juanperez",
                creadoEn: "2026-01-01T00:00:00Z",
                actualizadoEn: "2026-01-02T00:00:00Z",
                perfilArtista: {
                    urlPago: "https://pago.com/juan",
                    pagoQR: "https://example.com/pagoqr.jpg",
                    nombreQR: "QR Donacion",
                    musicQR: "https://example.com/musicqr.jpg",
                    galeria: [{ urlImagen: "https://example.com/gal1.jpg" }],
                },
            },
            {
                id: "user-2",
                nombre: "Maria Gomez",
                correo: "maria@gomez.com",
                imagen: null,
                rol: { id: "4", nombre: "DISCOTECA" },
                estadoCuenta: "SUSPENDIDO",
                nombreUsuario: null,
                creadoEn: "2026-01-05T00:00:00Z",
                actualizadoEn: "2026-01-06T00:00:00Z",
                perfilArtista: null,
            },
            {
                id: "user-3",
                nombre: "Super Admin User",
                correo: "super@admin.com",
                imagen: "https://example.com/super.jpg",
                rol: { id: "1", nombre: "SUPER_ADMIN" },
                estadoCuenta: "BANEADO",
                nombreUsuario: "superadmin",
                creadoEn: "2026-01-01T00:00:00Z",
                actualizadoEn: "2026-01-02T00:00:00Z",
                perfilArtista: null,
            },
            {
                id: "user-4",
                nombre: "Regular Admin User",
                correo: "admin@test.com",
                imagen: null,
                rol: { id: "2", nombre: "ADMIN" },
                estadoCuenta: "ELIMINACION_PENDIENTE",
                nombreUsuario: "admin",
                creadoEn: "2026-01-01T00:00:00Z",
                actualizadoEn: "2026-01-02T00:00:00Z",
                perfilArtista: null,
            },
            {
                id: "user-5",
                nombre: "Pedro Oyente",
                correo: "pedro@oyente.com",
                imagen: null,
                rol: { id: "5", nombre: "PUBLICO" },
                estadoCuenta: "ACTIVO",
                nombreUsuario: null,
                creadoEn: "2026-01-01T00:00:00Z",
                actualizadoEn: "2026-01-02T00:00:00Z",
                perfilArtista: null,
            },
        ],
        total: 5,
    };

    let fetchFailureMode: "none" | "users-fail" | "users-exception" | "update-fail" | "update-exception" | "download-fail" = "none";

    beforeEach(() => {
        vi.resetAllMocks();
        mockPush.mockReset();
        containerReturnNull = false;
        mockSwalFire.mockImplementation((options: any) => {
            if (options && typeof options.didOpen === "function") {
                options.didOpen();
            }
            return Promise.resolve({ isConfirmed: true });
        });
        mockSwalGetContainer.mockImplementation(() => {
            if (containerReturnNull) {
                return null;
            }
            return document.createElement("div");
        });
        process.env.NEXT_PUBLIC_BACKEND_URL = "http://backend";
        fetchFailureMode = "none";

        // Default authenticated as ADMIN
        (useSession as any).mockReturnValue({
            data: { user: { email: "admin@test.com", rol: "ADMIN" } },
            status: "authenticated",
        });

        // Default fetch mock resolve
        mockFetch.mockImplementation(async (url: string) => {
            if (url.includes("/api/admin/usuarios")) {
                if (fetchFailureMode === "users-fail") {
                    return { ok: false };
                }
                if (fetchFailureMode === "users-exception") {
                    throw new Error("Network Failure");
                }
                return {
                    ok: true,
                    json: async () => mockUsersData,
                };
            }
            if (url.includes("/api/admin/config/roles")) {
                return {
                    ok: true,
                    json: async () => mockRolesData,
                };
            }
            if (url.includes("/api/usuarios/perfil")) {
                if (fetchFailureMode === "update-fail") {
                    return {
                        ok: false,
                        json: async () => ({ message: "Invalido" }),
                    };
                }
                if (fetchFailureMode === "update-exception") {
                    throw new Error("Network Fail");
                }
                return {
                    ok: true,
                    json: async () => ({}),
                };
            }
            if (url.includes("/api/usuarios/banear") || url.includes("/api/usuarios/reactivar") || url.includes("/api/usuarios/eliminar-permanente")) {
                if (fetchFailureMode === "update-fail") {
                    return { ok: false };
                }
                if (fetchFailureMode === "update-exception") {
                    throw new Error("Network Fail");
                }
                return { ok: true };
            }
            if (url.startsWith("https://example.com/") || url.startsWith("https://avatar.vercel.sh")) {
                if (fetchFailureMode === "download-fail") {
                    throw new Error("Download fails");
                }
                return {
                    ok: true,
                    blob: async () => new Blob(["dummy content"], { type: "image/jpeg" }),
                };
            }
            return { ok: false };
        });
    });

    afterEach(() => {
        process.env.NEXT_PUBLIC_BACKEND_URL = originalEnv;
    });

    async function waitForLoadingToDisappear() {
        await waitForElementToBeRemoved(() => screen.queryByTestId("loading-screen"), { timeout: 3000 });
    }

    it("redirects unauthenticated users to /home", async () => {
        (useSession as any).mockReturnValue({
            data: null,
            status: "unauthenticated",
        });

        render(<PaginaGestionUsuarios />);

        expect(mockPush).toHaveBeenCalledWith("/home");
    });

    it("redirects authenticated non-admin users to /home", async () => {
        (useSession as any).mockReturnValue({
            data: { user: { email: "user@test.com", rol: "PUBLICO" } },
            status: "authenticated",
        });

        render(<PaginaGestionUsuarios />);

        expect(mockPush).toHaveBeenCalledWith("/home");
    });

    it("allows loading page for ADMIN role and fetches data", async () => {
        render(<PaginaGestionUsuarios />);
        expect(screen.getByTestId("loading-screen")).toBeInTheDocument();

        // Wait for data load
        await waitForLoadingToDisappear();

        expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
        expect(screen.getByText("Gestión de Usuarios")).toBeInTheDocument();
        expect(screen.getByText("Juan Perez")).toBeInTheDocument();
        expect(screen.getByText("Maria Gomez")).toBeInTheDocument();
        expect(screen.getByText("Super Admin User")).toBeInTheDocument();
        expect(screen.getByText("Regular Admin User")).toBeInTheDocument();
    });

    it("handles data fetching failures properly", async () => {
        fetchFailureMode = "users-fail";

        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        expect(toast.error).toHaveBeenCalledWith("Error al cargar los datos");
    });

    it("handles data fetching exceptions properly", async () => {
        fetchFailureMode = "users-exception";

        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        expect(toast.error).toHaveBeenCalledWith("Error de conexión con el servidor");
    });

    it("allows SUPER_ADMIN to access the page without redirect", async () => {
        (useSession as any).mockReturnValue({
            data: { user: { email: "super@admin.com", rol: "SUPER_ADMIN" } },
            status: "authenticated",
        });

        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        expect(mockPush).not.toHaveBeenCalledWith("/home");
        expect(screen.getByText("Gestión de Usuarios")).toBeInTheDocument();
    });

    it("falls back to an empty usuarios array when API returns null usuarios", async () => {
        mockFetch.mockImplementation(async (url: string) => {
            if (url.includes("/api/admin/usuarios")) {
                return {
                    ok: true,
                    json: async () => ({ usuarios: null, total: 0 }),
                };
            }
            if (url.includes("/api/admin/config/roles")) {
                return {
                    ok: true,
                    json: async () => mockRolesData,
                };
            }
            return { ok: false };
        });

        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        expect(screen.getByText("No se encontraron usuarios que coincidan con la búsqueda")).toBeInTheDocument();
    });

    it("performs search with debounce", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const searchInput = screen.getByPlaceholderText("Buscar por nombre, correo o @usuario...");
        fireEvent.change(searchInput, { target: { value: "Juan" } });

        // Timer is running but not triggered immediately
        expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining("termino=Juan"));

        // Wait for the debounce timeout to trigger
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("termino=Juan"));
        }, { timeout: 2000 });
    });

    it("handles pagination clicks", async () => {
        // Change total so pagination renders
        const paginatedMockUsers = {
            usuarios: mockUsersData.usuarios,
            total: 50, // More than 20 items per page
        };
        mockFetch.mockImplementation(async (url: string) => {
            if (url.includes("/api/admin/usuarios")) {
                return {
                    ok: true,
                    json: async () => paginatedMockUsers,
                };
            }
            if (url.includes("/api/admin/config/roles")) {
                return {
                    ok: true,
                    json: async () => mockRolesData,
                };
            }
            return { ok: false };
        });

        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        expect(screen.getByText(/1 DE 3/)).toBeInTheDocument();

        const nextButton = screen.getByText("Siguiente");
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText(/2 DE 3/)).toBeInTheDocument();
        });
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("page=2"));

        const prevButton = screen.getByText("Anterior");
        fireEvent.click(prevButton);

        await waitFor(() => {
            expect(screen.getByText(/1 DE 3/)).toBeInTheDocument();
        });
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("page=1"));
    });

    it("opens user management dialog and handles updates", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]); // Juan Perez

        expect(screen.getByTestId("mock-dialog")).toBeInTheDocument();
        expect(screen.getByText("Ver detalles y modificar privilegios de Juan Perez.")).toBeInTheDocument();

        // Change select fields directly
        const roleOption = screen.getByTestId("mock-select-item-ADMIN");
        fireEvent.click(roleOption);

        const statusOption = screen.getByTestId("mock-select-item-SUSPENDIDO");
        fireEvent.click(statusOption);

        const saveBtn = screen.getByText("Guardar Cambios");
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Usuario actualizado correctamente");
            expect(screen.queryByTestId("mock-dialog")).not.toBeInTheDocument();
        });

        expect(mockFetch).toHaveBeenCalledWith(
            "http://backend/api/usuarios/perfil",
            expect.objectContaining({
                method: "PATCH",
                body: JSON.stringify({
                    usuarioId: "user-1",
                    rol: "ADMIN",
                    estadoCuenta: "SUSPENDIDO",
                }),
            })
        );
    });

    it("handles update failures", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]);

        fetchFailureMode = "update-fail";

        const saveBtn = screen.getByText("Guardar Cambios");
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Invalido");
        });
    });

    it("handles update exceptions", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]);

        fetchFailureMode = "update-exception";

        const saveBtn = screen.getByText("Guardar Cambios");
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al actualizar usuario");
        });
    });

    it("handles file downloads successfully", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]);

        // Download button on QR
        const downloadQrBtns = screen.getAllByTitle("Descargar");
        fireEvent.click(downloadQrBtns[0]); // downloads profile image

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith("https://example.com/juan.jpg");
            expect(global.URL.createObjectURL).toHaveBeenCalled();
        });
    });

    it("falls back to window.open on download error", async () => {
        const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);

        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]);

        fetchFailureMode = "download-fail";

        const downloadBtns = screen.getAllByTitle("Descargar");
        fireEvent.click(downloadBtns[0]);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al descargar la imagen");
            expect(windowOpenSpy).toHaveBeenCalledWith("https://example.com/juan.jpg", "_blank");
        });
        windowOpenSpy.mockRestore();
    });

    it("handles window.open for original images and links", async () => {
        const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);

        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]);

        // Click see original
        const openOriginalBtn = screen.getByTitle("Ver original");
        fireEvent.click(openOriginalBtn);
        expect(windowOpenSpy).toHaveBeenCalledWith("https://example.com/juan.jpg", "_blank");

        // Click external link on payment URL (precise query to avoid selector conflict)
        const paymentLinkText = screen.getByText("https://pago.com/juan");
        const paymentLinkContainer = paymentLinkText.parentElement;
        const paymentLinkBtn = paymentLinkContainer!.querySelector("button");
        fireEvent.click(paymentLinkBtn!);
        expect(windowOpenSpy).toHaveBeenCalledWith("https://pago.com/juan", "_blank");

        windowOpenSpy.mockRestore();
    });

    it("handles fallbacks and default badges for public role and null values", async () => {
        const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);

        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        // 1. Verify Public role badge is rendered for Pedro Oyente (user-5)
        expect(screen.getByText("Público")).toBeInTheDocument();

        // 2. Click Gestionar for user-2 (Maria Gomez, index 1)
        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[1]); // Maria Gomez

        // 3. Click see original (image is null, falls back to avatar URL)
        const openOriginalBtn = screen.getByTitle("Ver original");
        fireEvent.click(openOriginalBtn);
        expect(windowOpenSpy).toHaveBeenCalledWith("https://avatar.vercel.sh/user", "_blank");

        // 4. Click download (image is null, falls back to avatar URL and 'usuario')
        const downloadBtn = screen.getByTitle("Descargar");
        fireEvent.click(downloadBtn);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith("https://avatar.vercel.sh/user");
        });

        windowOpenSpy.mockRestore();
    });

    it("allows ban action on user", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]);

        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });

        const banBtn = screen.getByText("Banear");
        fireEvent.click(banBtn);

        await waitFor(() => {
            expect(mockSwalFire).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalledWith(
                "http://backend/api/usuarios/banear",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ usuarioId: "user-1" }),
                })
            );
            expect(toast.success).toHaveBeenCalledWith("Usuario baneado correctamente");
        });
    });

    it("handles ban action failures", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]);

        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });
        fetchFailureMode = "update-fail";

        const banBtn = screen.getByText("Banear");
        fireEvent.click(banBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al banear usuario");
        });
    });

    it("handles ban action exception", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]);

        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });
        fetchFailureMode = "update-exception";

        const banBtn = screen.getByText("Banear");
        fireEvent.click(banBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error de red");
        });
    });

    it("allows unban action on banned user", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[2]); // Super Admin User is BANEADO

        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });

        const unbanBtn = screen.getByText("Desbanear");
        fireEvent.click(unbanBtn);

        await waitFor(() => {
            expect(mockSwalFire).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalledWith(
                "http://backend/api/usuarios/reactivar",
                expect.objectContaining({
                    method: "PATCH",
                    body: JSON.stringify({ usuarioId: "user-3" }),
                })
            );
            expect(toast.success).toHaveBeenCalledWith("Usuario desbaneado correctamente");
        });
    });

    it("handles unban failures and exceptions", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[2]);

        // Unban failure
        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });
        fetchFailureMode = "update-fail";

        const unbanBtn = screen.getByText("Desbanear");
        fireEvent.click(unbanBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al desbanear usuario");
        });

        // Unban exception
        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });
        fetchFailureMode = "update-exception";
        fireEvent.click(unbanBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error de red");
        });
    });

    it("allows permanent deletion of user", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]);

        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });

        const deleteBtn = screen.getByText("Borrar");
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(mockSwalFire).toHaveBeenCalled();
            expect(mockFetch).toHaveBeenCalledWith(
                "http://backend/api/usuarios/eliminar-permanente",
                expect.objectContaining({
                    method: "DELETE",
                    body: JSON.stringify({ usuarioId: "user-1" }),
                })
            );
            expect(toast.success).toHaveBeenCalledWith("Usuario eliminado para siempre");
        });
    });

    it("handles permanent deletion failures and exceptions", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]);

        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });
        fetchFailureMode = "update-fail";

        const deleteBtn = screen.getByText("Borrar");
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al eliminar usuario");
        });

        // exception
        mockSwalFire.mockResolvedValueOnce({ isConfirmed: true });
        fetchFailureMode = "update-exception";
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error de red");
        });
    });

    it("does nothing if sweetalert is cancelled", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]);

        mockSwalFire.mockResolvedValueOnce({ isConfirmed: false });

        const banBtn = screen.getByText("Banear");
        fireEvent.click(banBtn);

        // wait for swal call to resolve
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(mockFetch).not.toHaveBeenCalledWith(expect.stringContaining("banear"), expect.any(Object));
    });

    it("closes dialog when Cerrar button is clicked", async () => {
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]);

        expect(screen.getByTestId("mock-dialog")).toBeInTheDocument();

        const closeBtn = screen.getByText("Cerrar");
        fireEvent.click(closeBtn);

        expect(screen.queryByTestId("mock-dialog")).not.toBeInTheDocument();
    });

    it("renders empty list screen when no users match", async () => {
        mockFetch.mockImplementation(async (url: string) => {
            if (url.includes("/api/admin/usuarios")) {
                return {
                    ok: true,
                    json: async () => ({ usuarios: [], total: 0 }),
                };
            }
            if (url.includes("/api/admin/config/roles")) {
                return {
                    ok: true,
                    json: async () => mockRolesData,
                };
            }
            return { ok: false };
        });

        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        expect(screen.getByText("No se encontraron usuarios que coincidan con la búsqueda")).toBeInTheDocument();
    });

    it("clicks all media buttons (QRs and gallery) for view and download", async () => {
        const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);

        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[0]); // Juan Perez

        // 1. Music QR buttons
        const musicQrImg = screen.getByAltText("Legacy QR");
        const musicQrContainer = musicQrImg.parentElement;
        const musicButtons = musicQrContainer!.querySelectorAll("button");
        fireEvent.click(musicButtons[0]); // view
        fireEvent.click(musicButtons[1]); // download
        expect(windowOpenSpy).toHaveBeenCalledWith("https://example.com/musicqr.jpg", "_blank");

        // 2. Payment QR buttons
        const pagoQrImg = screen.getByAltText("Image QR");
        const pagoQrContainer = pagoQrImg.parentElement;
        const pagoButtons = pagoQrContainer!.querySelectorAll("button");
        fireEvent.click(pagoButtons[0]); // view
        fireEvent.click(pagoButtons[1]); // download
        expect(windowOpenSpy).toHaveBeenCalledWith("https://example.com/pagoqr.jpg", "_blank");

        // 3. Gallery image buttons
        const galleryImg = screen.getByAltText("Gallery 0");
        const galleryContainer = galleryImg.parentElement;
        const galleryButtons = galleryContainer!.querySelectorAll("button");
        fireEvent.click(galleryButtons[0]); // view
        fireEvent.click(galleryButtons[1]); // download
        expect(windowOpenSpy).toHaveBeenCalledWith("https://example.com/gal1.jpg", "_blank");

        windowOpenSpy.mockRestore();
    });

    it("handles didOpen callbacks when container is null for ban, unban and delete permanently", async () => {
        containerReturnNull = true;
        render(<PaginaGestionUsuarios />);
        await waitForLoadingToDisappear();

        // 1. Unban (desbanear)
        const gestionarBtns = screen.getAllByText("Gestionar");
        fireEvent.click(gestionarBtns[2]); // Super Admin User is BANEADO
        const unbanBtn = screen.getByText("Desbanear");
        fireEvent.click(unbanBtn);
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Usuario desbaneado correctamente");
        });

        // 2. Ban (banear)
        fireEvent.click(gestionarBtns[0]); // Juan Perez
        const banBtn = screen.getByText("Banear");
        fireEvent.click(banBtn);
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Usuario baneado correctamente");
        });

        // 3. Delete permanently (borrar)
        fireEvent.click(gestionarBtns[0]); // Juan Perez (reopen editor)
        const deleteBtn = screen.getByText("Borrar");
        fireEvent.click(deleteBtn);
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Usuario eliminado para siempre");
        });
    });
});
