import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RequestMusicForm } from "../request-music-form";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} alt={props.alt || "mock"} />,
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));

describe("RequestMusicForm", () => {
  const defaultProps = {
    eventoId: "evento-123",
    artistName: "DJ Test",
  };

  const artistProfileWithDonation = {
    pagoQR: "data:image/png;base64,mockqr",
    nombreQR: "MyQR",
    urlPago: "https://paypal.me/djtest",
    metodosDonacion: [{ metodoDonacion: { nombre: "Yape" }, numeroCuenta: "987654321" }],
    redesSociales: [
      { redSocial: { urlBase: "https://instagram.com/", nombre: "Instagram" }, nombreUsuario: "djtest" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders correctly", () => {
    render(<RequestMusicForm {...defaultProps} />);
    expect(screen.getByText(/Buscar Canción o Artista/i)).toBeInTheDocument();
    expect(screen.getByText(/Tu Nombre/i)).toBeInTheDocument();
  });

  it("handles search and selection of a track", async () => {
    const mockTracks = {
      results: [
        {
          trackId: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          artworkUrl100: "http://example.com/image_100x100.jpg",
          primaryGenreName: "Pop",
          previewUrl: "http://example.com/preview.mp3",
        },
      ],
    };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTracks,
    });

    render(<RequestMusicForm {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/Busca por título o artista.../i);
    await userEvent.type(searchInput, "Test Song");

    await waitFor(() => {
      expect(screen.getByText("Test Song")).toBeInTheDocument();
    });

    // Select track
    fireEvent.click(screen.getByText("Test Song"));

    expect(screen.getByText("Test Artist")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Busca por título o artista.../i)).not.toBeInTheDocument();

    // Remove track
    const removeBtn = screen.getByRole("button", { name: "" }); // the X button
    fireEvent.click(removeBtn);

    expect(screen.getByPlaceholderText(/Busca por título o artista.../i)).toBeInTheDocument();
  });

  it("handles search error 403", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
    });

    render(<RequestMusicForm {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(/Busca por título o artista.../i);
    await userEvent.type(searchInput, "Test Song");

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Muchas búsquedas recientes. Espera unos segundos.");
    });
  });

  it("submits the form successfully", async () => {
    const mockTracks = {
      results: [
        {
          trackId: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          artworkUrl100: "http://example.com/image_100x100.jpg",
        },
      ],
    };
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockTracks }) // Search
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // Submit

    render(<RequestMusicForm {...defaultProps} artistProfile={artistProfileWithDonation} />);

    await userEvent.type(screen.getByPlaceholderText(/Busca por título o artista.../i), "Test Song");
    await waitFor(() => screen.getByText("Test Song"));
    fireEvent.click(screen.getByText("Test Song"));

    await userEvent.type(screen.getByPlaceholderText(/Ej. Juan Pérez/i), "Juan");

    fireEvent.click(screen.getByRole("button", { name: /Enviar Pedido/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("¡Pedido enviado!");
    });
    
    // Check success screen
    expect(screen.getByText("¡Pedido Enviado!")).toBeInTheDocument();
    expect(screen.getByText("¿Te gusta la música? Apoya al DJ")).toBeInTheDocument();

    // Test copy donation
    const copyBtn = screen.getByTitle("Copiar número");
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("987654321");
    expect(toast.success).toHaveBeenCalledWith("Copiado al portapapeles");

    // Test download QR
    (global.fetch as any).mockResolvedValueOnce({ blob: async () => new Blob() });
    const downloadBtn = screen.getByText("Descargar QR");
    fireEvent.click(downloadBtn);
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    // Back to form
    fireEvent.click(screen.getByRole("button", { name: "Pedir otra canción" }));
    expect(screen.queryByText("¡Pedido Enviado!")).not.toBeInTheDocument();
  });

  it("shows error if missing track or name on submit", async () => {
    render(<RequestMusicForm {...defaultProps} />);
    const form = screen.getByRole("button", { name: /Enviar Pedido/i }).closest("form");
    fireEvent.submit(form!);
    expect(toast.error).toHaveBeenCalledWith("Selecciona una canción y tu nombre");
  });

  it("handles submit failure", async () => {
    const mockTracks = {
      results: [
        {
          trackId: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          artworkUrl100: "http://example.com/image_100x100.jpg",
        },
      ],
    };
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockTracks }) // Search
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Failed" }) }); // Submit

    render(<RequestMusicForm {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText(/Busca por título o artista.../i), "Test Song");
    await waitFor(() => screen.getByText("Test Song"));
    fireEvent.click(screen.getByText("Test Song"));

    await userEvent.type(screen.getByPlaceholderText(/Ej. Juan Pérez/i), "Juan");

    fireEvent.click(screen.getByRole("button", { name: /Enviar Pedido/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed");
    });
  });

  it("handles submit failure with fallback message when error field is missing", async () => {
    const mockTracks = {
      results: [
        {
          trackId: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          artworkUrl100: "http://example.com/image_100x100.jpg",
        },
      ],
    };
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockTracks })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    render(<RequestMusicForm {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText(/Busca por título o artista.../i), "Test Song");
    await waitFor(() => screen.getByText("Test Song"));
    fireEvent.click(screen.getByText("Test Song"));

    await userEvent.type(screen.getByPlaceholderText(/Ej. Juan Pérez/i), "Juan");

    fireEvent.click(screen.getByRole("button", { name: /Enviar Pedido/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al enviar pedido");
    });
  });

  it("handles submit connection error", async () => {
    const mockTracks = {
      results: [
        {
          trackId: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          artworkUrl100: "http://example.com/image_100x100.jpg",
        },
      ],
    };
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockTracks }) // Search
      .mockRejectedValueOnce(new Error("Network Error")); // Submit

    render(<RequestMusicForm {...defaultProps} />);

    await userEvent.type(screen.getByPlaceholderText(/Busca por título o artista.../i), "Test Song");
    await waitFor(() => screen.getByText("Test Song"));
    fireEvent.click(screen.getByText("Test Song"));

    await userEvent.type(screen.getByPlaceholderText(/Ej. Juan Pérez/i), "Juan");

    fireEvent.click(screen.getByRole("button", { name: /Enviar Pedido/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error de conexión");
    });
  });

  it("clears search results when query is short", async () => {
    render(<RequestMusicForm {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(/Busca por título o artista.../i);
    await userEvent.type(searchInput, "Te"); // 2 chars
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it("handles download QR error", async () => {
    const mockTracks = { results: [{ trackId: 1, trackName: "Test", artistName: "A", artworkUrl100: "" }] };
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockTracks })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockRejectedValueOnce(new Error("Failed fetching QR"));

    global.open = vi.fn();

    render(<RequestMusicForm {...defaultProps} artistProfile={artistProfileWithDonation} />);
    await userEvent.type(screen.getByPlaceholderText(/Busca por título/i), "Tes");
    await waitFor(() => screen.getByText("Test"));
    fireEvent.click(screen.getByText("Test"));
    await userEvent.type(screen.getByPlaceholderText(/Juan/i), "J");
    fireEvent.click(screen.getByRole("button", { name: /Enviar Pedido/i }));

    await waitFor(() => screen.getByText("Descargar QR"));
    fireEvent.click(screen.getByText("Descargar QR"));

    await waitFor(() => {
      expect(global.open).toHaveBeenCalledWith("data:image/png;base64,mockqr", "_blank");
    });
  });

  it("clears results on query clear and handles search fetch rejection", async () => {
    const mockTracks = { results: [{ trackId: 1, trackName: "Test Song", artistName: "Test Artist", artworkUrl100: "" }] };
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => mockTracks });

    render(<RequestMusicForm {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(/Busca por título o artista.../i);
    await userEvent.type(searchInput, "Tes");
    await waitFor(() => expect(screen.getByText("Test Song")).toBeInTheDocument());

    // Clear input to trigger the query length < 3 logic (else block)
    await userEvent.clear(searchInput);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 700));
    });
    expect(screen.queryByText("Test Song")).not.toBeInTheDocument();

    // Trigger rejected value
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as any).mockRejectedValueOnce(new Error("Search error"));
    await userEvent.type(searchInput, "Tes");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 700));
    });
    consoleSpy.mockRestore();
  });

  it("handles search failure response (not ok)", async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false });

    render(<RequestMusicForm {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(/Busca por título o artista.../i);
    await userEvent.type(searchInput, "Tes");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 700));
    });
    expect(screen.queryByText("Test Song")).not.toBeInTheDocument();
  });

  it("handles search response without results field", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<RequestMusicForm {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(/Busca por título o artista.../i);
    await userEvent.type(searchInput, "Test");
    await act(async () => {
      await new Promise((r) => setTimeout(r, 700));
    });
    expect(screen.queryByText("Test Song")).not.toBeInTheDocument();
  });

  it("covers fallback qr-donacion.png and icon rendering on social media links", async () => {
    const artistProfileCustom = {
      pagoQR: "data:image/png;base64,mockqr",
      nombreQR: "",
      redesSociales: [
        { redSocial: { urlBase: "https://twitter.com/", nombre: "Twitter", icono: "http://example.com/icon.png" }, nombreUsuario: "djtest" },
      ],
    };

    const mockTracks = {
      results: [
        {
          trackId: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          artworkUrl100: "http://example.com/image_100x100.jpg",
        },
      ],
    };
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockTracks })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<RequestMusicForm {...defaultProps} artistProfile={artistProfileCustom} />);

    await userEvent.type(screen.getByPlaceholderText(/Busca por título o artista.../i), "Test Song");
    await waitFor(() => screen.getByText("Test Song"));
    fireEvent.click(screen.getByText("Test Song"));

    await userEvent.type(screen.getByPlaceholderText(/Ej. Juan Pérez/i), "Juan");
    fireEvent.click(screen.getByRole("button", { name: /Enviar Pedido/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("¡Pedido enviado!");
    });

    // Check that the icon image was rendered
    const iconImg = screen.getByAltText("Twitter");
    expect(iconImg).toBeInTheDocument();
    expect(iconImg).toHaveAttribute("src", "http://example.com/icon.png");

    (global.fetch as any).mockResolvedValueOnce({ blob: async () => new Blob() });
    const downloadBtn = screen.getByText("Descargar QR");
    fireEvent.click(downloadBtn);
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it("covers when hasDonationOptions is false but hasSocialMedia is true", async () => {
    const artistProfileCustom = {
      redesSociales: [
        { redSocial: { urlBase: "https://twitter.com/", nombre: "Twitter" }, nombreUsuario: "djtest" },
      ],
    };

    const mockTracks = {
      results: [
        {
          trackId: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          artworkUrl100: "http://example.com/image_100x100.jpg",
        },
      ],
    };
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockTracks })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<RequestMusicForm {...defaultProps} artistProfile={artistProfileCustom} />);

    await userEvent.type(screen.getByPlaceholderText(/Busca por título o artista.../i), "Test Song");
    await waitFor(() => screen.getByText("Test Song"));
    fireEvent.click(screen.getByText("Test Song"));

    await userEvent.type(screen.getByPlaceholderText(/Ej. Juan Pérez/i), "Juan");
    fireEvent.click(screen.getByRole("button", { name: /Enviar Pedido/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("¡Pedido enviado!");
    });

    // Header should be "Sigue al DJ en redes"
    expect(screen.getByText("Sigue al DJ en redes")).toBeInTheDocument();
  });

  it("covers when showSection is false (no donation and no social media)", async () => {
    const mockTracks = {
      results: [
        {
          trackId: 1,
          trackName: "Test Song",
          artistName: "Test Artist",
          artworkUrl100: "http://example.com/image_100x100.jpg",
        },
      ],
    };
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockTracks })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<RequestMusicForm {...defaultProps} artistProfile={{}} />);

    await userEvent.type(screen.getByPlaceholderText(/Busca por título o artista.../i), "Test Song");
    await waitFor(() => screen.getByText("Test Song"));
    fireEvent.click(screen.getByText("Test Song"));

    await userEvent.type(screen.getByPlaceholderText(/Ej. Juan Pérez/i), "Juan");
    fireEvent.click(screen.getByRole("button", { name: /Enviar Pedido/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("¡Pedido enviado!");
    });

    // No extra section at all (neither header should be present)
    expect(screen.queryByText("Sigue al DJ en redes")).not.toBeInTheDocument();
    expect(screen.queryByText("¿Te gusta la música? Apoya al DJ")).not.toBeInTheDocument();
  });

  it("renders loader while searching", async () => {
    (global.fetch as any).mockImplementationOnce(() => new Promise(() => {}));

    const { container } = render(<RequestMusicForm {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(/Busca por título o artista.../i);
    await userEvent.type(searchInput, "Test Song");

    await act(async () => {
      await new Promise((r) => setTimeout(r, 650));
    });

    const loader = container.querySelector(".animate-spin");
    expect(loader).toBeInTheDocument();
  });
});
