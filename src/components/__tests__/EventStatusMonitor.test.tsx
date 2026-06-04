import { render, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventStatusMonitor } from "../EventStatusMonitor";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

vi.mock("socket.io-client", () => {
  return {
    io: vi.fn(),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("EventStatusMonitor", () => {
  let mockSocket: any;
  const mockReload = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    Object.defineProperty(globalThis, "location", {
      value: { reload: mockReload },
      writable: true,
    });

    mockSocket = {
      id: "socket-123",
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    };
    (io as any).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("does not connect if artistId is missing", () => {
    render(<EventStatusMonitor artistId="" currentStatus={false} />);
    expect(io).not.toHaveBeenCalled();
  });

  it("connects and sets up listeners", () => {
    render(<EventStatusMonitor artistId="artist-1" eventoId="event-1" currentStatus={false} />);
    
    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ transports: ['websocket', 'polling'] })
    );
    expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("connect_error", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("pedidos_status", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("event_started", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("event_ended", expect.any(Function));
  });

  it("emits join events on connect", () => {
    render(<EventStatusMonitor artistId="artist-1" eventoId="event-1" currentStatus={false} />);
    
    const connectHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "connect")[1];
    connectHandler();

    expect(mockSocket.emit).toHaveBeenCalledWith("join_artist", "artist-1");
    expect(mockSocket.emit).toHaveBeenCalledWith("join_event", "event-1");
  });

  it("handles connect without eventoId", () => {
    render(<EventStatusMonitor artistId="artist-1" currentStatus={false} />);
    
    const connectHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "connect")[1];
    connectHandler();

    expect(mockSocket.emit).toHaveBeenCalledWith("join_artist", "artist-1");
    expect(mockSocket.emit).not.toHaveBeenCalledWith("join_event", expect.anything());
  });

  it("handles connect_error", () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<EventStatusMonitor artistId="artist-1" currentStatus={false} />);
    
    const errorHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "connect_error")[1];
    errorHandler(new Error("Test Error"));
    
    expect(consoleSpy).toHaveBeenCalledWith("Socket connection error:", expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("handles pedidos_status change to active", () => {
    render(<EventStatusMonitor artistId="artist-1" currentStatus={false} />);
    
    const statusHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "pedidos_status")[1];
    
    act(() => {
      statusHandler({ activo: true });
    });

    expect(toast.success).toHaveBeenCalledWith("¡El artista ya puede recibir pedidos!");
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockReload).toHaveBeenCalled();
  });

  it("handles pedidos_status change to inactive", () => {
    render(<EventStatusMonitor artistId="artist-1" currentStatus={true} />);
    
    const statusHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "pedidos_status")[1];
    
    act(() => {
      statusHandler({ activo: false });
    });

    expect(toast.warning).toHaveBeenCalledWith("El artista ya no recibe pedidos.");
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockReload).toHaveBeenCalled();
  });

  it("does not trigger toast/reload if pedidos_status is unchanged", () => {
    render(<EventStatusMonitor artistId="artist-1" currentStatus={true} />);
    
    const statusHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "pedidos_status")[1];
    
    act(() => {
      statusHandler({ activo: true });
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockReload).not.toHaveBeenCalled();
  });

  it("handles event_started", () => {
    render(<EventStatusMonitor artistId="artist-1" currentStatus={false} />);
    
    const handler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "event_started")[1];
    
    act(() => {
      handler({ eventId: "event-1" });
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockReload).toHaveBeenCalled();
  });

  it("handles event_ended", () => {
    render(<EventStatusMonitor artistId="artist-1" currentStatus={true} />);
    
    const handler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "event_ended")[1];
    
    act(() => {
      handler({ eventId: "event-1" });
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockReload).toHaveBeenCalled();
  });

  it("debounces reload when multiple events fire", () => {
    render(<EventStatusMonitor artistId="artist-1" currentStatus={false} />);
    
    const statusHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "pedidos_status")[1];
    const startedHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "event_started")[1];
    
    act(() => {
      statusHandler({ activo: true });
      startedHandler({ eventId: "123" });
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockReload).toHaveBeenCalledTimes(1); // Should only reload once
  });

  it("disconnects on unmount", () => {
    const { unmount } = render(<EventStatusMonitor artistId="artist-1" currentStatus={false} />);
    
    unmount();
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it("clears timeout on unmount", () => {
    const { unmount } = render(<EventStatusMonitor artistId="artist-1" currentStatus={false} />);
    
    const handler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "event_started")[1];
    
    act(() => {
      handler({ eventId: "event-1" });
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockReload).not.toHaveBeenCalled(); // Because timeout was cleared
  });

  it("updates ref when currentStatus prop changes", () => {
    const { rerender } = render(<EventStatusMonitor artistId="artist-1" currentStatus={false} />);
    
    rerender(<EventStatusMonitor artistId="artist-1" currentStatus={true} />);
    
    const statusHandler = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "pedidos_status")[1];
    
    // Now receiving true should NOT trigger anything because ref was updated to true
    act(() => {
      statusHandler({ activo: true });
    });

    expect(toast.success).not.toHaveBeenCalled();
  });
});
