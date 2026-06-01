import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { LiveRequestsFeed } from "../LiveRequestsFeed";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { io } from "socket.io-client";

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
        info: vi.fn(),
        warning: vi.fn(),
    },
}));

// Mock socket.io-client
const socketListeners: Record<string, Function> = {};
const mockSocket = {
    on: vi.fn((event, callback) => {
        socketListeners[event] = callback;
    }),
    emit: vi.fn(),
    disconnect: vi.fn(),
};
vi.mock("socket.io-client", () => ({
    io: vi.fn(() => mockSocket),
}));

describe("LiveRequestsFeed Component", () => {
    const mockRequests = [
        {
            id: "req-1",
            nombreSolicitante: "Alice",
            titulo: "Song A",
            artista: "Artist A",
            estado: "PENDIENTE",
            creadoEn: "2026-05-27T10:00:00.000Z",
            itunesId: "itunes-1",
        },
        {
            id: "req-2",
            nombreSolicitante: "Bob",
            titulo: "Song A",
            artista: "Artist A",
            estado: "PENDIENTE",
            creadoEn: "2026-05-27T10:01:00.000Z",
            itunesId: "itunes-1",
        },
        {
            id: "req-3",
            nombreSolicitante: "Charlie",
            titulo: "Song B",
            artista: "Artist B",
            estado: "PENDIENTE",
            creadoEn: "2026-05-27T10:02:00.000Z",
            itunesId: "itunes-2",
        },
        {
            id: "req-4",
            nombreSolicitante: "Dave",
            titulo: "Song C",
            artista: "Artist C",
            estado: "ACEPTADO",
            creadoEn: "2026-05-27T10:03:00.000Z",
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Clear listeners dictionary
        for (const key in socketListeners) {
            delete socketListeners[key];
        }

        // Setup default fetchApi mock
        (fetchApi as any).mockImplementation(async (path: string) => {
            if (path.includes("/pedidos")) {
                return {
                    ok: true,
                    json: async () => mockRequests,
                };
            }
            return { ok: true };
        });
    });

    it("renders loading initially and then lists grouped pending requests sorted by popularity", async () => {
        const { container } = render(<LiveRequestsFeed eventoId="event-123" />);

        // Initially in loading state - check for loading spinner class
        expect(container.querySelector(".animate-spin")).toBeInTheDocument();

        // Wait for loading to finish and check rendering
        await waitFor(() => {
            expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
        });

        expect(screen.getByText("Pedidos en Vivo")).toBeInTheDocument();
        expect(screen.getByText("Cola de Espera")).toBeInTheDocument();

        // Check grouped count:
        // Song A has 2 requests (req-1 and req-2). It should be first.
        // Song B has 1 request (req-3). It should be second.
        // Song C has 1 request but is ACEPTADO, so it should not render in pending list.
        expect(screen.getByText("Song A")).toBeInTheDocument();
        expect(screen.getByText("Artist A")).toBeInTheDocument();
        expect(screen.getByText("x2")).toBeInTheDocument(); // Group count badge

        expect(screen.getByText("Song B")).toBeInTheDocument();
        expect(screen.getByText("Artist B")).toBeInTheDocument();
        expect(screen.queryByText("Song C")).not.toBeInTheDocument();
    });

    it("renders empty state if no pending requests are found", async () => {
        (fetchApi as any).mockImplementationOnce(async () => ({
            ok: true,
            json: async () => [],
        }));

        render(<LiveRequestsFeed eventoId="event-123" />);
        await waitFor(() => {
            expect(screen.getByText("Escaneando nuevos pedidos...")).toBeInTheDocument();
        });
    });

    it("connects to socket and joins event room on mount, disconnects on unmount", async () => {
        const { unmount } = render(<LiveRequestsFeed eventoId="event-123" />);

        expect(io).toHaveBeenCalledWith(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001");
        expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("nuevo_pedido", expect.any(Function));

        // Simulate socket connection
        if (socketListeners["connect"]) {
            act(() => {
                socketListeners["connect"]();
            });
            expect(mockSocket.emit).toHaveBeenCalledWith("join_event", "event-123");
        }

        unmount();
        expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it("handles receiving a new request via socket", async () => {
        render(<LiveRequestsFeed eventoId="event-123" />);
        await waitFor(() => {
            expect(screen.getByText("Song A")).toBeInTheDocument();
        });

        // Setup new request
        const newRequest = {
            id: "req-5",
            nombreSolicitante: "Eve",
            titulo: "Song D",
            artista: "Artist D",
            estado: "PENDIENTE" as const,
            creadoEn: "2026-05-27T10:05:00.000Z",
            itunesId: "itunes-5",
        };

        // Trigger socket listener
        expect(socketListeners["nuevo_pedido"]).toBeDefined();
        act(() => {
            socketListeners["nuevo_pedido"](newRequest);
        });

        // Toast should be shown
        expect(toast.info).toHaveBeenCalledWith("¡Nuevo pedido: Song D!");

        // Feed should render the new request
        expect(screen.getByText("Song D")).toBeInTheDocument();
        expect(screen.getByText("Artist D")).toBeInTheDocument();
    });

    it("does not duplicate request in the feed if it is already present", async () => {
        render(<LiveRequestsFeed eventoId="event-123" />);
        await waitFor(() => {
            expect(screen.getByText("Song A")).toBeInTheDocument();
        });

        const existingRequest = mockRequests[0]; // req-1

        act(() => {
            socketListeners["nuevo_pedido"](existingRequest);
        });

        // Toast should be shown since that's how it's written in the code
        expect(toast.info).toHaveBeenCalledWith("¡Nuevo pedido: Song A!");

        // Expect no extra items added to screen (e.g. Song A count should remain x2)
        expect(screen.getByText("x2")).toBeInTheDocument();
    });

    it("handles updating status group (Accept)", async () => {
        render(<LiveRequestsFeed eventoId="event-123" />);
        await waitFor(() => {
            expect(screen.getByText("Song A")).toBeInTheDocument();
        });

        const acceptButtons = screen.getAllByRole("button");
        const checkButtons = acceptButtons.filter(btn => btn.querySelector(".h-5.w-5") && !btn.classList.contains("text-zinc-400"));

        (fetchApi as any).mockResolvedValue({ ok: true });

        fireEvent.click(checkButtons[0]);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith("/api/pedidos/req-1/estado", expect.objectContaining({
                method: "PATCH",
                body: JSON.stringify({ estado: "ACEPTADO" }),
            }));
            expect(fetchApi).toHaveBeenCalledWith("/api/pedidos/req-2/estado", expect.objectContaining({
                method: "PATCH",
                body: JSON.stringify({ estado: "ACEPTADO" }),
            }));
        });

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Canción aceptada");
        });
    });

    it("handles updating status group (Reject) with partial/full API failures", async () => {
        render(<LiveRequestsFeed eventoId="event-123" />);
        await waitFor(() => {
            expect(screen.getByText("Song A")).toBeInTheDocument();
        });

        const rejectButtons = screen.getAllByRole("button").filter(btn => btn.classList.contains("text-zinc-400"));

        // Mock PATCH request failure (one fails, one succeeds)
        (fetchApi as any)
            .mockResolvedValueOnce({ ok: true }) // fetch requests on mount (ignored here)
            .mockResolvedValueOnce({ ok: false }) // req-1 fails
            .mockResolvedValueOnce({ ok: true }); // req-2 succeeds

        fireEvent.click(rejectButtons[0]);

        await waitFor(() => {
            expect(toast.warning).toHaveBeenCalledWith("Algunos pedidos no se pudieron actualizar (1 errores)");
            expect(fetchApi).toHaveBeenLastCalledWith("/api/eventos/event-123/pedidos");
        });
    });

    it("handles connection failure exception in status updates", async () => {
        render(<LiveRequestsFeed eventoId="event-123" />);
        await waitFor(() => {
            expect(screen.getByText("Song A")).toBeInTheDocument();
        });

        const rejectButtons = screen.getAllByRole("button").filter(btn => btn.classList.contains("text-zinc-400"));

        // Mock throw exception for all subsequent calls using mockRejectedValue
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchApi as any).mockRejectedValue(new Error("Conn lost"));

        fireEvent.click(rejectButtons[0]);

        await waitFor(() => {
            expect(toast.warning).toHaveBeenCalledWith("Algunos pedidos no se pudieron actualizar (2 errores)");
        });
        consoleSpy.mockRestore();
    });

    it("handles general network error in initial requests fetch", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        (fetchApi as any).mockRejectedValueOnce(new Error("Network Error"));

        render(<LiveRequestsFeed eventoId="event-123" />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });
});
