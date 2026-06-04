import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventManager } from "../EventManager";
import { useSession } from "next-auth/react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

vi.mock("next-auth/react", () => ({ useSession: vi.fn() }));
vi.mock("@/lib/api", () => ({ fetchApi: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

describe("EventManager", () => {
  const mockEvent = {
    id: "evt-1",
    titulo: "Test Event",
    horaInicio: "2023-01-01T00:00:00Z"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1", perfilArtista: { id: "artist-1" } } } });
    const mockGeolocation = { getCurrentPosition: vi.fn() };
    Object.defineProperty(global.navigator, "geolocation", { value: mockGeolocation, writable: true, configurable: true });
  });

  const setupInactiveEvent = () => {
    (fetchApi as any).mockImplementation(async (path: string) => {
      if (path.includes("/api/eventos/activo/")) return { ok: false };
      return { ok: true, json: async () => ({}) };
    });
  };

  const setupActiveEvent = () => {
    (fetchApi as any).mockImplementation(async (path: string) => {
      if (path.includes("/api/eventos/activo/")) return { ok: true, json: async () => mockEvent };
      if (path.includes("/api/usuarios/perfil/")) return { ok: true, json: async () => ({ perfilArtista: { pedidosActivos: true } }) };
      return { ok: true, json: async () => ({}) };
    });
  };

  it("shows 'Ingresa un título' warning when location is set but title is empty", async () => {
    setupInactiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument());

    const locationBtn = screen.getByRole("button", { name: /usar mi ubicación/i });
    const mockPosition = { coords: { latitude: 4.6, longitude: -74.0 } };
    (navigator.geolocation.getCurrentPosition as any).mockImplementationOnce((success: any) => success(mockPosition));
    await userEvent.click(locationBtn);

    expect(screen.getByText("Ingresa un título")).toBeInTheDocument();
  });

  it("shows 'La ubicación es obligatoria' when title is set but location is not", async () => {
    setupInactiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument());

    const titleInput = screen.getByLabelText(/Nombre de discoteca o evento/i);
    await userEvent.type(titleInput, "My Event");

    expect(screen.getByText("La ubicación es obligatoria")).toBeInTheDocument();
  });

  it("handles geolocation not supported", async () => {
    setupInactiveEvent();
    Object.defineProperty(global.navigator, "geolocation", { value: undefined, writable: true, configurable: true });
    
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument());

    const locationBtn = screen.getByRole("button", { name: /usar mi ubicación/i });
    await userEvent.click(locationBtn);

    expect(toast.error).toHaveBeenCalledWith("Geolocalización no soportada");
  });

  it("handles geolocation error", async () => {
    setupInactiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument());

    const locationBtn = screen.getByRole("button", { name: /usar mi ubicación/i });
    (navigator.geolocation.getCurrentPosition as any).mockImplementationOnce((_, error: any) => error(new Error("geo err")));
    await userEvent.click(locationBtn);

    expect(toast.error).toHaveBeenCalledWith("No se pudo obtener la ubicación");
  });

  it("creates an event successfully", async () => {
    setupInactiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument());

    const titleInput = screen.getByLabelText(/Nombre de discoteca o evento/i);
    await userEvent.type(titleInput, "My Event");

    const locationBtn = screen.getByRole("button", { name: /usar mi ubicación/i });
    const mockPosition = { coords: { latitude: 4.6, longitude: -74.0 } };
    (navigator.geolocation.getCurrentPosition as any).mockImplementationOnce((success: any) => success(mockPosition));
    await userEvent.click(locationBtn);

    // Mock create event
    (fetchApi as any).mockResolvedValueOnce({ ok: true, json: async () => mockEvent });

    const createBtn = screen.getByRole("button", { name: /Iniciar Evento/i });
    await userEvent.click(createBtn);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Evento iniciado exitosamente"));
  });

  it("fails to create event when api returns error", async () => {
    setupInactiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument());

    const titleInput = screen.getByLabelText(/Nombre de discoteca o evento/i);
    await userEvent.type(titleInput, "My Event");

    const mockPosition = { coords: { latitude: 4.6, longitude: -74.0 } };
    (navigator.geolocation.getCurrentPosition as any).mockImplementationOnce((success: any) => success(mockPosition));
    await userEvent.click(screen.getByRole("button", { name: /usar mi ubicación/i }));

    (fetchApi as any).mockResolvedValueOnce({ ok: false });
    await userEvent.click(screen.getByRole("button", { name: /Iniciar Evento/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error al iniciar evento"));
  });

  it("ends an event successfully", async () => {
    setupActiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Test Event")).toBeInTheDocument());

    (fetchApi as any).mockResolvedValueOnce({ ok: true });
    
    const endBtn = screen.getByRole("button", { name: /Finalizar Evento/i });
    await userEvent.click(endBtn);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Evento finalizado"));
  });

  it("toggles pedidos successfully", async () => {
    setupActiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Test Event")).toBeInTheDocument());

    // Should be checked initially based on setupActiveEvent profile data
    const switchEl = screen.getByRole("switch");
    
    (fetchApi as any).mockResolvedValueOnce({ ok: true, json: async () => ({ pedidosActivos: false }) });
    
    fireEvent.click(switchEl);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Pedidos desactivados");
    });
  });

  it("handles toggles pedidos warning when server state differs", async () => {
    setupActiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Test Event")).toBeInTheDocument());

    const switchEl = screen.getByRole("switch");
    
    // Server returns true instead of false
    (fetchApi as any).mockResolvedValueOnce({ ok: true, json: async () => ({ pedidosActivos: true }) });
    
    fireEvent.click(switchEl);
    
    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith("El servidor devolvió un estado inesperado.");
    });
  });

  it("fails to end event when api returns error", async () => {
    setupActiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Test Event")).toBeInTheDocument());

    (fetchApi as any).mockResolvedValueOnce({ ok: false });
    await userEvent.click(screen.getByRole("button", { name: /Finalizar Evento/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error al finalizar evento"));
  });

  it("handles catch error on end event", async () => {
    setupActiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Test Event")).toBeInTheDocument());

    (fetchApi as any).mockRejectedValueOnce(new Error("Network err"));
    await userEvent.click(screen.getByRole("button", { name: /Finalizar Evento/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error de conexión"));
  });

  it("handles toggles pedidos network error", async () => {
    setupActiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Test Event")).toBeInTheDocument());

    const switchEl = screen.getByRole("switch");
    (fetchApi as any).mockRejectedValueOnce(new Error("Network err"));
    fireEvent.click(switchEl);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error de conexión");
    });
  });

  it("handles toggles pedidos api error", async () => {
    setupActiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Test Event")).toBeInTheDocument());

    const switchEl = screen.getByRole("switch");
    (fetchApi as any).mockResolvedValueOnce({ ok: false });
    fireEvent.click(switchEl);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al actualizar estado de pedidos");
    });
  });

    it("updates description input", async () => {
        setupInactiveEvent();
        render(<EventManager />);
        await waitFor(() => expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument());
        
        const descInput = screen.getByLabelText(/Descripción \(Opcional\)/i);
        await userEvent.type(descInput, "Desc");
        expect(descInput).toHaveValue("Desc");
    });

    it("handles toggles pedidos when session artistId is missing", async () => {
        setupActiveEvent();
        const { rerender } = render(<EventManager />);
        await waitFor(() => expect(screen.getByText("Test Event")).toBeInTheDocument());

        const switchEl = screen.getByRole("switch");
        
        // Mock session with no artist ID
        (useSession as any).mockReturnValue({ data: { user: {} } });
        
        // Rerender component to apply new session
        rerender(<EventManager />);
        
        fireEvent.click(switchEl);
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error de sesión: No se identificó al artista");
        });
    });

    it("handles catch error on create event", async () => {
        setupInactiveEvent();
        render(<EventManager />);
        await waitFor(() => expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument());

        const titleInput = screen.getByLabelText(/Nombre de discoteca o evento/i);
        await userEvent.type(titleInput, "My Event");

        const mockPosition = { coords: { latitude: 4.6, longitude: -74.0 } };
        (navigator.geolocation.getCurrentPosition as any).mockImplementationOnce((success: any) => success(mockPosition));
        await userEvent.click(screen.getByRole("button", { name: /usar mi ubicación/i }));

        (fetchApi as any).mockRejectedValueOnce(new Error("Network err"));
        await userEvent.click(screen.getByRole("button", { name: /Iniciar Evento/i }));

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error de conexión"));
    });

    it("shows location error when creating event without location (bypassing disabled)", async () => {
        setupInactiveEvent();
        render(<EventManager />);
        await waitFor(() => expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument());

        const titleInput = screen.getByLabelText(/Nombre de discoteca o evento/i);
        await userEvent.type(titleInput, "My Event");

        const createBtn = screen.getByRole("button", { name: /Iniciar Evento/i });
        
        let clicked = false;
        for (const key of Object.keys(createBtn)) {
            if (key.startsWith("__reactProps$")) {
                const onClick = (createBtn as any)[key]?.onClick;
                if (onClick) {
                    onClick({ preventDefault: () => {}, stopPropagation: () => {} });
                    clicked = true;
                    break;
                }
            }
            if (key.startsWith("__reactFiber$")) {
                const onClick = (createBtn as any)[key]?.memoizedProps?.onClick;
                if (onClick) {
                    onClick({ preventDefault: () => {}, stopPropagation: () => {} });
                    clicked = true;
                    break;
                }
            }
        }

        if (!clicked) {
            const propsKey = Object.keys(createBtn).find(k => k.startsWith('__react'));
            if (propsKey) {
                const props = (createBtn as any)[propsKey];
                const onClick = props?.onClick || props?.children?.props?.onClick;
                if (onClick) {
                    onClick({ preventDefault: () => {}, stopPropagation: () => {} });
                }
            }
        }

        expect(toast.error).toHaveBeenCalledWith("La ubicación es obligatoria");
  });

  it("handles catch error on initial load", async () => {
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    (fetchApi as any).mockRejectedValueOnce(new Error("Initial load fetch rejection"));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<EventManager />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching event state:", expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it("supports callback onEventChange when event becomes active", async () => {
    setupActiveEvent();
    const mockOnEventChange = vi.fn();
    render(<EventManager onEventChange={mockOnEventChange} />);
    
    await waitFor(() => {
      expect(mockOnEventChange).toHaveBeenCalledWith(expect.objectContaining({ id: "evt-1" }));
    });
  });

  it("shows title validation warning when creating event with location but empty title (bypassing disabled)", async () => {
    setupInactiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument());

    // set location but not title
    const locationBtn = screen.getByRole("button", { name: /usar mi ubicación/i });
    const mockPosition = { coords: { latitude: 4.6, longitude: -74.0 } };
    (navigator.geolocation.getCurrentPosition as any).mockImplementationOnce((success: any) => success(mockPosition));
    await userEvent.click(locationBtn);

    const createBtn = screen.getByRole("button", { name: /Iniciar Evento/i });
    
    // trigger click prop bypassing disabled
    let clicked = false;
    for (const key of Object.keys(createBtn)) {
        if (key.startsWith("__reactProps$") || key.startsWith("__reactFiber$")) {
            const onClick = (createBtn as any)[key]?.onClick || (createBtn as any)[key]?.memoizedProps?.onClick;
            if (onClick) {
                onClick({ preventDefault: () => {}, stopPropagation: () => {} });
                clicked = true;
                break;
            }
        }
    }
    if (!clicked) {
        const propsKey = Object.keys(createBtn).find(k => k.startsWith('__react'));
        if (propsKey) {
            const props = (createBtn as any)[propsKey];
            const onClick = props?.onClick || props?.children?.props?.onClick;
            if (onClick) {
                onClick({ preventDefault: () => {}, stopPropagation: () => {} });
            }
        }
    }

    expect(toast.error).toHaveBeenCalledWith("El título es obligatorio");
  });

  it("toggles pedidos successfully to active (checked: true)", async () => {
    (fetchApi as any).mockImplementation(async (path: string) => {
      if (path.includes("/api/eventos/activo/")) return { ok: true, json: async () => mockEvent };
      if (path.includes("/api/usuarios/perfil/")) return { ok: true, json: async () => ({ perfilArtista: { pedidosActivos: false } }) };
      return { ok: true, json: async () => ({}) };
    });
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Test Event")).toBeInTheDocument());

    const switchEl = screen.getByRole("switch");
    
    (fetchApi as any).mockResolvedValueOnce({ ok: true, json: async () => ({ pedidosActivos: true }) });
    
    fireEvent.click(switchEl);
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Pedidos activados");
    });
  });

  it("renders active event with description", async () => {
    (fetchApi as any).mockImplementation(async (path: string) => {
      if (path.includes("/api/eventos/activo/")) return { ok: true, json: async () => ({ ...mockEvent, descripcion: "Mock description" }) };
      return { ok: true, json: async () => ({}) };
    });
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Test Event")).toBeInTheDocument());
    expect(screen.getByText("Mock description")).toBeInTheDocument();
  });

  it("shows loading state and Listo state during geolocation loading", async () => {
    setupInactiveEvent();
    render(<EventManager />);
    await waitFor(() => expect(screen.getByText("Gestor de Eventos")).toBeInTheDocument());

    const locationBtn = screen.getByRole("button", { name: /usar mi ubicación/i });
    
    (navigator.geolocation.getCurrentPosition as any).mockImplementationOnce((success: any) => {
      setTimeout(() => success({ coords: { latitude: 4.6, longitude: -74.0 } }), 50);
    });

    fireEvent.click(locationBtn);

    // immediately disabled
    expect(locationBtn).toBeDisabled();

    // resolves
    await waitFor(() => {
      expect(screen.getByText("Listo")).toBeInTheDocument();
    });
  });

  it("does not fetch state if session has no user or user has no id", async () => {
    (useSession as any).mockReturnValue({ data: { user: null } });
    render(<EventManager />);
    expect(fetchApi).not.toHaveBeenCalled();

    (useSession as any).mockReturnValue({ data: { user: { id: null } } });
    render(<EventManager />);
    await waitFor(() => {
      expect(fetchApi).not.toHaveBeenCalledWith(expect.stringContaining("/api/usuarios/perfil/"));
    });
  });

  it("handles completely null session data", async () => {
    (useSession as any).mockReturnValue({ data: null });
    render(<EventManager />);
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it("covers all optional chaining branches for session", async () => {
    // session is undefined
    (useSession as any).mockReturnValue({ data: undefined });
    render(<EventManager />);
    expect(fetchApi).not.toHaveBeenCalled();

    // session.user is undefined
    (useSession as any).mockReturnValue({ data: {} });
    render(<EventManager />);
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it("handles profile API error gracefully", async () => {
    (useSession as any).mockReturnValue({ data: { user: { id: "user-1" } } });
    (fetchApi as any).mockImplementation(async (path: string) => {
      if (path.includes("/api/eventos/activo/")) return { ok: false };
      if (path.includes("/api/usuarios/perfil/")) return { ok: false };
      return { ok: true };
    });
    render(<EventManager />);
    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith(expect.stringContaining("/api/usuarios/perfil/"), expect.any(Object));
    });
  });

  it("handles when perfilArtista.id is present but user.id is missing", async () => {
    (useSession as any).mockReturnValue({
      data: {
        user: {
          id: null,
          perfilArtista: { id: "artist-1" }
        }
      }
    });
    (fetchApi as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    render(<EventManager />);
    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith(expect.stringContaining("/api/eventos/activo/"), expect.any(Object));
      expect(fetchApi).not.toHaveBeenCalledWith(expect.stringContaining("/api/usuarios/perfil/"));
    });
  });
});
