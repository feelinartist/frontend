import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { RequestMusicForm } from "../request-music-form";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { toast } from "sonner";

// Mock sonner
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("RequestMusicForm Component", () => {
    const mockArtistProfile = {
        pagoQR: "https://example.com/qr.png",
        musicQR: null,
        nombreQR: "Mi QR de Pago",
        urlPago: "https://example.com/pago",
        metodosDonacion: [
            {
                metodoDonacion: { nombre: "Nequi" },
                numeroCuenta: "1234567890",
            },
        ],
        redesSociales: [
            {
                redSocial: { urlBase: "https://instagram.com/", icono: "https://example.com/ig.png", nombre: "Instagram" },
                nombreUsuario: "myusername",
            },
            {
                redSocial: { urlBase: "https://youtube.com/", icono: null, nombre: "YouTube" },
                nombreUsuario: "mychannel",
            },
        ],
    };

    const mockTrack = {
        trackId: 101,
        trackName: "Test Track",
        artistName: "Test Artist",
        artworkUrl100: "https://example.com/image100x100.png",
        primaryGenreName: "Pop",
        previewUrl: "https://example.com/preview.mp3",
    };

    let originalSetTimeout: typeof global.setTimeout;
    let originalClearTimeout: typeof global.clearTimeout;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset process.env for tests
        process.env.NEXT_PUBLIC_BACKEND_URL = "https://backend.example.com";
        
        // Mock global and window fetch
        global.fetch = vi.fn();
        window.fetch = global.fetch;
        
        // Mock window.open
        window.open = vi.fn();
        
        // Mock navigator.clipboard
        Object.defineProperty(navigator, "clipboard", {
            value: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
            writable: true,
            configurable: true,
        });
        
        // Mock URL.createObjectURL/revokeObjectURL
        window.URL.createObjectURL = vi.fn(() => "blob:https://example.com/blob-id");
        window.URL.revokeObjectURL = vi.fn();

        // Save original functions and assign mocks directly
        originalSetTimeout = global.setTimeout;
        originalClearTimeout = global.clearTimeout;

        global.setTimeout = function (cb: any, delay: any, ...args: any[]) {
            if (delay === 600) {
                cb();
                return 999 as any;
            }
            return originalSetTimeout(cb, delay, ...args);
        } as any;

        global.clearTimeout = function (id: any) {
            if (id === 999) {
                return;
            }
            return originalClearTimeout(id);
        } as any;
    });

    afterEach(() => {
        global.setTimeout = originalSetTimeout;
        global.clearTimeout = originalClearTimeout;
    });

    it("renders the initial form state correctly", () => {
        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        expect(screen.getByLabelText(/buscar canción o artista/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/tu nombre/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /enviar pedido/i })).toBeDisabled();
    });

    it("handles debounce search and fetches results from iTunes", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            json: async () => ({
                results: [mockTrack],
            }),
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Test" } });
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "https://itunes.apple.com/search?term=Test&media=music&entity=song&limit=6"
            );
        });

        // Results should render in dropdown
        await waitFor(() => {
            expect(screen.getByText("Test Track")).toBeInTheDocument();
            expect(screen.getByText("Test Artist")).toBeInTheDocument();
        });
    });

    it("shows toast when iTunes API returns 403 or 429", async () => {
        const mockResponse = {
            ok: false,
            status: 429,
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Test" } });
        });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Muchas búsquedas recientes. Espera unos segundos.");
        });
    });

    it("handles general error in search fetch", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (global.fetch as any).mockRejectedValue(new Error("Network Error"));

        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Test" } });
        });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });

    it("does not search if query length is less than or equal to 2", async () => {
        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Te" } });
        });

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("can select and then remove a track", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            json: async () => ({
                results: [mockTrack],
            }),
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Test" } });
        });

        const selectButton = await screen.findByRole("button", {
            name: /seleccionar Test Track de Test Artist/i,
        });
        fireEvent.click(selectButton);

        // Track is selected, query input should be hidden or replaced with selected track card
        expect(screen.getByText("Test Track")).toBeInTheDocument();
        expect(screen.queryByLabelText(/buscar por título o artista/i)).not.toBeInTheDocument();

        // Click X button to remove track
        const removeButton = screen.getByRole("button", { name: "" });
        fireEvent.click(removeButton);

        // Search input should be back
        expect(screen.getByPlaceholderText(/busca por título o artista/i)).toBeInTheDocument();
    });

    it("handles form submit successfully", async () => {
        // Mock search fetch first
        const mockSearchResponse = {
            ok: true,
            status: 200,
            json: async () => ({
                results: [mockTrack],
            }),
        };
        // Mock submit fetch second
        const mockSubmitResponse = {
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
        };

        (global.fetch as any)
            .mockResolvedValueOnce(mockSearchResponse) // first call is search
            .mockResolvedValueOnce(mockSubmitResponse); // second call is submit

        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        // Select a song
        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Test" } });
        });

        const selectButton = await screen.findByRole("button", {
            name: /seleccionar Test Track de Test Artist/i,
        });
        fireEvent.click(selectButton);

        // Input name
        const nameInput = screen.getByLabelText(/tu nombre/i);
        act(() => {
            fireEvent.change(nameInput, { target: { value: "John Doe" } });
        });

        // Submit form
        const submitButton = screen.getByRole("button", { name: /enviar pedido/i });
        expect(submitButton).not.toBeDisabled();
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenLastCalledWith(
                "https://backend.example.com/api/pedidos",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({
                        eventoId: "event-123",
                        titulo: "Test Track",
                        artista: "Test Artist",
                        itunesId: "101",
                        nombreSolicitante: "John Doe",
                        usuarioId: null,
                        genero: "Pop",
                        imagenUrl: "https://example.com/image600x600.png",
                        previewUrl: "https://example.com/preview.mp3",
                    }),
                })
            );
        });

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("¡Pedido enviado!");
            expect(screen.getByText("¡Pedido Enviado!")).toBeInTheDocument();
        });
    });

    it("handles form submit validation error when submitting without elements (directly calling submit handler)", async () => {
        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        // Direct form submit
        const form = screen.getByRole("button", { name: /enviar pedido/i }).closest("form");
        fireEvent.submit(form!);

        expect(toast.error).toHaveBeenCalledWith("Selecciona una canción y tu nombre");
    });

    it("handles form submit API failure", async () => {
        const mockSearchResponse = {
            ok: true,
            status: 200,
            json: async () => ({
                results: [mockTrack],
            }),
        };
        const mockSubmitResponse = {
            ok: false,
            status: 400,
            json: async () => ({ error: "El evento no está activo" }),
        };

        (global.fetch as any)
            .mockResolvedValueOnce(mockSearchResponse)
            .mockResolvedValueOnce(mockSubmitResponse);

        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Test" } });
        });

        const selectButton = await screen.findByRole("button", {
            name: /seleccionar Test Track de Test Artist/i,
        });
        fireEvent.click(selectButton);

        const nameInput = screen.getByLabelText(/tu nombre/i);
        act(() => {
            fireEvent.change(nameInput, { target: { value: "John Doe" } });
        });

        const submitButton = screen.getByRole("button", { name: /enviar pedido/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("El evento no está activo");
        });
    });

    it("handles form submit Network exception", async () => {
        const mockSearchResponse = {
            ok: true,
            status: 200,
            json: async () => ({
                results: [mockTrack],
            }),
        };

        (global.fetch as any)
            .mockResolvedValueOnce(mockSearchResponse)
            .mockRejectedValueOnce(new Error("Network failed"));

        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Test" } });
        });

        const selectButton = await screen.findByRole("button", {
            name: /seleccionar Test Track de Test Artist/i,
        });
        fireEvent.click(selectButton);

        const nameInput = screen.getByLabelText(/tu nombre/i);
        act(() => {
            fireEvent.change(nameInput, { target: { value: "John Doe" } });
        });

        const submitButton = screen.getByRole("button", { name: /enviar pedido/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error de conexión");
        });
    });

    it("renders donation and social media methods in success view and handles clipboard copy", async () => {
        const mockSearchResponse = {
            ok: true,
            status: 200,
            json: async () => ({
                results: [mockTrack],
            }),
        };
        const mockSubmitResponse = {
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
        };

        (global.fetch as any)
            .mockResolvedValueOnce(mockSearchResponse)
            .mockResolvedValueOnce(mockSubmitResponse);

        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        // Proceed to success screen
        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Test" } });
        });
        const selectButton = await screen.findByRole("button", {
            name: /seleccionar Test Track de Test Artist/i,
        });
        fireEvent.click(selectButton);
        const nameInput = screen.getByLabelText(/tu nombre/i);
        act(() => {
            fireEvent.change(nameInput, { target: { value: "John Doe" } });
        });
        const submitButton = screen.getByRole("button", { name: /enviar pedido/i });
        fireEvent.click(submitButton);

        // Verify success view elements
        await screen.findByText("¡Pedido Enviado!");
        expect(screen.getByText("¿Te gusta la música? Apoya al DJ")).toBeInTheDocument();
        expect(screen.getByAltText("QR Donación")).toBeInTheDocument();
        expect(screen.getByText("Mi QR de Pago")).toBeInTheDocument();
        expect(screen.getByText("Nequi:")).toBeInTheDocument();
        expect(screen.getByText("1234567890")).toBeInTheDocument();

        // Copy button action
        const copyButton = screen.getByTitle("Copiar número");
        fireEvent.click(copyButton);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("1234567890");
        expect(toast.success).toHaveBeenCalledWith("Copiado al portapapeles");

        // Verify social links
        const igLink = screen.getByRole("link", { name: /instagram/i });
        expect(igLink).toHaveAttribute("href", "https://instagram.com/myusername");
        const ytLink = screen.getByText("YouTube");
        expect(ytLink.closest("a")).toHaveAttribute("href", "https://youtube.com/mychannel");

        // Test "Pedir otra canción" button
        const resetButton = screen.getByRole("button", { name: /pedir otra canción/i });
        fireEvent.click(resetButton);
        expect(screen.getByLabelText(/buscar canción o artista/i)).toBeInTheDocument();
    });

    it("handles QR code image download successfully", async () => {
        const mockSearchResponse = {
            ok: true,
            status: 200,
            json: async () => ({ results: [mockTrack] }),
        };
        const mockSubmitResponse = {
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
        };
        const mockBlobResponse = {
            ok: true,
            blob: async () => new Blob(["test"], { type: "image/png" }),
        };

        (global.fetch as any)
            .mockResolvedValueOnce(mockSearchResponse)
            .mockResolvedValueOnce(mockSubmitResponse)
            .mockResolvedValueOnce(mockBlobResponse); // for blob download

        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        // Proceed to success
        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Test" } });
        });
        const selectButton = await screen.findByRole("button", {
            name: /seleccionar Test Track de Test Artist/i,
        });
        fireEvent.click(selectButton);
        const nameInput = screen.getByLabelText(/tu nombre/i);
        act(() => {
            fireEvent.change(nameInput, { target: { value: "John Doe" } });
        });
        const submitButton = screen.getByRole("button", { name: /enviar pedido/i });
        fireEvent.click(submitButton);

        await screen.findByText("¡Pedido Enviado!");

        // Click download button
        const downloadButton = screen.getByRole("button", { name: /descargar qr/i });
        
        // Mock document createElement link click behavior
        const mockLink = {
            href: "",
            download: "",
            click: vi.fn(),
        };
        const createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
        const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => null as any);
        const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => null as any);

        await act(async () => {
            fireEvent.click(downloadButton);
        });

        expect(global.fetch).toHaveBeenCalledWith("https://example.com/qr.png");
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        expect(mockLink.download).toBe("qr-Mi QR de Pago.png");
        expect(mockLink.click).toHaveBeenCalled();

        createElementSpy.mockRestore();
        appendChildSpy.mockRestore();
        removeChildSpy.mockRestore();
    });

    it("falls back to window.open if QR code download fetch fails", async () => {
        const mockSearchResponse = {
            ok: true,
            status: 200,
            json: async () => ({ results: [mockTrack] }),
        };
        const mockSubmitResponse = {
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
        };

        (global.fetch as any)
            .mockResolvedValueOnce(mockSearchResponse)
            .mockResolvedValueOnce(mockSubmitResponse)
            .mockRejectedValueOnce(new Error("Failed to fetch image")); // download failure

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        // Proceed to success
        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Test" } });
        });
        const selectButton = await screen.findByRole("button", {
            name: /seleccionar Test Track de Test Artist/i,
        });
        fireEvent.click(selectButton);
        const nameInput = screen.getByLabelText(/tu nombre/i);
        act(() => {
            fireEvent.change(nameInput, { target: { value: "John" } });
        });
        const submitButton = screen.getByRole("button", { name: /enviar pedido/i });
        fireEvent.click(submitButton);

        await screen.findByText("¡Pedido Enviado!");

        // Click download QR
        const downloadButton = screen.getByRole("button", { name: /descargar qr/i });
        await act(async () => {
            fireEvent.click(downloadButton);
        });

        expect(window.open).toHaveBeenCalledWith("https://example.com/qr.png", "_blank");
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it("renders only social media links if no donation details are configured", async () => {
        const minimalProfile = {
            redesSociales: [
                {
                    redSocial: { urlBase: "https://instagram.com/", nombre: "Instagram" },
                    nombreUsuario: "minimalist",
                },
            ],
        };

        const mockSearchResponse = {
            ok: true,
            status: 200,
            json: async () => ({ results: [mockTrack] }),
        };
        const mockSubmitResponse = {
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
        };

        (global.fetch as any)
            .mockResolvedValueOnce(mockSearchResponse)
            .mockResolvedValueOnce(mockSubmitResponse);

        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={minimalProfile as any}
            />
        );

        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Test" } });
        });
        const selectButton = await screen.findByRole("button", {
            name: /seleccionar Test Track de Test Artist/i,
        });
        fireEvent.click(selectButton);
        const nameInput = screen.getByLabelText(/tu nombre/i);
        act(() => {
            fireEvent.change(nameInput, { target: { value: "John" } });
        });
        const submitButton = screen.getByRole("button", { name: /enviar pedido/i });
        fireEvent.click(submitButton);

        await screen.findByText("¡Pedido Enviado!");

        // Section header should be redes-related
        expect(screen.getByText("Sigue al DJ en redes")).toBeInTheDocument();
        expect(screen.queryByText("¿Te gusta la música? Apoya al DJ")).not.toBeInTheDocument();
        expect(screen.getByText("Instagram")).toBeInTheDocument();
    });

    it("handles search with empty or missing results array", async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            json: async () => ({
                // no results property
            }),
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        render(
            <RequestMusicForm
                eventoId="event-123"
                artistName="DJ Test"
                artistProfile={mockArtistProfile}
            />
        );

        const searchInput = screen.getByLabelText(/buscar canción o artista/i);
        act(() => {
            fireEvent.change(searchInput, { target: { value: "Test" } });
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });
});
