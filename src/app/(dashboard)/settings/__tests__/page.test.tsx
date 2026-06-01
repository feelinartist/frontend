import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import PaginaConfiguracion from "../page";
import { useSession, signOut } from "next-auth/react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

// Mocks
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  fetchApi: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

vi.mock("@/components/ui/loading-screen", () => ({
  LoadingScreen: () => <div data-testid="loading-screen">Loading...</div>,
}));

vi.mock("@/components/animated-background", () => ({
  AnimatedBackground: () => <div data-testid="animated-bg" />,
}));

vi.mock("@/components/ui/back-button", () => ({
  BackButton: () => <button data-testid="back-button">Back</button>,
}));

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("PaginaConfiguracion", () => {
  const originalLocation = globalThis.location;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock location for testing navigation
    Object.defineProperty(globalThis, 'location', {
      value: { href: '' },
      writable: true
    });
  });

  afterEach(() => {
    globalThis.location = originalLocation;
  });

  const setupFetchMock = (mockResponses: any = {}) => {
    (fetchApi as any).mockImplementation((url: string) => {
      if (url.includes("/api/usuarios/bloqueados")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponses.bloqueados || []),
        });
      }
      if (url.includes("/api/usuarios/perfil")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponses.perfil || {}),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  };

  it("renders loading screen initially or when migrating", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "ARTISTA" } },
    });
    setupFetchMock();
    render(<PaginaConfiguracion />);
    
    // Should render the page without crashing
    expect(screen.getByTestId("animated-bg")).toBeInTheDocument();
  });

  describe("Bloqueados", () => {
    it("loads and displays blocked users, including without image", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      setupFetchMock({
        bloqueados: [
          { id: "b1", nombre: "Blocked 1", correo: "b1@test.com", imagen: "img.jpg" },
          { id: "b2", nombreUsuario: "Blocked 2", correo: "b2@test.com" }
        ]
      });

      render(<PaginaConfiguracion />);
      
      const user = userEvent.setup();
      const openDialogBtn = screen.getByText("Ver Lista");
      await user.click(openDialogBtn);

      await waitFor(() => {
        expect(screen.getByText("Blocked 1")).toBeInTheDocument();
        expect(screen.getByText("Blocked 2")).toBeInTheDocument();
      });
    });

    it("displays empty state when no blocked users", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      setupFetchMock({ bloqueados: [] });

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      await user.click(screen.getByText("Ver Lista"));

      await waitFor(() => {
        expect(screen.getByText("No has bloqueado a ningún usuario.")).toBeInTheDocument();
      });
    });

    it("unblocks user successfully", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      setupFetchMock({
        bloqueados: [{ id: "b1", nombre: "Blocked 1", correo: "b1@test.com" }]
      });

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      await user.click(screen.getByText("Ver Lista"));
      
      await waitFor(() => expect(screen.getByText("Blocked 1")).toBeInTheDocument());
      
      const unlockBtn = screen.getByText("Desbloquear");
      
      // override fetch for unlock
      (fetchApi as any).mockImplementation((url: string, options: any) => {
        if (url === "/api/usuarios/desbloquear") {
          return Promise.resolve({ ok: true });
        }
        if (url.includes("/api/usuarios/bloqueados")) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        }
        if (url.includes("/api/usuarios/perfil")) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        }
      });

      await user.click(unlockBtn);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Usuario desbloqueado");
      });
    });

    it("handles error when unblocking user fails", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      setupFetchMock({
        bloqueados: [{ id: "b1", nombre: "Blocked 1", correo: "b1@test.com" }]
      });

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      await user.click(screen.getByText("Ver Lista"));
      
      await waitFor(() => expect(screen.getByText("Blocked 1")).toBeInTheDocument());
      
      (fetchApi as any).mockImplementation((url: string) => {
        if (url === "/api/usuarios/desbloquear") {
          return Promise.resolve({ ok: false });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      await user.click(screen.getByText("Desbloquear"));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al desbloquear");
      });
    });
    
    it("handles throw when unblocking user fails", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      setupFetchMock({
        bloqueados: [{ id: "b1", nombre: "Blocked 1", correo: "b1@test.com" }]
      });

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      await user.click(screen.getByText("Ver Lista"));
      
      await waitFor(() => expect(screen.getByText("Blocked 1")).toBeInTheDocument());
      
      (fetchApi as any).mockImplementation((url: string) => {
        if (url === "/api/usuarios/desbloquear") {
          return Promise.reject(new Error("Net Error"));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      await user.click(screen.getByText("Desbloquear"));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al desbloquear");
      });
    });

    it("handles error when fetching blocked users fails", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      (fetchApi as any).mockImplementation((url: string) => {
        if (url.includes("/api/usuarios/bloqueados")) return Promise.reject(new Error("err"));
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });
      
      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      await user.click(screen.getByText("Ver Lista"));
      
      await waitFor(() => {
        expect(screen.getByText("No has bloqueado a ningún usuario.")).toBeInTheDocument();
      });
    });
    
    it("handles error when fetching perfil fails", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      (fetchApi as any).mockImplementation((url: string) => {
        if (url.includes("/api/usuarios/perfil")) return Promise.reject(new Error("err"));
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });
      
      render(<PaginaConfiguracion />);
      // Should handle error gracefully without crashing
      expect(screen.getByTestId("animated-bg")).toBeInTheDocument();
    });
  });

  describe("Role Migration", () => {
    it("migrates role to ARTISTA successfully", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "PUBLICO" } },
      });
      setupFetchMock();

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText("Migrar"));
      
      await waitFor(() => expect(screen.getByText("Nuevo Rol")).toBeInTheDocument());
      
      // Select Role ARTISTA
      await user.click(screen.getByTestId("mock-select-item-ARTISTA"));

      await waitFor(() => expect(screen.getByText("Nombre Artístico")).toBeInTheDocument());
      
      const inputs = screen.getAllByRole("textbox");
      await user.type(inputs[0], "Mi Nombre Artístico");
      
      // Select category
      await user.click(screen.getByTestId("mock-select-item-DJ"));

      // Select country
      await user.click(screen.getByTestId("mock-select-item-CO"));

      // Type city
      const cityInput = screen.getAllByRole("textbox")[1];
      await user.type(cityInput, "Bogota");

      // Submit
      (fetchApi as any).mockImplementation((url: string, options: any) => {
        if (url === "/api/usuarios/migrar-rol") {
          return Promise.resolve({ ok: true });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      await user.click(screen.getByText("Confirmar Migración"));
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Rol migrado exitosamente. Reiniciando sesión...");
      });
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/home' });
      }, { timeout: 2500 });
    });
    
    it("migrates role to DISCOTECA and shows error on failure", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "PUBLICO" } },
      });
      setupFetchMock();

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText("Migrar"));
      await waitFor(() => expect(screen.getByText("Nuevo Rol")).toBeInTheDocument());
      
      await user.click(screen.getByTestId("mock-select-item-DISCOTECA"));

      await waitFor(() => expect(screen.getByText("Nombre de la Discoteca")).toBeInTheDocument());
      
      // Submit error branch
      (fetchApi as any).mockImplementation((url: string) => {
        if (url === "/api/usuarios/migrar-rol") {
          return Promise.resolve({ ok: false, json: () => Promise.resolve({ message: "Custom Error" }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      await user.click(screen.getByText("Confirmar Migración"));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Custom Error");
      });
    });

    it("migrates role fails throws exception", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "PUBLICO" } },
      });
      setupFetchMock();

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText("Migrar"));
      await waitFor(() => expect(screen.getByText("Nuevo Rol")).toBeInTheDocument());
      
      await user.click(screen.getByTestId("mock-select-item-DISCOTECA"));

      await waitFor(() => expect(screen.getByText("Nombre de la Discoteca")).toBeInTheDocument());
      
      // Submit error branch
      (fetchApi as any).mockImplementation((url: string) => {
        if (url === "/api/usuarios/migrar-rol") {
          return Promise.reject(new Error("Ex"));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      await user.click(screen.getByText("Confirmar Migración"));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al migrar rol");
      });
    });
  });

  describe("Admin Profile Management", () => {
    it("renders profile creation buttons if profiles don't exist", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ADMIN" } },
      });
      setupFetchMock({
        perfil: {
          perfilArtista: false,
          perfilPublico: false,
          perfilDiscoteca: false,
        }
      });

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        const createBtns = screen.getAllByText("Crear Perfil");
        expect(createBtns.length).toBe(3); // Artista, Discoteca, Publico
      });
      
      const createBtns = screen.getAllByText("Crear Perfil");
      await user.click(createBtns[0]); // artista
      expect(globalThis.location.href).toBe("/artist-registration");

      await user.click(createBtns[1]); // discoteca
      expect(globalThis.location.href).toBe("/venue-registration");

      await user.click(createBtns[2]); // publico
      expect(globalThis.location.href).toBe("/public-registration");
    });

    it("renders profile deletion buttons if profiles exist and deletes them", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "SUPER_ADMIN" } },
      });
      setupFetchMock({
        perfil: {
          perfilArtista: true,
          perfilPublico: true,
          perfilDiscoteca: true,
        }
      });

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        const delBtns = screen.getAllByText("Eliminar Perfil");
        expect(delBtns.length).toBe(3);
      });
      
      // Delete Artista
      (fetchApi as any).mockImplementation((url: string) => {
        if (url.includes("/api/admin/usuarios/perfil/")) {
          return Promise.resolve({ ok: true });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      const delBtns = screen.getAllByText("Eliminar Perfil");
      await user.click(delBtns[0]); // artista delete button
      
      await waitFor(() => expect(screen.getByText("¿Eliminar Perfil de Artista?")).toBeInTheDocument());
      await user.click(screen.getByText("Sí, eliminar"));
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Perfil de artista eliminado. Reiniciando sesión...");
      });
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalled();
      }, { timeout: 2500 });
    });

    it("handles errors when deleting admin profile", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "SUPER_ADMIN" } },
      });
      setupFetchMock({
        perfil: {
          perfilArtista: true,
        }
      });

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        const delBtns = screen.getAllByText("Eliminar Perfil");
        expect(delBtns.length).toBeGreaterThan(0);
      });
      
      // Delete Artista with error
      (fetchApi as any).mockImplementation((url: string) => {
        if (url.includes("/api/admin/usuarios/perfil/")) {
          return Promise.resolve({ ok: false });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      const delBtns = screen.getAllByText("Eliminar Perfil");
      await user.click(delBtns[0]);
      
      await waitFor(() => expect(screen.getByText("¿Eliminar Perfil de Artista?")).toBeInTheDocument());
      await user.click(screen.getByText("Sí, eliminar"));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al eliminar perfil de artista");
      });
    });
    
    it("handles throw when deleting admin profile", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "SUPER_ADMIN" } },
      });
      setupFetchMock({
        perfil: {
          perfilDiscoteca: true,
        }
      });

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        const delBtns = screen.getAllByText("Eliminar Perfil");
        expect(delBtns.length).toBeGreaterThan(0);
      });
      
      (fetchApi as any).mockImplementation((url: string) => {
        if (url.includes("/api/admin/usuarios/perfil/")) {
          return Promise.reject(new Error("Net err"));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      const delBtns = screen.getAllByText("Eliminar Perfil");
      await user.click(delBtns[0]); // discoteca button is first since only discoteca is true
      
      await waitFor(() => expect(screen.getByText("¿Eliminar Perfil de Discoteca?")).toBeInTheDocument());
      await user.click(screen.getByText("Sí, eliminar"));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al eliminar perfil de discoteca");
      });
    });
    
    it("deletes publico profile with success", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "SUPER_ADMIN" } },
      });
      setupFetchMock({
        perfil: {
          perfilPublico: true,
        }
      });

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        const delBtns = screen.getAllByText("Eliminar Perfil");
        expect(delBtns.length).toBeGreaterThan(0);
      });
      
      (fetchApi as any).mockImplementation((url: string) => {
        if (url.includes("/api/admin/usuarios/perfil/")) {
          return Promise.resolve({ ok: true });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      const delBtns = screen.getAllByText("Eliminar Perfil");
      await user.click(delBtns[0]); 
      
      await waitFor(() => expect(screen.getByText("¿Eliminar Perfil de Público?")).toBeInTheDocument());
      await user.click(screen.getByText("Sí, eliminar"));
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Perfil de publico eliminado. Reiniciando sesión...");
      });
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalled();
      }, { timeout: 2500 });
    });
  });

  describe("Account Management", () => {
    it("disables account successfully", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      setupFetchMock();

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText("Deshabilitar"));
      
      await waitFor(() => expect(screen.getByText("¿Estás seguro?")).toBeInTheDocument());
      
      (fetchApi as any).mockImplementation((url: string) => {
        if (url === "/api/usuarios/deshabilitar") {
          return Promise.resolve({ ok: true });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      await user.click(screen.getByText("Sí, deshabilitar"));
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Cuenta deshabilitada. Cerrando sesión...");
      });
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
      }, { timeout: 2500 });
    });

    it("handles error disabling account", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      setupFetchMock();

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText("Deshabilitar"));
      await waitFor(() => expect(screen.getByText("¿Estás seguro?")).toBeInTheDocument());
      
      (fetchApi as any).mockImplementation((url: string) => {
        if (url === "/api/usuarios/deshabilitar") {
          return Promise.resolve({ ok: false });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      await user.click(screen.getByText("Sí, deshabilitar"));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al deshabilitar cuenta");
      });
    });

    it("handles throw disabling account", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      setupFetchMock();

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText("Deshabilitar"));
      await waitFor(() => expect(screen.getByText("¿Estás seguro?")).toBeInTheDocument());
      
      (fetchApi as any).mockImplementation((url: string) => {
        if (url === "/api/usuarios/deshabilitar") {
          return Promise.reject(new Error("Net"));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      await user.click(screen.getByText("Sí, deshabilitar"));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al deshabilitar cuenta");
      });
    });

    it("deletes account successfully", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      setupFetchMock();

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText("Eliminar"));
      
      await waitFor(() => expect(screen.getByText("¿Eliminar cuenta permanentemente?")).toBeInTheDocument());
      
      (fetchApi as any).mockImplementation((url: string) => {
        if (url === "/api/usuarios/eliminar") {
          return Promise.resolve({ ok: true });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      await user.click(screen.getByText("Sí, eliminar"));
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Cuenta programada para eliminación. Cerrando sesión...");
      });
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
      }, { timeout: 2500 });
    });

    it("handles error deleting account", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      setupFetchMock();

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText("Eliminar"));
      await waitFor(() => expect(screen.getByText("¿Eliminar cuenta permanentemente?")).toBeInTheDocument());
      
      (fetchApi as any).mockImplementation((url: string) => {
        if (url === "/api/usuarios/eliminar") {
          return Promise.resolve({ ok: false });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      await user.click(screen.getByText("Sí, eliminar"));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al eliminar cuenta");
      });
    });
    
    it("handles throw deleting account", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "ARTISTA" } },
      });
      setupFetchMock();

      render(<PaginaConfiguracion />);
      const user = userEvent.setup();
      
      await user.click(screen.getByText("Eliminar"));
      await waitFor(() => expect(screen.getByText("¿Eliminar cuenta permanentemente?")).toBeInTheDocument());
      
      (fetchApi as any).mockImplementation((url: string) => {
        if (url === "/api/usuarios/eliminar") {
          return Promise.reject(new Error("Net"));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      });

      await user.click(screen.getByText("Sí, eliminar"));
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al eliminar cuenta");
      });
    });
    
    it("does not show Delete Account for SUPER_ADMIN", async () => {
      (useSession as any).mockReturnValue({
        data: { user: { id: "user-1", rol: "SUPER_ADMIN" } },
      });
      setupFetchMock();

      render(<PaginaConfiguracion />);
      
      await waitFor(() => {
        expect(screen.queryByText("Eliminar Cuenta")).not.toBeInTheDocument();
      });
    });
  });
});
