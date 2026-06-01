import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import { EventStatusMonitor } from "../EventStatusMonitor";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { toast } from "sonner";
import { io } from "socket.io-client";

// Mock sonner
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
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
    id: "socket-999",
};
vi.mock("socket.io-client", () => ({
    io: vi.fn(() => mockSocket),
}));

describe("EventStatusMonitor Component", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        // Clear socket listeners dictionary
        for (const key in socketListeners) {
            delete socketListeners[key];
        }
        // Mock globalThis.location.reload
        Object.defineProperty(window, "location", {
            value: {
                reload: vi.fn(),
            },
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("logs warning if artistId is missing", () => {
        const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        render(<EventStatusMonitor artistId="" currentStatus={false} />);
        expect(consoleSpy).toHaveBeenCalledWith("EventStatusMonitor: missing artistId");
        consoleSpy.mockRestore();
    });

    it("connects to socket and joins artist and event rooms on connection", () => {
        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        render(<EventStatusMonitor artistId="artist-1" eventoId="event-1" currentStatus={false} />);

        expect(io).toHaveBeenCalledWith(
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
            expect.objectContaining({
                reconnectionAttempts: 10,
                timeout: 5000,
                transports: ["websocket", "polling"],
            })
        );

        // Simulate connection
        expect(socketListeners["connect"]).toBeDefined();
        act(() => {
            socketListeners["connect"]();
        });

        expect(mockSocket.emit).toHaveBeenCalledWith("join_artist", "artist-1");
        expect(mockSocket.emit).toHaveBeenCalledWith("join_event", "event-1");
        consoleSpy.mockRestore();
    });

    it("logs error on connection error", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        render(<EventStatusMonitor artistId="artist-1" currentStatus={false} />);

        expect(socketListeners["connect_error"]).toBeDefined();
        act(() => {
            socketListeners["connect_error"](new Error("Fail"));
        });

        expect(consoleSpy).toHaveBeenCalledWith("Socket connection error:", expect.any(Error));
        consoleSpy.mockRestore();
    });

    it("does not toast or reload if status matches currentStatus", () => {
        render(<EventStatusMonitor artistId="artist-1" currentStatus={true} />);

        act(() => {
            socketListeners["pedidos_status"]({ activo: true });
        });

        expect(toast.success).not.toHaveBeenCalled();
        expect(toast.warning).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1500);
        });
        expect(globalThis.location.reload).not.toHaveBeenCalled();
    });

    it("toasts success and reloads if status changes to active", () => {
        render(<EventStatusMonitor artistId="artist-1" currentStatus={false} />);

        act(() => {
            socketListeners["pedidos_status"]({ activo: true });
        });

        expect(toast.success).toHaveBeenCalledWith("¡El artista ya puede recibir pedidos!");
        expect(toast.warning).not.toHaveBeenCalled();

        expect(globalThis.location.reload).not.toHaveBeenCalled();

        // Advance timers by 1500ms
        act(() => {
            vi.advanceTimersByTime(1500);
        });
        expect(globalThis.location.reload).toHaveBeenCalled();
    });

    it("toasts warning and reloads if status changes to inactive", () => {
        render(<EventStatusMonitor artistId="artist-1" currentStatus={true} />);

        act(() => {
            socketListeners["pedidos_status"]({ activo: false });
        });

        expect(toast.warning).toHaveBeenCalledWith("El artista ya no recibe pedidos.");
        expect(toast.success).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1500);
        });
        expect(globalThis.location.reload).toHaveBeenCalled();
    });

    it("reloads and doesn't schedule twice if multiple reload events occur", () => {
        render(<EventStatusMonitor artistId="artist-1" currentStatus={true} />);

        act(() => {
            socketListeners["event_started"]({ eventId: "event-1" });
        });
        act(() => {
            socketListeners["event_ended"]({ eventId: "event-1" });
        });

        act(() => {
            vi.advanceTimersByTime(1500);
        });

        // reload should have been called only once because timeout is already scheduled
        expect(globalThis.location.reload).toHaveBeenCalledTimes(1);
    });

    it("disconnects and clears timeout on unmount", () => {
        const { unmount } = render(<EventStatusMonitor artistId="artist-1" currentStatus={true} />);

        // Trigger reload to schedule timeout
        act(() => {
            socketListeners["event_started"]({ eventId: "event-1" });
        });

        unmount();

        expect(mockSocket.disconnect).toHaveBeenCalled();

        // Advance timers - since timeout was cleared, reload should not be called
        act(() => {
            vi.advanceTimersByTime(1500);
        });
        expect(globalThis.location.reload).not.toHaveBeenCalled();
    });
});
