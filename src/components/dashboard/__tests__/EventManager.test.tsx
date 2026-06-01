import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EventManager } from "../EventManager";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
    useSession: vi.fn(),
}));

// Mock @/lib/api
vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        fetchApi: vi.fn(),
    };
});

// Mock sonner
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
    },
}));

// Mock @/components/ui/switch
vi.mock("@/components/ui/switch", () => ({
    Switch: ({ checked, onCheckedChange }: any) => (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            data-testid="mock-switch"
        >
            {checked ? "ON" : "OFF"}
        </button>
    ),
}));

describe("EventManager Component", () => {
    const mockUser = {
        id: "user-123",
        perfilArtista: { id: "artist-123" },
    };

    const mockEvent = {
        id: "event-456",
        titulo: "Mi Gran Evento",
        descripcion: "Una descripción de prueba",
        horaInicio: "2026-05-27T10:00:00.000Z",
    };

    const mockProfileResponse = {
        perfilArtista: {
            pedidosActivos: true,
            zonaHoraria: "America/Bogota",
        },
        perfilPublico: {
            zonaHoraria: "America/Bogota",
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup useSession mock
        (useSession as any).mockReturnValue({
            data: { user: mockUser },
        });

        // Setup default fetchApi mocks
        (fetchApi as any).mockImplementation(async (path: string) => {
            if (path.includes("/api/eventos/activo/")) {
                return {
                    ok: true,
                    json: async () => mockEvent,
                };
            }
            if (path.includes("/api/usuarios/perfil/")) {
                return {
                    ok: true,
                    json: async () => mockProfileResponse,
                };
            }
            return { ok: false };
        });

        // Setup default Geolocation mock
        const mockGeolocation = {
            getCurrentPosition: vi.fn(),
        };
        Object.defineProperty(global.navigator, "geolocation", {
            value: mockGeolocation,
            writable: true,
            configurable: true,
        });
    });

    it("renders loading state initially and then shows the active event", async () => {
        render(<EventManager />);

        // Initially null is returned if loading is true
        expect(screen.queryByText("Gestor de Eventos")).not.toBeInTheDocument();

        // Wait for fetchState to complete and render the component
        await waitFor(() => {
            expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument();
        });

        expect(screen.getByText("Mi Gran Evento")).toBeInTheDocument();
        expect(screen.getByText("Una descripción de prueba")).toBeInTheDocument();
        expect(screen.getByRole("switch")).toBeInTheDocument();
        expect(screen.getByText("ON")).toBeInTheDocument();
    });

    it("renders create event form if no active event is returned", async () => {
        // Mock fetchApi to return 404 for active event
        (fetchApi as any).mockImplementation(async (path: string) => {
            if (path.includes("/api/eventos/activo/")) {
                return { ok: false };
            }
            if (path.includes("/api/usuarios/perfil/")) {
                return {
                    ok: true,
                    json: async () => ({
                        perfilArtista: { pedidosActivos: false, zonaHoraria: "America/Bogota" },
                    }),
                };
            }
            return { ok: false };
        });

        render(<EventManager />);

        await waitFor(() => {
            expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument();
        });

        expect(screen.queryByText("Mi Gran Evento")).not.toBeInTheDocument();
        expect(screen.getByLabelText(/nombre de discoteca o evento/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/descripción \(opcional\)/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /iniciar evento/i })).toBeDisabled();
    });

    it("handles geolocation success and error", async () => {
        // No active event
        (fetchApi as any).mockImplementation(async (path: string) => {
            if (path.includes("/api/eventos/activo/")) return { ok: false };
            return { ok: true, json: async () => ({}) };
        });

        render(<EventManager />);
        await waitFor(() => {
            expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument();
        });

        const locationBtn = screen.getByRole("button", { name: /usar mi ubicación/i });
        expect(locationBtn).toBeInTheDocument();

        // Simulate geolocation success
        const mockPosition = {
            coords: {
                latitude: 4.6097,
                longitude: -74.0817,
            },
        };
        (navigator.geolocation.getCurrentPosition as any).mockImplementationOnce((success: any) =>
            success(mockPosition)
        );

        fireEvent.click(locationBtn);

        expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("Ubicación obtenida");
        expect(screen.getByText("Ubicación guardada")).toBeInTheDocument();

        // Check button text says "Listo" and is disabled
        expect(screen.getByRole("button", { name: /listo/i })).toBeDisabled();
    });

    it("handles geolocation permission error", async () => {
        // No active event
        (fetchApi as any).mockImplementation(async (path: string) => {
            if (path.includes("/api/eventos/activo/")) return { ok: false };
            return { ok: true, json: async () => ({}) };
        });

        render(<EventManager />);
        await waitFor(() => {
            expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument();
        });

        const locationBtn = screen.getByRole("button", { name: /usar mi ubicación/i });

        // Simulate geolocation error
        const mockError = new Error("Permission Denied");
        (navigator.geolocation.getCurrentPosition as any).mockImplementationOnce((success: any, error: any) =>
            error(mockError)
        );

        fireEvent.click(locationBtn);

        expect(toast.error).toHaveBeenCalledWith("No se pudo obtener la ubicación");
        expect(screen.queryByText("Ubicación guardada")).not.toBeInTheDocument();
    });

    it("handles geolocation not supported", async () => {
        // No active event
        (fetchApi as any).mockImplementation(async (path: string) => {
            if (path.includes("/api/eventos/activo/")) return { ok: false };
            return { ok: true, json: async () => ({}) };
        });

        // Delete geolocation
        Object.defineProperty(global.navigator, "geolocation", {
            value: undefined,
            writable: true,
            configurable: true,
        });

        render(<EventManager />);
        await waitFor(() => {
            expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument();
        });

        const locationBtn = screen.getByRole("button", { name: /usar mi ubicación/i });
        fireEvent.click(locationBtn);

        expect(toast.error).toHaveBeenCalledWith("Geolocalización no soportada");
    });

    it("handles creating an event successfully", async () => {
        // Start with no active event
        (fetchApi as any).mockImplementation(async (path: string) => {
            if (path.includes("/api/eventos/activo/")) return { ok: false };
            return { ok: true, json: async () => ({}) };
        });

        render(<EventManager />);
        await waitFor(() => {
            expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument();
        });

        // Get location first
        const locationBtn = screen.getByRole("button", { name: /usar mi ubicación/i });
        const mockPosition = { coords: { latitude: 4.6, longitude: -74.0 } };
        (navigator.geolocation.getCurrentPosition as any).mockImplementationOnce((success: any) =>
            success(mockPosition)
        );
        fireEvent.click(locationBtn);

        // Fill out title
        const titleInput = screen.getByLabelText(/nombre de discoteca o evento/i);
        fireEvent.change(titleInput, { target: { value: "New Party" } });

        // Fill out description
        const descInput = screen.getByLabelText(/descripción \(opcional\)/i);
        fireEvent.change(descInput, { target: { value: "Free Drinks" } });

        // Iniciar button should be enabled now
        const submitBtn = screen.getByRole("button", { name: /iniciar evento/i });
        expect(submitBtn).not.toBeDisabled();

        // Mock the POST request for event creation
        const newMockEvent = {
            id: "event-999",
            titulo: "New Party",
            descripcion: "Free Drinks",
            horaInicio: "2026-05-27T11:00:00.000Z",
        };
        (fetchApi as any).mockImplementationOnce(async (path: string, options: any) => {
            expect(path).toBe("/api/eventos");
            expect(options.method).toBe("POST");
            expect(JSON.parse(options.body)).toEqual({
                artistaId: "artist-123",
                titulo: "New Party",
                descripcion: "Free Drinks",
                latitud: 4.6,
                longitud: -74.0,
            });
            return {
                ok: true,
                json: async () => newMockEvent,
            };
        });

        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Evento iniciado exitosamente");
            expect(screen.getByText("New Party")).toBeInTheDocument();
            expect(screen.getByText("Free Drinks")).toBeInTheDocument();
        });
    });

    it("handles event creation errors: title validation, location validation, API failure, and Exception", async () => {
        // Start with no active event
        (fetchApi as any).mockImplementation(async (path: string) => {
            if (path.includes("/api/eventos/activo/")) return { ok: false };
            return { ok: true, json: async () => ({}) };
        });

        render(<EventManager />);
        await waitFor(() => {
            expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument();
        });

        expect(screen.getByText("Completa el título y la ubicación")).toBeInTheDocument();

        // 1. Title but no location
        const titleInput = screen.getByLabelText(/nombre de discoteca o evento/i);
        fireEvent.change(titleInput, { target: { value: "Some Title" } });
        expect(screen.getByText("La ubicación es obligatoria")).toBeInTheDocument();

        const locationBtn = screen.getByRole("button", { name: /usar mi ubicación/i });
        const mockPosition = { coords: { latitude: 4.6, longitude: -74.0 } };
        (navigator.geolocation.getCurrentPosition as any).mockImplementationOnce((success: any) =>
            success(mockPosition)
        );
        fireEvent.click(locationBtn);

        // Now we have title and location, the button is enabled!
        const submitBtn = screen.getByRole("button", { name: /iniciar evento/i });
        expect(submitBtn).not.toBeDisabled();

        // Mock API failure (ok: false)
        (fetchApi as any).mockResolvedValueOnce({ ok: false });
        fireEvent.click(submitBtn);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al iniciar evento");
        });

        // Mock network exception (throw)
        (fetchApi as any).mockRejectedValueOnce(new Error("Network Error"));
        fireEvent.click(submitBtn);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error de conexión");
        });
    });

    it("handles ending an active event successfully", async () => {
        render(<EventManager />);
        await waitFor(() => {
            expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument();
        });

        const endEventBtn = screen.getByRole("button", { name: /finalizar evento/i });
        expect(endEventBtn).toBeInTheDocument();

        // Mock API response for finalizing event
        (fetchApi as any).mockImplementationOnce(async (path: string, options: any) => {
            expect(path).toBe("/api/eventos/event-456/finalizar");
            expect(options.method).toBe("PATCH");
            return { ok: true };
        });

        fireEvent.click(endEventBtn);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Evento finalizado");
            // Form to create new event should be visible
            expect(screen.getByLabelText(/nombre de discoteca o evento/i)).toBeInTheDocument();
        });
    });

    it("handles error when ending an active event fails", async () => {
        render(<EventManager />);
        await waitFor(() => {
            expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument();
        });

        const endEventBtn = screen.getByRole("button", { name: /finalizar evento/i });

        // Mock API response fails
        (fetchApi as any).mockResolvedValueOnce({ ok: false });
        fireEvent.click(endEventBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al finalizar evento");
        });

        // Mock API response network throw
        (fetchApi as any).mockRejectedValueOnce(new Error("Timeout"));
        fireEvent.click(endEventBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error de conexión");
        });
    });

    it("handles toggling pedidosActivos successfully", async () => {
        render(<EventManager />);
        await waitFor(() => {
            expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument();
        });

        const switchToggle = screen.getByRole("switch");
        expect(switchToggle).toBeInTheDocument();
        expect(screen.getByText("ON")).toBeInTheDocument();

        // Toggle from ON to OFF
        (fetchApi as any).mockImplementationOnce(async (path: string, options: any) => {
            expect(path).toBe("/api/usuarios/perfil/pedidos");
            expect(options.method).toBe("PATCH");
            expect(JSON.parse(options.body)).toEqual({
                artistaId: "artist-123",
                activo: false,
            });
            return {
                ok: true,
                json: async () => ({ pedidosActivos: false }),
            };
        });

        fireEvent.click(switchToggle);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Pedidos desactivados");
            expect(screen.getByText("OFF")).toBeInTheDocument();
        });

        // Toggle from OFF to ON
        (fetchApi as any).mockImplementationOnce(async (path: string, options: any) => {
            return {
                ok: true,
                json: async () => ({ pedidosActivos: true }),
            };
        });

        fireEvent.click(switchToggle);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Pedidos activados");
            expect(screen.getByText("ON")).toBeInTheDocument();
        });
    });

    it("handles errors when toggling active requests fails", async () => {
        render(<EventManager />);
        await waitFor(() => {
            expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument();
        });

        const switchToggle = screen.getByRole("switch");

        // 1. API error
        (fetchApi as any).mockResolvedValueOnce({ ok: false });
        fireEvent.click(switchToggle);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al actualizar estado de pedidos");
        });

        // 2. Exception
        (fetchApi as any).mockRejectedValueOnce(new Error("Conn lost"));
        fireEvent.click(switchToggle);
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error de conexión");
        });

        // 3. Server returns unexpected state (pedidosActivos value doesn't match toggled value)
        (fetchApi as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ pedidosActivos: true }), // remains true even though toggled to false
        });
        fireEvent.click(switchToggle);
        await waitFor(() => {
            expect(toast.warning).toHaveBeenCalledWith("El servidor devolvió un estado inesperado.");
        });
    });

    it("handles toggle error when session user is missing", async () => {
        // Render first with valid session to successfully fetch active event and render Switch
        (useSession as any).mockReturnValue({
            data: { user: mockUser },
        });

        const { rerender } = render(<EventManager />);

        await waitFor(() => {
            expect(screen.getByText("Mi Gran Evento")).toBeInTheDocument();
        });

        // Now mock useSession to return empty/missing user
        (useSession as any).mockReturnValue({
            data: { user: {} },
        });

        // Re-render to propagate the mock session change
        rerender(<EventManager />);

        // Try toggling pedidos now
        const switchToggle = screen.getByRole("switch");
        fireEvent.click(switchToggle);

        expect(toast.error).toHaveBeenCalledWith("Error de sesión: No se identificó al artista");
    });

    it("triggers onEventChange callback when activeEvent changes", async () => {
        const onEventChangeMock = vi.fn();
        
        render(<EventManager onEventChange={onEventChangeMock} />);

        await waitFor(() => {
            expect(onEventChangeMock).toHaveBeenCalledWith(mockEvent);
        });
    });

    it("handles create event validation when missing title or location via direct click", async () => {
        // Start with no active event
        (fetchApi as any).mockImplementation(async (path: string) => {
            if (path.includes("/api/eventos/activo/")) return { ok: false };
            return { ok: true, json: async () => ({}) };
        });

        render(<EventManager />);
        await waitFor(() => {
            expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument();
        });

        const invokeOnClick = (el: HTMLElement) => {
            const keys = Object.keys(el);
            // Try __reactProps first as they contain the direct, committed props in React
            for (const key of keys) {
                if (key.startsWith("__reactProps")) {
                    const val = (el as any)[key];
                    if (val && typeof val.onClick === "function") {
                        val.onClick({ preventDefault: () => {} });
                        return;
                    }
                }
            }
            // Fallback to __reactFiber
            for (const key of keys) {
                if (key.startsWith("__reactFiber")) {
                    const val = (el as any)[key];
                    if (val && val.memoizedProps && typeof val.memoizedProps.onClick === "function") {
                        val.memoizedProps.onClick({ preventDefault: () => {} });
                        return;
                    }
                }
            }
            fireEvent.click(el);
        };

        // 1. Missing both title and location
        const submitBtn = screen.getByRole("button", { name: /iniciar evento/i });
        invokeOnClick(submitBtn);
        expect(toast.error).toHaveBeenCalledWith("El título es obligatorio");

        // 2. Set title but keep location missing
        const titleInput = screen.getByLabelText(/nombre de discoteca o evento/i);
        fireEvent.change(titleInput, { target: { value: "My Great Event" } });
        
        // Wait for the UI to re-render with the updated validation message
        await screen.findByText("La ubicación es obligatoria");
        
        const submitBtn2 = screen.getByRole("button", { name: /iniciar evento/i });
        invokeOnClick(submitBtn2);
        expect(toast.error).toHaveBeenCalledWith("La ubicación es obligatoria");
    });
});
