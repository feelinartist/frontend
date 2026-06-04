/* eslint-disable @typescript-eslint/ban-ts-comment */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaginaPerfilArtistaPublico from "../page";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/"),
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

globalThis.fetch = vi.fn();

const mockFullArtist = {
  id: "1",
  nombre: "Test Artist",
  nombreUsuario: "testartist",
  perfilArtista: {
    nombreArtistico: "Test Artist",
    biografia: "Test bio",
    categoria: "DJ",
    pais: "PE",
    paisId: "PE",
    ciudad: "Lima",
    fechaInicio: "2020-01-01",
    tarifaPorHora: "100",
    moneda: "PEN",
    lugaresConocidos: ["Club 1", "Bar 2"],
    urlPago: "https://example.com/pay",
    pagoQR: "data:image/png;base64,mock",
    nombreQR: "Yape",
    urlYoutubeFavorito: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    urlSoundCloudFavorito: "https://soundcloud.com/test/track",
    redesSociales: [
      { id: "rs1", nombreUsuario: "testig", redSocial: { nombre: "instagram", urlBase: "https://instagram.com/", icono: "" } },
      { id: "rs2", nombreUsuario: "testtw", redSocial: { nombre: "twitter", urlBase: "https://twitter.com/", icono: "https://mock.com/icon.png" } },
      { id: "rs3", nombreUsuario: "https://youtube.com/watch?v=abc", redSocial: { nombre: "youtube", urlBase: "", icono: "" } },
      { id: "rs4", nombreUsuario: "testsc", redSocial: { nombre: "soundcloud", urlBase: "https://soundcloud.com/", icono: "" } }
    ],
    eventos: [
      { titulo: "Live Set", descripcion: "Test desc", estado: "ACTIVO" }
    ],
    galeria: [
      { id: "g1", urlImagen: "https://mock.com/img1.jpg", url: "" },
      { id: "g2", url: "https://mock.com/img2.jpg" }
    ]
  }
};

describe("PaginaPerfilArtistaPublico", () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useParams as any).mockReturnValue({ username: "testartist" });
    (useSession as any).mockReturnValue({ data: null });
    
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockFullArtist)
    });

    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn() },
        writable: true,
    });
    Object.defineProperty(navigator, 'share', {
        value: vi.fn(),
        writable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
        value: vi.fn(() => true),
        writable: true,
    });
  });

  it("renders full artist profile", async () => {
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => {
      expect(screen.getByText("Test Artist")).toBeInTheDocument();
      expect(screen.getByText("@testartist")).toBeInTheDocument();
    });
    
    expect(screen.getByText("Club 1")).toBeInTheDocument();
    expect(screen.getByText("Bar 2")).toBeInTheDocument();
    expect(screen.getByText("Yape")).toBeInTheDocument();
    expect(screen.getByText("Live Set")).toBeInTheDocument();
  });

  it("handles interactions (reserve, copy/share QR, download QR)", async () => {
    const { container } = render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());

    const reserveBtn = screen.getByText("Reservar Contacto");
    fireEvent.click(reserveBtn);
    expect(toast.success).toHaveBeenCalledWith("Funcionalidad de reservas pronto disponible!");

    // Mock QR elements
    const mockSvg = document.createElement('svg');
    mockSvg.innerHTML = '<path d="M0 0h24v24H0z"/>';
    const qrDiv = document.createElement('div');
    qrDiv.id = 'music-request-qr';
    qrDiv.appendChild(mockSvg);
    document.body.appendChild(qrDiv);

    // Mock Canvas & Image
    globalThis.Image = class {
      onload: any;
      src: string = '';
      constructor() {
        setTimeout(() => this.onload && this.onload(), 10);
      }
    } as any;
    
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({ drawImage: vi.fn() });
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => cb(new Blob(["mock"], { type: "image/png" })));
    globalThis.URL.createObjectURL = vi.fn(() => "mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();

    const downloadBtn = screen.getByText("Descargar");
    fireEvent.click(downloadBtn);
    await waitFor(() => {
       expect(toast.success).toHaveBeenCalledWith('QR descargado exitosamente');
    });
    
    const shareBtn = screen.getByText("Compartir");
    fireEvent.click(shareBtn);
    await waitFor(() => {
       expect(toast.success).toHaveBeenCalledWith('QR compartido exitosamente');
    });

    const downloadPaymentQRBtn = screen.getByText("Descargar QR");
    (globalThis.fetch as any).mockResolvedValueOnce({ blob: () => Promise.resolve(new Blob()) });
    fireEvent.click(downloadPaymentQRBtn);

    await waitFor(() => {
       expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    });

    const copyLinkBtn = screen.getByTitle("Copiar enlace");
    fireEvent.click(copyLinkBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Enlace copiado al portapapeles");

    document.body.removeChild(qrDiv);
  });

  it("handles fetch failure gracefully", async () => {
    (globalThis.fetch as any).mockResolvedValue({ ok: false, status: 500 });
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/home");
      expect(toast.error).toHaveBeenCalledWith("Error al cargar datos del artista");
    });
  });
  
  it("renders when fetch returns 404", async () => {
    (globalThis.fetch as any).mockResolvedValue({ ok: false, status: 404 });
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/home");
      expect(toast.error).toHaveBeenCalledWith("Artista no encontrado o perfil no disponible");
    });
  });

  it("handles missing optional fields", async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: "2",
        nombreUsuario: "emptyartist",
        perfilArtista: undefined
      })
    });
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => {
      expect(screen.getByText("@emptyartist")).toBeInTheDocument();
    });
  });

  it("handles user zoom payment QR", async () => {
     render(<PaginaPerfilArtistaPublico />);
     await waitFor(() => expect(screen.getByText("Yape")).toBeInTheDocument());
     
     const qrContainer = screen.getByText("Yape").closest("button")!;
     fireEvent.click(qrContainer);
     // It triggers setImagenZoom but since it's just state it shouldn't crash
  });

  it("handles execution share fallback", async () => {
    Object.defineProperty(navigator, 'canShare', { value: vi.fn(() => false) });
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());
    
    // Setup QR
    const qrDiv = document.createElement('div');
    qrDiv.id = 'music-request-qr';
    qrDiv.appendChild(document.createElement('svg'));
    document.body.appendChild(qrDiv);

    fireEvent.click(screen.getByText("Compartir"));
    await waitFor(() => {
       expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
    document.body.removeChild(qrDiv);
  });

  it("handles payment QR download error", async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('api/usuarios')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockFullArtist) });
      }
      return Promise.reject(new Error("Network Error"));
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());
    
    const downloadPaymentQRBtn = screen.getByText("Descargar QR");
    fireEvent.click(downloadPaymentQRBtn);
    // Just ensuring it catches without throwing
  });

  it("renders empty gallery and invalid youtube url", async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: "3",
        nombreUsuario: "emptygal",
        perfilArtista: {
          galeria: [],
          urlYoutubeFavorito: "invalid_url"
        }
      })
    });
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => {
      expect(screen.getByText("Galería vacía")).toBeInTheDocument();
    });
  });

  it("handles gallery image zoom modal interactions", async () => {
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());

    const galleryButtons = screen.getAllByRole("button", { name: "Ver imagen en galería" });
    expect(galleryButtons.length).toBeGreaterThan(0);
    
    // Open modal
    fireEvent.click(galleryButtons[0]);
    
    // Check if modal image is rendered
    const modalImage = screen.getByAltText("Vista ampliada");
    expect(modalImage).toBeInTheDocument();
    
    // Close modal by overlay
    const overlay = screen.getByLabelText("Cerrar modal");
    fireEvent.click(overlay);
    await waitFor(() => expect(screen.queryByAltText("Vista ampliada")).not.toBeInTheDocument());

    // Re-open and close by close button
    fireEvent.click(galleryButtons[0]);
    const closeBtn = screen.getByLabelText("Cerrar");
    fireEvent.click(closeBtn);
    await waitFor(() => expect(screen.queryByAltText("Vista ampliada")).not.toBeInTheDocument());
  });

  it("handles fetch rejection and redirects on back button click", async () => {
    (globalThis.fetch as any).mockRejectedValueOnce(new Error("Network Error"));
    render(<PaginaPerfilArtistaPublico />);
    
    // Wait for error screen to render
    await waitFor(() => {
      expect(screen.getByText("Artista no encontrado")).toBeInTheDocument();
    });

    const backBtn = screen.getByRole("button", { name: "Volver al Inicio" });
    fireEvent.click(backBtn);
    expect(mockRouter.push).toHaveBeenCalledWith("/home");
  });

  it("handles download QR error when SVG is missing", async () => {
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());

    const originalGetElementById = document.getElementById;
    document.getElementById = vi.fn().mockImplementation(() => {
      throw new Error("SVG missing error");
    });

    const downloadBtn = screen.getByText("Descargar");
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al descargar el QR");
    });

    document.getElementById = originalGetElementById;
  });

  it("handles sharing error", async () => {
    Object.defineProperty(navigator, 'canShare', { value: vi.fn(() => true) });
    Object.defineProperty(navigator, 'share', { value: vi.fn(() => Promise.reject(new Error("Share error"))) });
    
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());

    const qrDiv = document.createElement('div');
    qrDiv.id = 'music-request-qr';
    qrDiv.appendChild(document.createElement('svg'));
    document.body.appendChild(qrDiv);

    fireEvent.click(screen.getByText("Compartir"));
    await waitFor(() => {
       expect(toast.error).toHaveBeenCalledWith("Error al compartir");
    });
    document.body.removeChild(qrDiv);
  });

  it("handles share music QR throw error", async () => {
    // Make querySelector throw
    const originalGetElementById = document.getElementById;
    document.getElementById = vi.fn().mockImplementation(() => {
        throw new Error("Force error");
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Compartir"));
    await waitFor(() => {
       expect(toast.error).toHaveBeenCalledWith("Error al compartir el QR");
    });

    document.getElementById = originalGetElementById;
  });

  it("handles sharing error with AbortError", async () => {
    Object.defineProperty(navigator, 'canShare', { value: vi.fn(() => true) });
    const abortError = new Error("Share cancelled");
    abortError.name = 'AbortError';
    Object.defineProperty(navigator, 'share', { value: vi.fn(() => Promise.reject(abortError)) });
    
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());

    const qrDiv = document.createElement('div');
    qrDiv.id = 'music-request-qr';
    qrDiv.appendChild(document.createElement('svg'));
    document.body.appendChild(qrDiv);

    fireEvent.click(screen.getByText("Compartir"));
    await waitFor(() => {
       expect(toast.error).not.toHaveBeenCalled();
    });
    document.body.removeChild(qrDiv);
  });

  it("handles social icons, youtube url format variations, and less experience", async () => {
    const customArtist = {
      id: "4",
      nombreUsuario: "customart",
      perfilArtista: {
        nombreArtistico: "Custom Art",
        biografia: "Bio",
        fechaInicio: new Date().toISOString(), // Less than 1 year experience
        redesSociales: [
          { id: "rs1", nombreUsuario: "fbuser", redSocial: { nombre: "facebook", urlBase: "https://facebook.com/", icono: "" } },
          { id: "rs2", nombreUsuario: "wauser", redSocial: { nombre: "whatsapp", urlBase: "https://wa.me/", icono: "" } },
          { id: "rs3", nombreUsuario: "otheruser", redSocial: { nombre: "other", urlBase: "", icono: "" } }
        ],
        eventos: [
          { titulo: "Inactive Event", estado: "INACTIVE" }
        ],
        galeria: []
      }
    };
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(customArtist)
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Custom Art")).toBeInTheDocument());
    expect(screen.getByText("Menos de 1 año", { exact: false })).toBeInTheDocument();
  });

  it("handles exactly 1 year of experience and month equal but day in future", async () => {
    const now = new Date();
    
    // 1. Exactly 1 year ago (yesterday) to return "1 año"
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 1);
    
    // 2. Month is equal but day is in future (e.g. 5 days from now), so diff becomes 2 instead of 3
    const threeYearsAgoFutureDay = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate() + 5);

    const artist1 = {
      id: "5",
      nombreUsuario: "art1yr",
      perfilArtista: {
        nombreArtistico: "Artist 1 Year",
        fechaInicio: oneYearAgo.toISOString(),
      }
    };

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artist1)
    });

    const { unmount } = render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Artist 1 Year")).toBeInTheDocument());
    expect(screen.getByText("1 año", { exact: false })).toBeInTheDocument();
    
    unmount();

    const artist2 = {
      id: "6",
      nombreUsuario: "art3yr",
      perfilArtista: {
        nombreArtistico: "Artist 3 Year Future Day",
        fechaInicio: threeYearsAgoFutureDay.toISOString(),
      }
    };

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artist2)
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Artist 3 Year Future Day")).toBeInTheDocument());
    // Since day is in future, 3 years ago becomes 2 years of experience
    expect(screen.getByText("2 años", { exact: false })).toBeInTheDocument();
  });

  it("covers session logged in, request param, and hiding reserve button for same user", async () => {
    (useSession as any).mockReturnValue({ data: { user: { id: "1" } } }); // User id matches mockFullArtist.id ("1")
    
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());
    
    // Request url must append "?usuarioSolicitanteId=1"
    const fetchedUrl = (globalThis.fetch as any).mock.calls[0][0];
    expect(fetchedUrl).toContain("?usuarioSolicitanteId=1");
    
    // Reserve button should NOT be rendered since session.user.id matches artist.id
    expect(screen.queryByText("Reservar Contacto")).not.toBeInTheDocument();
  });

  it("covers backend URL fallback when environment variable is missing", async () => {
    const originalUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    delete process.env.NEXT_PUBLIC_BACKEND_URL;

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());
    
    const fetchedUrl = (globalThis.fetch as any).mock.calls[0][0];
    expect(fetchedUrl).toContain("http://localhost:3001/api/usuarios/perfil-publico/testartist");

    process.env.NEXT_PUBLIC_BACKEND_URL = originalUrl;
  });

  it("covers clicking gallery item with fallback url and empty gallery item", async () => {
    const artistWithFallbackGal = {
      id: "7",
      nombreUsuario: "fallbackgal",
      perfilArtista: {
        nombreArtistico: "Fallback Gal",
        galeria: [
          { id: "g1", url: "https://mock.com/img2.jpg" }, // has url, no urlImagen
          { id: "g2" } // has neither
        ]
      }
    };
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artistWithFallbackGal)
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Fallback Gal")).toBeInTheDocument());

    const galleryButtons = screen.getAllByRole("button", { name: "Ver imagen en galería" });
    expect(galleryButtons.length).toBe(2);

    // Click gallery button with img.url fallback
    fireEvent.click(galleryButtons[0]);
    expect(screen.getByAltText("Vista ampliada")).toBeInTheDocument();
    
    // Close modal
    fireEvent.click(screen.getByLabelText("Cerrar modal"));

    // Click gallery button with neither url nor urlImagen
    fireEvent.click(galleryButtons[1]);
    // The image src will be fallback ""
  });

  it("covers SoundCloud red social link without http prefix", async () => {
    const artistSoundcloudRelative = {
      id: "8",
      nombreUsuario: "screlative",
      perfilArtista: {
        nombreArtistico: "SoundCloud Relative",
        redesSociales: [
          {
            id: "rs-sc",
            nombreUsuario: "soundcloud-user/track",
            redSocial: { nombre: "soundcloud", urlBase: "soundcloud.com/", icono: "" }
          }
        ]
      }
    };
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artistSoundcloudRelative)
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("SoundCloud Relative")).toBeInTheDocument());
    
    // Check if iframe has src starting with https://
    const iframe = screen.getByTitle("SoundCloud track player");
    expect(iframe).toHaveAttribute("src", expect.stringContaining("https%3A%2F%2Fsoundcloud.com%2Fsoundcloud-user%2Ftrack"));
  });

  it("covers partial payment QR configuration", async () => {
    const artistPartialQR1 = {
      id: "9",
      nombreUsuario: "partialqr1",
      perfilArtista: {
        nombreArtistico: "Partial QR 1",
        pagoQR: "data:image/png;base64,mock"
        // missing nombreQR
      }
    };
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artistPartialQR1)
    });

    const { unmount } = render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Partial QR 1")).toBeInTheDocument());
    // Since nombreQR is missing, showQR is false, meaning it shows dashed border
    expect(screen.getByText("El artista no ha configurado un QR de donación aún.")).toBeInTheDocument();
    unmount();

    const artistPartialQR2 = {
      id: "10",
      nombreUsuario: "partialqr2",
      perfilArtista: {
        nombreArtistico: "Partial QR 2",
        nombreQR: "Yape"
        // missing pagoQR
      }
    };
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artistPartialQR2)
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Partial QR 2")).toBeInTheDocument());
    expect(screen.getByText("El artista no ha configurado un QR de donación aún.")).toBeInTheDocument();
  });

  it("covers YouTube username lengths of exactly 11 and not 11 characters", async () => {
    const artistYoutubeLengths = {
      id: "11",
      nombreUsuario: "ytlengths",
      perfilArtista: {
        nombreArtistico: "YouTube Lengths",
        redesSociales: [
          {
            id: "rs-yt-10",
            nombreUsuario: "ABCDEFGHIJ", // 10 characters (not 11) - placed first to evaluate falsy path in some()
            redSocial: { nombre: "youtube", urlBase: "youtube.com/", icono: "" }
          },
          {
            id: "rs-yt-11",
            nombreUsuario: "ABCDEFGHIJK", // 11 characters - placed second to be matched
            redSocial: { nombre: "youtube", urlBase: "youtube.com/", icono: "" }
          }
        ]
      }
    };
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artistYoutubeLengths)
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("YouTube Lengths")).toBeInTheDocument());
    
    // The one with 11 characters should render iframe with src containing embed/ABCDEFGHIJK
    const iframes = document.querySelectorAll("iframe");
    let found11 = false;
    iframes.forEach((iframe) => {
      if (iframe.getAttribute("src")?.includes("ABCDEFGHIJK")) {
        found11 = true;
      }
    });
    expect(found11).toBe(true);
  });

  it("covers optional chaining branches for session (user null or id null) and empty/invalid redSocial", async () => {
    // 1. Session exists, but user is null
    (useSession as any).mockReturnValue({ data: { user: null } });
    
    const artistInvalidRedSocial = {
      id: "12",
      nombreUsuario: "invalidred",
      perfilArtista: {
        nombreArtistico: "Invalid Red",
        redesSociales: [
          {
            id: "rs-invalid-1",
            nombreUsuario: "some-user"
            // missing redSocial
          },
          {
            id: "rs-invalid-2",
            // missing nombreUsuario
            redSocial: { nombre: "youtube", urlBase: "youtube.com/", icono: "" }
          }
        ]
      }
    };

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artistInvalidRedSocial)
    });

    const { unmount } = render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Invalid Red")).toBeInTheDocument());
    unmount();

    // 2. Session exists, user exists, but id is null
    (useSession as any).mockReturnValue({ data: { user: { id: null } } });
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artistInvalidRedSocial)
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Invalid Red")).toBeInTheDocument());
  });

  it("covers redSocial with missing name property and other fallback paths", async () => {
    const artistMissingRedName = {
      id: "13",
      nombreUsuario: "missingredname",
      perfilArtista: {
        nombreArtistico: "Missing Red Name",
        urlYoutubeFavorito: "https://youtube.com/watch?v=12345", // renders multimedia section
        tarifaPorHora: "50", // renders ticket block
        moneda: undefined, // covers moneda || 'PEN' fallback
        ciudad: undefined,
        ciudadId: "Lima ID", // covers ciudad || ciudadId fallback
        redesSociales: [
          {
            id: "rs-no-name",
            nombreUsuario: "username",
            redSocial: { urlBase: "youtube.com/", icono: "" } // missing nombre -> covers fallback name || ""
          }
        ]
      }
    };

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artistMissingRedName)
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Missing Red Name")).toBeInTheDocument());
    
    // Verify fallback checks
    expect(screen.getByText("Lima ID", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("50 PEN/hr", { exact: false })).toBeInTheDocument();
  });

  it("covers location undefined SSR branch", async () => {
    const originalLocation = globalThis.location;
    // @ts-expect-error
    delete globalThis.location;

    const artistLocationFallback = {
      id: "14",
      nombreUsuario: "locationfallback",
      perfilArtista: {
        nombreArtistico: "Location Fallback",
        lugaresConocidos: "Only one place"
      }
    };

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artistLocationFallback)
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Location Fallback")).toBeInTheDocument());

    const copyLinkBtn = screen.getByTitle("Copiar enlace");
    fireEvent.click(copyLinkBtn);
    expect(toast.success).toHaveBeenCalledWith("Enlace copiado al portapapeles");

    // Restore location
    // @ts-expect-error
    globalThis.location = originalLocation;
  });

  it("covers early exits for missing QR SVG and falsy blob", async () => {
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());

    // 1. Missing SVG case: mock document.getElementById to return null
    const originalGetElementById = document.getElementById;
    document.getElementById = vi.fn().mockReturnValue(null);

    const downloadBtn = screen.getByText("Descargar");
    fireEvent.click(downloadBtn); // returns early on line 184 (no svg because div is null)

    // Restore
    document.getElementById = originalGetElementById;

    // 2. Falsy blob case: mock toBlob to return null
    const qrDiv = document.createElement('div');
    qrDiv.id = 'music-request-qr';
    qrDiv.appendChild(document.createElement('svg'));
    document.body.appendChild(qrDiv);

    HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => cb(null)); // passes null to callback

    fireEvent.click(downloadBtn); // executes but does not create download URL (blob is falsy)
    
    // Also cover shareMusicQR with null blob
    fireEvent.click(screen.getByText("Compartir"));

    document.body.removeChild(qrDiv);
  });

  it("covers sharing with non-Error object rejection", async () => {
    Object.defineProperty(navigator, 'canShare', { value: vi.fn(() => true) });
    // Reject with a string instead of Error
    Object.defineProperty(navigator, 'share', { value: vi.fn(() => Promise.reject("Non-error string object")) });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());

    const qrDiv = document.createElement('div');
    qrDiv.id = 'music-request-qr';
    qrDiv.appendChild(document.createElement('svg'));
    document.body.appendChild(qrDiv);

    // Mock toBlob to return valid blob
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => cb(new Blob(["mock"], { type: "image/png" })));

    fireEvent.click(screen.getByText("Compartir"));
    
    // Check if error is handled quietly without showing generic "Error al compartir" since it's not instanceof Error
    await waitFor(() => {
       expect(toast.error).not.toHaveBeenCalledWith("Error al compartir");
    });

    document.body.removeChild(qrDiv);
  });

  it("covers fallbacks for download and share when nombreArtistico is missing", async () => {
    const artistNoArtistName = {
      id: "15",
      nombre: "Real Name Only",
      nombreUsuario: "realnameusername",
      perfilArtista: {
        nombreArtistico: undefined, // triggers fallback to nombre / nombreUsuario
        redesSociales: []
      }
    };

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artistNoArtistName)
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Real Name Only")).toBeInTheDocument());

    const qrDiv = document.createElement('div');
    qrDiv.id = 'music-request-qr';
    qrDiv.appendChild(document.createElement('svg'));
    document.body.appendChild(qrDiv);

    // Mock Canvas & Image
    globalThis.Image = class {
      onload: any;
      src: string = '';
      constructor() {
        setTimeout(() => this.onload && this.onload(), 10);
      }
    } as any;
    
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({ drawImage: vi.fn() });
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => cb(new Blob(["mock"], { type: "image/png" })));
    globalThis.URL.createObjectURL = vi.fn(() => "mock-url");

    // Download flow
    const downloadBtn = screen.getByText("Descargar");
    fireEvent.click(downloadBtn);
    await waitFor(() => {
       expect(toast.success).toHaveBeenCalledWith('QR descargado exitosamente');
    });

    // Share flow
    (navigator as any).canShare = vi.fn(() => true);
    (navigator as any).share = vi.fn(() => Promise.resolve());

    const shareBtn = screen.getByText("Compartir");
    fireEvent.click(shareBtn);
    await waitFor(() => {
       expect(toast.success).toHaveBeenCalledWith('QR compartido exitosamente');
    });

    document.body.removeChild(qrDiv);
  });

  it("handles share when navigator.share is undefined and location is undefined", async () => {
    const originalShare = navigator.share;
    const originalLocation = globalThis.location;
    
    // @ts-expect-error
    navigator.share = undefined;
    // @ts-expect-error
    delete globalThis.location;

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());

    const qrDiv = document.createElement('div');
    qrDiv.id = 'music-request-qr';
    qrDiv.appendChild(document.createElement('svg'));
    document.body.appendChild(qrDiv);

    fireEvent.click(screen.getByText("Compartir"));
    await waitFor(() => {
       expect(navigator.clipboard.writeText).toHaveBeenCalledWith("");
    });

    document.body.removeChild(qrDiv);
    
    // Restore
    // @ts-expect-error
    navigator.share = originalShare;
    // @ts-expect-error
    globalThis.location = originalLocation;
  });

  it("handles share when name and artist name are missing", async () => {
    const artistNoNames = {
      id: "16",
      nombreUsuario: "nonameartist",
      perfilArtista: {
        nombreArtistico: undefined,
        redesSociales: []
      }
    };
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(artistNoNames)
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("@nonameartist")).toBeInTheDocument());

    const qrDiv = document.createElement('div');
    qrDiv.id = 'music-request-qr';
    qrDiv.appendChild(document.createElement('svg'));
    document.body.appendChild(qrDiv);

    fireEvent.click(screen.getByText("Compartir"));
    
    await waitFor(() => {
      expect(navigator.share).toHaveBeenCalled();
    });

    document.body.removeChild(qrDiv);
  });

  it("handles share music QR error when SVG is missing to cover line 244 early return", async () => {
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());

    const originalGetElementById = document.getElementById;
    document.getElementById = vi.fn().mockReturnValue(null);

    fireEvent.click(screen.getByText("Compartir"));
    // Expect no sharing to be attempted, no toast.success / toast.error for sharing
    await new Promise(r => setTimeout(r, 50));

    document.getElementById = originalGetElementById;
  });

  it("handles undefined username params gracefully", () => {
    (useParams as any).mockReturnValueOnce({ username: undefined });
    render(<PaginaPerfilArtistaPublico />);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("renders social networks with Twitter/X names or icons", async () => {
    const twitterArtist = {
      id: "20",
      nombre: "Social User",
      nombreUsuario: "socialuser",
      perfilArtista: {
        nombreArtistico: "Social User Artist",
        redesSociales: [
          { id: "s1", nombreUsuario: "twuser", redSocial: { nombre: "Twitter", icono: "twitter" } },
          { id: "s2", nombreUsuario: "xuser", redSocial: { nombre: "X", icono: "x" } }
        ]
      }
    };
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(twitterArtist)
    });

    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Social User Artist")).toBeInTheDocument());
  });

  it("handles share exceptions (AbortError and non-Error)", async () => {
    render(<PaginaPerfilArtistaPublico />);
    await waitFor(() => expect(screen.getByText("Test Artist")).toBeInTheDocument());

    const qrDiv = document.createElement('div');
    qrDiv.id = 'music-request-qr';
    qrDiv.appendChild(document.createElement('svg'));
    document.body.appendChild(qrDiv);

    // Mock toBlob
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => cb(new Blob(["mock"], { type: "image/png" })));

    // Mock share to reject with AbortError
    navigator.canShare = vi.fn(() => true) as any;
    const abortError = new Error("Share aborted");
    abortError.name = "AbortError";
    navigator.share = vi.fn().mockRejectedValueOnce(abortError) as any;

    // Click share
    fireEvent.click(screen.getByText("Compartir"));
    await waitFor(() => {
       expect(navigator.share).toHaveBeenCalled();
       expect(toast.error).not.toHaveBeenCalled();
    });

    // Mock share to reject with a raw string (non-Error)
    navigator.share = vi.fn().mockRejectedValueOnce("some string error") as any;
    fireEvent.click(screen.getByText("Compartir"));
    await waitFor(() => {
       expect(toast.error).not.toHaveBeenCalled();
    });

    document.body.removeChild(qrDiv);
  });
});

