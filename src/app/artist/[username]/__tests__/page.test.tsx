import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import PaginaPerfilArtistaPublico from "../page";
import { useSession } from "next-auth/react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { getCountryByCode } from "@/lib/countries";

// Mocking dependencies
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/countries", () => ({
  getCountryByCode: vi.fn(),
  countries: [],
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} alt={props.alt} />;
  },
}));

vi.mock("react-qr-code", () => {
  return {
    default: function QRCodeMock(props: any) {
      return <svg data-testid="mock-qr-code" {...props}></svg>;
    }
  };
});

describe("PaginaPerfilArtistaPublico", () => {
  const mockRouter = { push: vi.fn() };
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
    // Basic canvas and URL mocks
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
    
    class MockImage {
      onload: () => void = () => {};
      src: string = "";
      constructor() {
        setTimeout(() => this.onload(), 0);
      }
    }
    (global as any).Image = MockImage;

    (global as any).XMLSerializer = class {
      serializeToString() {
        return "<svg></svg>";
      }
    };

    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    })) as any;

    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: any) => {
      callback(new Blob());
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useParams as any).mockReturnValue({ username: "testuser" });
    (usePathname as any).mockReturnValue("/artist");
    (useSession as any).mockReturnValue({ data: null });
    global.fetch = vi.fn();

    // Reset clipboard and share mocks
    Object.assign(navigator, {
      share: undefined,
      canShare: undefined,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  const setupFetchMock = (ok: boolean, status: number, data?: any, shouldReject = false) => {
    if (shouldReject) {
      (global.fetch as any).mockRejectedValue(new Error("Network Error"));
      return;
    }
    (global.fetch as any).mockResolvedValue({
      ok,
      status,
      json: async () => data,
      blob: async () => new Blob(),
    });
  };

  it("renders loading screen initially", () => {
    setupFetchMock(true, 200, {});
    const { container } = render(<PaginaPerfilArtistaPublico />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument(); 
  });

  it("shows not found message on 404", async () => {
    setupFetchMock(false, 404);
    render(<PaginaPerfilArtistaPublico />);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Artista no encontrado o perfil no disponible");
      expect(mockRouter.push).toHaveBeenCalledWith("/home");
      expect(screen.getByText("Artista no encontrado")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Volver al Inicio"));
    expect(mockRouter.push).toHaveBeenCalledWith("/home");
  });

  it("shows generic error on other failed statuses", async () => {
    setupFetchMock(false, 500);
    render(<PaginaPerfilArtistaPublico />);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al cargar datos del artista");
      expect(mockRouter.push).toHaveBeenCalledWith("/home");
    });
  });

  it("shows generic error on fetch reject", async () => {
    setupFetchMock(false, 500, null, true);
    render(<PaginaPerfilArtistaPublico />);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al cargar datos del artista");
    });
  });

  it("renders artist data successfully", async () => {
    (useSession as any).mockReturnValue({ data: { user: { id: "user1" } } });
    (getCountryByCode as any).mockReturnValue({ name: "Peru" });

    setupFetchMock(true, 200, {
      id: "artist2",
      nombre: "Test Artist",
      nombreUsuario: "testuser",
      imagen: "test.jpg",
      perfilArtista: {
        nombreArtistico: "DJ Test",
        biografia: "Test bio",
        categoria: "DJ",
        paisId: "PE",
        ciudad: "Lima",
        fechaInicio: "2020-01-01",
        tarifaPorHora: "100",
        moneda: "PEN",
        lugaresConocidos: ["Club 1", "Club 2"],
        pagoQR: "qr-url.png",
        nombreQR: "Yape",
        urlPago: "https://pago.com",
        urlYoutubeFavorito: "https://youtube.com/watch?v=123",
        urlSoundCloudFavorito: "https://soundcloud.com/test/track",
        redesSociales: [
          {
            id: "1",
            nombreUsuario: "testyt",
            redSocial: { nombre: "YouTube", urlBase: "https://youtube.com/@" }
          },
          {
            id: "2",
            nombreUsuario: "https://soundcloud.com/test",
            redSocial: { nombre: "SoundCloud", urlBase: "https://soundcloud.com/" }
          },
          {
            id: "3",
            nombreUsuario: "testig",
            redSocial: { nombre: "Instagram", urlBase: "https://instagram.com/", icono: "http://icon.com/ig.png" }
          },
          {
            id: "4",
            nombreUsuario: "testfb",
            redSocial: { nombre: "Facebook", urlBase: "https://facebook.com/", icono: "fa-facebook" }
          },
          {
            id: "5",
            nombreUsuario: "testx",
            redSocial: { nombre: "X", urlBase: "https://x.com/" }
          },
          {
            id: "6",
            nombreUsuario: "testwa",
            redSocial: { nombre: "WhatsApp", urlBase: "https://wa.me/" }
          },
          {
            id: "7",
            nombreUsuario: "testweb",
            redSocial: { nombre: "Website", urlBase: "https://" }
          }
        ],
        eventos: [
          { titulo: "Live Set", descripcion: "Playing tonight", estado: "activo" }
        ],
        galeria: [
          { id: "g1", urlImagen: "https://galeria.com/1.jpg" },
          { id: "g2", url: "https://galeria.com/2.jpg" }
        ]
      }
    });

    render(<PaginaPerfilArtistaPublico />);

    await waitFor(() => {
      expect(screen.getByText(/DJ Test/i)).toBeInTheDocument();
      expect(screen.getByText(/@testuser/i)).toBeInTheDocument();
      expect(screen.getByText(/Lima, Peru/i)).toBeInTheDocument();
      expect(screen.getByText(/Test bio/i)).toBeInTheDocument();
      expect(screen.getByText(/Desde 100 PEN\/hr/i)).toBeInTheDocument();
      expect(screen.getByText(/Club 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Live Set/i)).toBeInTheDocument();
      expect(screen.getByText(/Playing tonight/i)).toBeInTheDocument();
      expect(screen.getByText(/2 fotos/i)).toBeInTheDocument();
    });

    // Test gallery zoom
    const galleryBtns = screen.getAllByLabelText("Ver imagen en galería");
    fireEvent.click(galleryBtns[0]);
    await waitFor(() => {
      expect(screen.getByAltText("Vista ampliada")).toBeInTheDocument();
    });
    
    // Close zoom
    fireEvent.click(screen.getByLabelText("Cerrar modal"));
    await waitFor(() => {
      expect(screen.queryByAltText("Vista ampliada")).not.toBeInTheDocument();
    });
    
    // Test close button
    fireEvent.click(galleryBtns[1]);
    await waitFor(() => {
      expect(screen.getByAltText("Vista ampliada")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Cerrar"));

    // Interaction tests
    fireEvent.click(screen.getByText("Reservar Contacto"));
    expect(toast.success).toHaveBeenCalledWith("Funcionalidad de reservas pronto disponible!");

    // Download Pago QR
    setupFetchMock(true, 200, new Blob());
    fireEvent.click(screen.getByText("Descargar QR"));
    
    // Zoom Pago QR
    fireEvent.click(screen.getByRole('button', { name: /Yape/i }));

    // QR Share & Download logic
    // Mock the QR SVG structure
    const qrContainer = document.createElement("div");
    qrContainer.id = "music-request-qr";
    qrContainer.innerHTML = "<svg></svg>";
    document.body.appendChild(qrContainer);

    // Download Request QR
    const downloadBtns = screen.getAllByText("Descargar");
    fireEvent.click(downloadBtns[downloadBtns.length - 1]);

    // Share Request QR (Clipboard fallback)
    fireEvent.click(screen.getByText("Compartir"));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Enlace copiado al portapapeles");
    });
    
    // Cleanup
    document.body.removeChild(qrContainer);
  });

  it("handles experience calc corner cases and native sharing", async () => {
    const start = new Date();
    start.setMonth(start.getMonth() - 1);

    setupFetchMock(true, 200, {
      id: "artist2",
      nombre: "No Profile",
      nombreUsuario: "noprofile",
      perfilArtista: {
        fechaInicio: start.toISOString(),
        lugaresConocidos: "Only one place",
        tarifaPorHora: "0",
        pagoQR: null,
        redesSociales: [],
        eventos: []
      }
    });

    // Mock native sharing
    navigator.share = vi.fn().mockResolvedValue(undefined);
    navigator.canShare = vi.fn().mockReturnValue(true);

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => {
      expect(screen.getByText("Menos de 1 año exp.")).toBeInTheDocument();
      expect(screen.getByText("Sin redes")).toBeInTheDocument();
      expect(screen.getByText("Only one place")).toBeInTheDocument();
      expect(screen.getByText("El artista no ha configurado un QR de donación aún.")).toBeInTheDocument();
      expect(screen.getByText("No hay métodos de donación disponibles.")).toBeInTheDocument();
    });

    const qrContainer = document.createElement("div");
    qrContainer.id = "music-request-qr";
    qrContainer.innerHTML = "<svg></svg>";
    document.body.appendChild(qrContainer);

    fireEvent.click(screen.getByText("Compartir"));
    
    await waitFor(() => {
      expect(navigator.share).toHaveBeenCalled();
    });

    // Share failing case
    (navigator.share as any).mockRejectedValueOnce(new Error("Share failed"));
    fireEvent.click(screen.getByText("Compartir"));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al compartir");
    });

    document.body.removeChild(qrContainer);
  });

  it("handles missing elements for QRs smoothly", async () => {
    setupFetchMock(true, 200, {
      id: "artist3",
      nombre: "Empty QR",
      nombreUsuario: "emptyqr"
    });
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => {
      expect(screen.getByText("Empty QR")).toBeInTheDocument();
    });
    
    const downloadBtns = screen.getAllByText("Descargar");
    fireEvent.click(downloadBtns[downloadBtns.length - 1]);
    fireEvent.click(screen.getByText("Compartir"));
  });
  
  it("shows image modal when clicking zoom in payment qr", async () => {
     setupFetchMock(true, 200, {
      id: "artist2",
      nombre: "Test Artist",
      nombreUsuario: "testuser",
      perfilArtista: {
        pagoQR: "qr-url.png",
        nombreQR: "Yape"
      }
    });

    render(<PaginaPerfilArtistaPublico />);

    await waitFor(() => {
      expect(screen.getByText("Yape")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Yape/i }));
  });
  
  it("handles missing urlPago correctly", async () => {
     setupFetchMock(true, 200, {
      id: "artist2",
      nombre: "Test Artist",
      nombreUsuario: "testuser",
      perfilArtista: {
        urlPago: "https://pagame.pe/"
      }
    });

    render(<PaginaPerfilArtistaPublico />);

    await waitFor(() => {
      expect(screen.getByText("pagame.pe")).toBeInTheDocument();
    });
  });
});
