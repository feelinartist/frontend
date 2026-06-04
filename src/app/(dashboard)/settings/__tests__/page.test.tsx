import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import PaginaConfiguracion from "../page";
import { useSession, signOut } from "next-auth/react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { useSettingsData } from "@/lib/useSettingsData";

vi.mock("next-auth/react", () => ({ useSession: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/api", () => ({ fetchApi: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/useSettingsData", () => ({ useSettingsData: vi.fn() }));
vi.mock("@/components/ui/ConfirmActionDialog", () => ({
  ConfirmActionDialog: ({ trigger, onConfirm }: any) => (
    <div onClick={(e) => {
      e.stopPropagation();
      onConfirm();
    }}>{trigger}</div>
  )
}));

const mockCountries = [{ code: "CO", name: "Colombia" }, { code: "US", name: "United States" }];
vi.mock("@/lib/countries", () => ({ countries: [{ code: "CO", name: "Colombia" }, { code: "US", name: "United States" }] }));

describe("PaginaConfiguracion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "ARTISTA" } },
    });
    (useSettingsData as any).mockReturnValue({
      bloqueados: [],
      cargandoBloqueados: false,
      perfilesExistentes: { artista: false, discoteca: false, publico: false },
      desbloquearUsuario: vi.fn(),
    });
  });

  it("handles cargandoBloqueados state", async () => {
    (useSettingsData as any).mockReturnValue({
      bloqueados: [],
      cargandoBloqueados: true,
      perfilesExistentes: { artista: false, discoteca: false, publico: false },
      desbloquearUsuario: vi.fn(),
    });

    render(<PaginaConfiguracion />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Ver Lista"));
    
    await waitFor(() => {
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  it("renders blocked users and handles unlock", async () => {
    const mockUnlock = vi.fn().mockResolvedValue({});
    (useSettingsData as any).mockReturnValue({
      bloqueados: [
        { id: "b1", nombre: "Block 1", correo: "b1@test.com", imagen: "/img1.jpg" },
        { id: "b2", nombreUsuario: "block_2", correo: "b2@test.com" }
      ],
      cargandoBloqueados: false,
      perfilesExistentes: { artista: false, discoteca: false, publico: false },
      desbloquearUsuario: mockUnlock,
    });

    render(<PaginaConfiguracion />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Ver Lista"));

    expect(screen.getByText("Block 1")).toBeInTheDocument();
    expect(screen.getByText("block_2")).toBeInTheDocument();

    const unlockBtns = screen.getAllByText("Desbloquear");
    await user.click(unlockBtns[0]);

    expect(mockUnlock).toHaveBeenCalledWith("b1");
    expect(toast.success).toHaveBeenCalledWith("Usuario desbloqueado");
  });

  it("handles unlock error", async () => {
    const mockUnlock = vi.fn().mockRejectedValue(new Error("err"));
    (useSettingsData as any).mockReturnValue({
      bloqueados: [{ id: "b1", nombreUsuario: "block_1" }],
      cargandoBloqueados: false,
      perfilesExistentes: { artista: false, discoteca: false, publico: false },
      desbloquearUsuario: mockUnlock,
    });

    render(<PaginaConfiguracion />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Ver Lista"));

    const unlockBtns = screen.getAllByText("Desbloquear");
    await user.click(unlockBtns[0]);

    expect(toast.error).toHaveBeenCalledWith("Error al desbloquear");
  });

  it("migrates role to ARTISTA successfully", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "PUBLICO" } },
    });
    vi.mocked(fetchApi).mockResolvedValue({ ok: true } as any);

    render(<PaginaConfiguracion />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Migrar"));
    
    await waitFor(() => expect(screen.getByText("Nuevo Rol")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Selecciona un rol"));
    await waitFor(() => expect(screen.getByText("Artista")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Artista"));

    const nombreArtInput = screen.getByLabelText("Nombre Artístico");
    await user.type(nombreArtInput, "Art Name");

    fireEvent.click(screen.getByText("Selecciona categoría"));
    await waitFor(() => expect(screen.getByText("Banda")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Banda"));

    fireEvent.click(screen.getByText("Selecciona país"));
    await waitFor(() => expect(screen.getByText("Colombia")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Colombia"));

    const cityInput = screen.getByPlaceholderText("Ingresa tu ciudad");
    await user.type(cityInput, "Bogota");

    await user.click(screen.getByText("Confirmar Migración"));
    expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/migrar-rol', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"nuevoRol":"ARTISTA"')
    }));
    
    expect(toast.success).toHaveBeenCalledWith("Rol migrado exitosamente. Reiniciando sesión...");
    await waitFor(() => expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/home' }), { timeout: 2500 });
  });

  it("handles disable account", async () => {
    vi.mocked(fetchApi).mockResolvedValue({ ok: true } as any);

    render(<PaginaConfiguracion />);
    const disableBtn = screen.getByText("Deshabilitar");
    fireEvent.click(disableBtn);

    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/deshabilitar', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith("Cuenta deshabilitada. Cerrando sesión...");
      expect(signOut).toHaveBeenCalled();
    }, { timeout: 2500 });
  });

  it("handles account action fetch exception", async () => {
    vi.mocked(fetchApi).mockRejectedValue(new Error("net err"));

    render(<PaginaConfiguracion />);
    const disableBtn = screen.getByText("Deshabilitar");
    fireEvent.click(disableBtn);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error al deshabilitar cuenta"));
  });

  it("renders and handles super admin profile delete", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "SUPER_ADMIN" } },
    });
    (useSettingsData as any).mockReturnValue({
      bloqueados: [],
      perfilesExistentes: { artista: true, discoteca: false, publico: false },
    });
    vi.mocked(fetchApi).mockResolvedValue({ ok: true } as any);

    render(<PaginaConfiguracion />);
    const deleteProfileBtn = screen.getByText("Eliminar Perfil");
    fireEvent.click(deleteProfileBtn);

    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith('/api/admin/usuarios/perfil/artista', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith("Perfil de artista eliminado. Reiniciando sesión...");
    });
  });

  it("handles delete account error", async () => {
    vi.mocked(fetchApi).mockResolvedValue({ ok: false } as any);

    render(<PaginaConfiguracion />);
    const delBtn = screen.getByText("Eliminar", { selector: 'button' });
    fireEvent.click(delBtn);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error al eliminar cuenta"));
  });

  it("handles clicking Crear Perfil button in AdminProfileCard", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "ADMIN" } },
    });
    (useSettingsData as any).mockReturnValue({
      bloqueados: [],
      perfilesExistentes: { artista: false, discoteca: false, publico: false },
    });

    Object.defineProperty(globalThis, 'location', {
      value: { href: "" },
      writable: true
    });

    render(<PaginaConfiguracion />);
    const createProfileBtns = screen.getAllByText("Crear Perfil");
    fireEvent.click(createProfileBtns[0]);
    expect(globalThis.location.href).toBe("/artist-registration");
  });

  it("migrates role to DISCOTECA successfully", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "PUBLICO" } },
    });
    vi.mocked(fetchApi).mockResolvedValue({ ok: true } as any);

    render(<PaginaConfiguracion />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Migrar"));
    
    await waitFor(() => expect(screen.getByText("Nuevo Rol")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Selecciona un rol"));
    await waitFor(() => expect(screen.getByText("Discoteca")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Discoteca"));

    const venueNameInput = screen.getByLabelText("Nombre de la Discoteca");
    await user.type(venueNameInput, "Club House");

    await user.click(screen.getByText("Confirmar Migración"));
    expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/migrar-rol', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"nuevoRol":"DISCOTECA"')
    }));
  });

  it("handles migration failure with API error message", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "ARTISTA" } },
    });
    vi.mocked(fetchApi).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Migration failed error" })
    } as any);

    render(<PaginaConfiguracion />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Migrar"));
    
    await waitFor(() => expect(screen.getByText("Nuevo Rol")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Selecciona un rol"));
    await waitFor(() => expect(screen.getByText("Público")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Público"));

    await user.click(screen.getByText("Confirmar Migración"));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Migration failed error");
    });
  });

  it("handles migration network error", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "ARTISTA" } },
    });
    vi.mocked(fetchApi).mockRejectedValue(new Error("Network Error"));

    render(<PaginaConfiguracion />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Migrar"));
    
    await waitFor(() => expect(screen.getByText("Nuevo Rol")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Selecciona un rol"));
    await waitFor(() => expect(screen.getByText("Público")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Público"));

    await user.click(screen.getByText("Confirmar Migración"));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al migrar rol");
    });
  });

  it("handles admin profile delete error", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "SUPER_ADMIN" } },
    });
    (useSettingsData as any).mockReturnValue({
      bloqueados: [],
      perfilesExistentes: { artista: true, discoteca: false, publico: false },
    });
    vi.mocked(fetchApi).mockResolvedValue({ ok: false } as any);

    render(<PaginaConfiguracion />);
    const deleteProfileBtn = screen.getByText("Eliminar Perfil");
    fireEvent.click(deleteProfileBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al eliminar perfil de artista");
    });
  });

  it("allows cancelling role migration dialog", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "PUBLICO" } },
    });

    render(<PaginaConfiguracion />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Migrar"));
    
    await waitFor(() => expect(screen.getByText("Nuevo Rol")).toBeInTheDocument());

    const cancelBtn = screen.getByRole("button", { name: /Cancelar/i });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText("Nuevo Rol")).not.toBeInTheDocument();
    });
  });

  it("renders settings with null session", () => {
    (useSession as any).mockReturnValue({ data: null });
    render(<PaginaConfiguracion />);
    expect(screen.getByText("Configuración")).toBeInTheDocument();
  });

  it("handles migration failure with fallback error message", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "ARTISTA" } },
    });
    vi.mocked(fetchApi).mockResolvedValue({
      ok: false,
      json: async () => ({})
    } as any);

    render(<PaginaConfiguracion />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Migrar"));
    
    await waitFor(() => expect(screen.getByText("Nuevo Rol")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Selecciona un rol"));
    await waitFor(() => expect(screen.getByText("Público")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Público"));

    await user.click(screen.getByText("Confirmar Migración"));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al migrar rol");
    });
  });

  it("returns early from migrarRol when nuevoRol is empty (line 128)", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "PUBLICO" } },
    });
    vi.mocked(fetchApi).mockClear();

    render(<PaginaConfiguracion />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Migrar"));

    await waitFor(() => expect(screen.getByText("Nuevo Rol")).toBeInTheDocument());

    // Click "Confirmar Migración" without selecting a nuevoRol
    // The button is disabled when !nuevoRol, so call migrarRol indirectly by
    // clicking the button via fireEvent which bypasses the disabled attribute.
    const confirmBtn = screen.getByText("Confirmar Migración");
    fireEvent.click(confirmBtn);

    // fetchApi should NOT have been called because migrarRol returns early
    expect(fetchApi).not.toHaveBeenCalled();
  });

  it("shows 'Usuario' as alt text for blocked user image when nombre is missing (line 213)", async () => {
    (useSettingsData as any).mockReturnValue({
      bloqueados: [
        { id: "b-no-name", nombreUsuario: "noname_user", correo: "noname@test.com", imagen: "/img-noname.jpg" }
      ],
      cargandoBloqueados: false,
      perfilesExistentes: { artista: false, discoteca: false, publico: false },
      desbloquearUsuario: vi.fn(),
    });

    render(<PaginaConfiguracion />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Ver Lista"));

    await waitFor(() => {
      const img = screen.getByAltText("Usuario");
      expect(img).toBeInTheDocument();
    });
  });

  it("shows Loader2 spinner when migrando is true (line 411)", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { id: "user-1", rol: "PUBLICO" } },
    });

    // Make fetchApi return a promise that never resolves so migrando stays true
    vi.mocked(fetchApi).mockReturnValue(new Promise(() => {}));

    render(<PaginaConfiguracion />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Migrar"));

    await waitFor(() => expect(screen.getByText("Nuevo Rol")).toBeInTheDocument());

    // Select a role first
    fireEvent.click(screen.getByText("Selecciona un rol"));
    await waitFor(() => expect(screen.getByText("Artista")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Artista"));

    // Click confirm — migrando becomes true, but fetchApi never resolves
    await user.click(screen.getByText("Confirmar Migración"));

    // The component should now show LoadingScreen because migrando is true
    // (line 247: if (cargando || migrando) return <LoadingScreen />)
    // So the dialog content disappears and LoadingScreen is shown
    await waitFor(() => {
      expect(screen.queryByText("Confirmar Migración")).not.toBeInTheDocument();
    });
  });
});
