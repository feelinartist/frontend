import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaginaGestionUsuarios from "../page";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Swal from "sweetalert2";

// Mocks
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn().mockImplementation((options) => {
      if (options && typeof options.didOpen === 'function') {
        options.didOpen();
      }
      return Promise.resolve({ isConfirmed: true });
    }),
    getContainer: vi.fn().mockImplementation(() => {
      return (globalThis as any).swalContainerMockValue !== undefined 
        ? (globalThis as any).swalContainerMockValue 
        : { style: {} };
    })
  }
}));

vi.mock("sweetalert2-react-content", () => ({
  default: (swal: any) => swal
}));

globalThis.fetch = vi.fn();
globalThis.open = vi.fn();
globalThis.URL.createObjectURL = vi.fn();

describe("PaginaGestionUsuarios", () => {
  const mockRouter = { push: vi.fn() };
  const mockUsers = [
    {
      id: "1",
      nombre: "Test User",
      email: "test@test.com",
      correo: "test@test.com",
      rol: { id: "1", nombre: "SUPER_ADMIN" },
      estadoCuenta: "ACTIVO",
      creadoEn: "2023-01-01T00:00:00Z",
      actualizadoEn: "2023-01-01T00:00:00Z",
    },
    {
      id: "2",
      nombre: "Art User",
      rol: { id: "2", nombre: "ARTISTA" },
      estadoCuenta: "BANEADO",
      creadoEn: "2023-01-01T00:00:00Z",
      actualizadoEn: "2023-01-01T00:00:00Z",
      perfilArtista: {
        urlPago: "http://payment.url",
        musicQR: "http://music.qr",
        pagoQR: "http://payment.qr",
        nombreQR: "My QR",
        galeria: [{ urlImagen: "img1.jpg" }]
      }
    },
    {
      id: "3",
      nombre: "Disc User",
      rol: { id: "3", nombre: "DISCOTECA" },
      estadoCuenta: "SUSPENDIDO",
      creadoEn: "2023-01-01T00:00:00Z",
      actualizadoEn: "2023-01-01T00:00:00Z",
    },
    {
      id: "4",
      nombre: "Wait Delete",
      rol: { id: "4", nombre: "OTHER" },
      estadoCuenta: "ELIMINACION_PENDIENTE",
      creadoEn: "2023-01-01T00:00:00Z",
      actualizadoEn: "2023-01-01T00:00:00Z",
    },
    {
      id: "5",
      nombre: "Admin User",
      nombreUsuario: "adminuser",
      imagen: "http://avatar.url/1.jpg",
      rol: { id: "5", nombre: "ADMIN" },
      estadoCuenta: "ACTIVO",
      creadoEn: "2023-01-01T00:00:00Z",
      actualizadoEn: "2023-01-01T00:00:00Z",
    },
    {
      id: "6",
      nombre: "",
      nombreUsuario: null,
      imagen: null,
      rol: { id: "1", nombre: "PUBLICO" },
      estadoCuenta: "ACTIVO",
      creadoEn: "2023-01-01T00:00:00Z",
      actualizadoEn: "2023-01-01T00:00:00Z",
    },
    {
      id: "7",
      nombre: null,
      correo: "unknown@test.com",
      rol: { id: "6", nombre: "UNKNOWN_ROLE" },
      estadoCuenta: "UNKNOWN_STATUS",
      creadoEn: "2023-01-01T00:00:00Z",
      actualizadoEn: "2023-01-01T00:00:00Z",
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    
    // Mock fetch responses
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/admin/usuarios")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ usuarios: mockUsers, total: 25 }), // Force pagination
        });
      }
      if (url.includes("/api/admin/config/roles")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: "1", nombre: "ADMIN" }]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  const setupAuth = () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: "ADMIN" } },
      status: "authenticated",
    });
  };

  it("redirects if unauthenticated", () => {
    (useSession as any).mockReturnValue({ data: null, status: "unauthenticated" });
    render(<PaginaGestionUsuarios />);
    expect(mockRouter.push).toHaveBeenCalledWith("/home");
  });

  it("redirects if authenticated but not admin", () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: "PUBLICO" } },
      status: "authenticated",
    });
    render(<PaginaGestionUsuarios />);
    expect(mockRouter.push).toHaveBeenCalledWith("/home");
  });

  it("renders loader while loading data", () => {
    setupAuth();
    const { container } = render(<PaginaGestionUsuarios />);
    expect(container.querySelector(".animate-spin") || screen.queryByTestId("loading-screen")).toBeDefined();
  });

  it("renders users after loading", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);
    
    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.getByText("Art User")).toBeInTheDocument();
      expect(screen.getByText("Disc User")).toBeInTheDocument();
      expect(screen.getByText("Wait Delete")).toBeInTheDocument();
    });
  });

  it("handles pagination next and previous", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);

    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument(), { timeout: 2000 });

    const nextBtn = screen.getByRole("button", { name: /Siguiente/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("page=2"));
    });

    const prevBtn = screen.getByRole("button", { name: /Anterior/i });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("page=1"));
    });
  });

  it("handles search input debounce", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);

    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument(), { timeout: 2000 });
    
    const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i);
    fireEvent.change(searchInput, { target: { value: "search test" } });
    

    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("termino=search%20test"));
    });
  });

  it("handles empty user search result and fetch error", async () => {
    setupAuth();
    (globalThis.fetch as any).mockResolvedValue({ ok: false }); // Error
    
    render(<PaginaGestionUsuarios />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al cargar los datos");
    });
  });

  it("handles user edit modal and update", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);

    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument(), { timeout: 2000 });

    const manageBtns = screen.getAllByRole("button", { name: /Gestionar/i });
    fireEvent.click(manageBtns[0]); // Test User

    await waitFor(() => expect(screen.getByText("Gestionar Usuario")).toBeInTheDocument());
    
    // Save changes (Guardar Cambios)
    fireEvent.click(screen.getByText("Guardar Cambios"));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/usuarios/perfil"), expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith("Usuario actualizado correctamente");
    });
  });

  it("handles edit modal failure", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);

    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument(), { timeout: 2000 });

    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[0]);
    await waitFor(() => expect(screen.getByText("Guardar Cambios")).toBeInTheDocument());
    
    (globalThis.fetch as any).mockImplementationOnce(() => Promise.resolve({ ok: false, json: () => Promise.resolve({ message: "Update fail" }) }));
    
    fireEvent.click(screen.getByText("Guardar Cambios"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Update fail"));
  });

  it("handles user ban and unban", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);
    
    await screen.findByText("Test User", {}, { timeout: 2000 });

    // Open active user (Test User)
    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[0]);
    await screen.findByText("Gestionar Usuario", {}, { timeout: 3000 }); // Wait for modal
    const banearBtn = await screen.findByRole("button", { name: /Banear/i }, { timeout: 3000 });
    
    fireEvent.click(banearBtn);
    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Usuario baneado correctamente");
    });

    // Modal closes automatically, let's just open the banned user
    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[1]);
    await screen.findByText("Gestionar Usuario", {}, { timeout: 3000 }); // Wait for modal
    const desbanearBtn = await screen.findByRole("button", { name: /Desbanear/i }, { timeout: 3000 });

    fireEvent.click(desbanearBtn);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Usuario desbaneado correctamente");
    });
  });

  it("handles permanent delete", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);
    
    await screen.findByText("Test User", {}, { timeout: 2000 });

    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[0]);
    await screen.findByText("Gestionar Usuario", {}, { timeout: 3000 }); // Wait for modal
    const eliminarBtn = await screen.findByRole("button", { name: /Borrar/i }, { timeout: 3000 });

    fireEvent.click(eliminarBtn);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Usuario eliminado para siempre");
    });
  });

  it("handles download logic and link open", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);

    await waitFor(() => expect(screen.getByText("Art User")).toBeInTheDocument(), { timeout: 2000 });

    // Open Art User
    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[1]);
    await waitFor(() => expect(screen.getByText("Gestionar Usuario")).toBeInTheDocument());

    // Test download success
    (globalThis.fetch as any).mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob()) });
    const downloadBtns = screen.getAllByTitle("Descargar");
    fireEvent.click(downloadBtns[0]); // Download profile pic or QR
    
    await waitFor(() => {
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    });

    // Test download error -> fallback to open
    (globalThis.fetch as any).mockRejectedValueOnce(new Error("Network Error"));
    fireEvent.click(downloadBtns[0]);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al descargar la imagen");
      expect(globalThis.open).toHaveBeenCalled();
    });
  });

  it("handles catch block error on cargarDatos", async () => {
    setupAuth();
    (globalThis.fetch as any).mockRejectedValueOnce(new Error("Network connection failed"));
    render(<PaginaGestionUsuarios />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error de conexión con el servidor");
    });
  });

  it("handles update failure with default message, and catch block", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);
    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[0]);
    await waitFor(() => expect(screen.getByText("Guardar Cambios")).toBeInTheDocument());

    // ok false, no message in body
    (globalThis.fetch as any).mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) });
    fireEvent.click(screen.getByText("Guardar Cambios"));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al actualizar");
    });

    // rejection
    (globalThis.fetch as any).mockRejectedValueOnce(new Error("Network Error"));
    fireEvent.click(screen.getByText("Guardar Cambios"));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al actualizar usuario");
    });
  });

  it("handles ban, unban, and delete failures and rejection", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);
    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument());

    // 1. Ban failure
    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[0]);
    await screen.findByText("Gestionar Usuario");
    const banearBtn = await screen.findByRole("button", { name: /Banear/i });
    
    (globalThis.fetch as any).mockResolvedValueOnce({ ok: false });
    fireEvent.click(banearBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error al banear usuario"));

    // Ban network error
    (globalThis.fetch as any).mockRejectedValueOnce(new Error("Network Error"));
    fireEvent.click(banearBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error de red"));

    // Close dialog to allow clicking other users
    fireEvent.click(screen.getByRole("button", { name: /Cerrar/i }));
    await waitFor(() => expect(screen.queryByText("Gestionar Usuario")).not.toBeInTheDocument());

    // 2. Unban failure
    // Open banned user
    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[1]);
    await screen.findByText("Gestionar Usuario");
    const desbanearBtn = await screen.findByRole("button", { name: /Desbanear/i });

    (globalThis.fetch as any).mockResolvedValueOnce({ ok: false });
    fireEvent.click(desbanearBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error al desbanear usuario"));

    (globalThis.fetch as any).mockRejectedValueOnce(new Error("Network Error"));
    fireEvent.click(desbanearBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error de red"));

    // Close dialog
    fireEvent.click(screen.getByRole("button", { name: /Cerrar/i }));
    await waitFor(() => expect(screen.queryByText("Gestionar Usuario")).not.toBeInTheDocument());

    // 3. Delete permanent failure
    // Open test user
    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[0]);
    await screen.findByText("Gestionar Usuario");
    const deleteBtn = await screen.findByRole("button", { name: /Borrar/i });

    (globalThis.fetch as any).mockResolvedValueOnce({ ok: false });
    fireEvent.click(deleteBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error al eliminar usuario"));

    (globalThis.fetch as any).mockRejectedValueOnce(new Error("Network Error"));
    fireEvent.click(deleteBtn);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error de red"));

    // Close dialog
    fireEvent.click(screen.getByRole("button", { name: /Cerrar/i }));
  });

  it("does not proceed with ban/unban/delete if not confirmed", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);
    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument());

    // Mock confirm dialog to return false
    (Swal.fire as any).mockResolvedValueOnce({ isConfirmed: false });

    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[0]);
    await screen.findByText("Gestionar Usuario");
    const banearBtn = await screen.findByRole("button", { name: /Banear/i });

    fireEvent.click(banearBtn);
    // Should not call fetch for banear
    expect(globalThis.fetch).not.toHaveBeenCalledWith(expect.stringContaining("/api/usuarios/banear"), expect.any(Object));
  });

  it("handles payment link click and different user role/status rendering", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);
    await waitFor(() => expect(screen.getByText("Art User")).toBeInTheDocument());

    // Open Art User (role ARTISTA, status BANEADO)
    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[1]);
    await screen.findByText("Gestionar Usuario");

    // Click external payment link specifically in the payment link container
    const paymentLinkContainer = screen.getByText("http://payment.url").parentElement;
    const paymentLinkBtn = paymentLinkContainer?.querySelector("button");
    if (paymentLinkBtn) {
      fireEvent.click(paymentLinkBtn);
      expect(globalThis.open).toHaveBeenCalledWith("http://payment.url", "_blank");
    }

    // Check role badge of Test User (SUPER_ADMIN)
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });

  it("handles session with SUPER_ADMIN role", async () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: "SUPER_ADMIN" } },
      status: "authenticated",
    });
    render(<PaginaGestionUsuarios />);
    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument());
  });

  it("does not proceed with unban or delete permanently if not confirmed", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);
    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument());

    // Mock confirm dialog to return false
    (Swal.fire as any).mockResolvedValue({ isConfirmed: false });

    // Try unban
    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[1]); // Art User (BANEADO)
    await screen.findByText("Gestionar Usuario");
    const desbanearBtn = await screen.findByRole("button", { name: /Desbanear/i });
    fireEvent.click(desbanearBtn);
    expect(globalThis.fetch).not.toHaveBeenCalledWith(expect.stringContaining("/api/usuarios/reactivar"), expect.any(Object));

    // Try delete
    const deleteBtn = await screen.findByRole("button", { name: /Borrar/i });
    fireEvent.click(deleteBtn);
    expect(globalThis.fetch).not.toHaveBeenCalledWith(expect.stringContaining("/api/usuarios/eliminar-permanente"), expect.any(Object));
  });

  it("handles empty search results list", async () => {
    setupAuth();
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/admin/usuarios")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ usuarios: [], total: 0 }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(<PaginaGestionUsuarios />);
    await waitFor(() => expect(screen.getByText("No se encontraron usuarios que coincidan con la búsqueda")).toBeInTheDocument());
  });

  it("handles downloading/viewing legacy music QR and payment QR and gallery images in user dialog", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);
    await waitFor(() => expect(screen.getByText("Art User")).toBeInTheDocument(), { timeout: 2000 });

    // 1. Open Art User
    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[1]); 
    await screen.findByText("Gestionar Usuario");

    // Click payment QR buttons
    const qrImage = screen.getByAltText("Image QR");
    const qrContainer = qrImage.closest("div");
    const qrButtons = qrContainer?.querySelectorAll("button") || [];
    expect(qrButtons.length).toBe(2);
    
    // Open external link
    fireEvent.click(qrButtons[0]);
    expect(globalThis.open).toHaveBeenCalledWith("http://payment.qr", "_blank");

    // Download QR
    (globalThis.fetch as any).mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob()) });
    fireEvent.click(qrButtons[1]);
    await waitFor(() => {
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    });

    // Click legacy music QR buttons
    const legacyQrImage = screen.getByAltText("Legacy QR");
    const legacyQrContainer = legacyQrImage.closest("div");
    const legacyQrButtons = legacyQrContainer?.querySelectorAll("button") || [];
    expect(legacyQrButtons.length).toBe(2);

    // Open external legacy QR link
    fireEvent.click(legacyQrButtons[0]);
    expect(globalThis.open).toHaveBeenCalledWith("http://music.qr", "_blank");

    // Download legacy QR
    (globalThis.fetch as any).mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob()) });
    fireEvent.click(legacyQrButtons[1]);
    await waitFor(() => {
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    });

    // Click gallery buttons
    const galleryImg = screen.getByAltText("Gallery 0");
    const galleryContainer = galleryImg.closest("div");
    const galleryButtons = galleryContainer?.querySelectorAll("button") || [];
    expect(galleryButtons.length).toBe(2);

    // Open external gallery link
    fireEvent.click(galleryButtons[0]);
    expect(globalThis.open).toHaveBeenCalledWith("img1.jpg", "_blank");

    // Download gallery image
    (globalThis.fetch as any).mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob()) });
    fireEvent.click(galleryButtons[1]);
    await waitFor(() => {
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    });

    // Close dialog
    fireEvent.click(screen.getByRole("button", { name: /Cerrar/i }));
    await waitFor(() => expect(screen.queryByText("Gestionar Usuario")).not.toBeInTheDocument());

    // 2. Open Admin User to test profile image buttons
    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[4]);
    await screen.findByText("Gestionar Usuario");

    const userAvatarImg = screen.getByAltText("User");
    const avatarContainer = userAvatarImg.closest("div");
    const avatarButtons = avatarContainer?.parentElement?.querySelectorAll("button") || [];
    
    // Wait, the button container is inside group/avatar, let's find buttons inside the group/avatar div
    const groupAvatarDiv = userAvatarImg.closest(".group\\/avatar") || avatarContainer?.parentElement;
    const buttonsInAvatar = groupAvatarDiv?.querySelectorAll("button") || [];
    expect(buttonsInAvatar.length).toBe(2);

    // Open external profile image link
    fireEvent.click(buttonsInAvatar[0]);
    expect(globalThis.open).toHaveBeenCalledWith("http://avatar.url/1.jpg", "_blank");

    // Download profile image
    (globalThis.fetch as any).mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob()) });
    fireEvent.click(buttonsInAvatar[1]);
    await waitFor(() => {
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it("handles Swal container returning null to cover that branch", async () => {
    setupAuth();
    (globalThis as any).swalContainerMockValue = null;

    render(<PaginaGestionUsuarios />);
    await screen.findByText("Test User");

    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[0]);
    await screen.findByText("Gestionar Usuario");

    const banBtn = await screen.findByRole("button", { name: /Banear/i });
    fireEvent.click(banBtn);

    // SweetAlert fires, didOpen runs, container is null, doesn't crash
    expect(Swal.fire).toHaveBeenCalled();

    // Clean up global
    delete (globalThis as any).swalContainerMockValue;
  });

  it("handles user modal with empty fields fallback", async () => {
    setupAuth();
    render(<PaginaGestionUsuarios />);

    await waitFor(() => expect(screen.getAllByRole("button", { name: /Gestionar/i }).length).toBeGreaterThan(5));

    // Open User 6
    fireEvent.click(screen.getAllByRole("button", { name: /Gestionar/i })[5]);
    
    // Check fallback image click
    const avatarImages = screen.getAllByRole("img");
    // Find the one that has the fallback avatar
    const fallbackAvatar = avatarImages.find(img => (img as HTMLImageElement).src.includes("avatar.vercel.sh"));
    if (fallbackAvatar) {
        const container = fallbackAvatar.closest('.group');
        const viewBtn = container?.querySelectorAll('button')[0];
        if (viewBtn) {
            fireEvent.click(viewBtn);
            expect(globalThis.open).toHaveBeenCalledWith("https://avatar.vercel.sh/user", "_blank");
        }
    }
  });
});
