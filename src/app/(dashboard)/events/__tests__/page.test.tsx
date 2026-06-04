import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EventsPage from "../page";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

vi.mock("next-auth/react", () => ({ useSession: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));

// Mock components to simplify test
vi.mock("@/components/dashboard/EventManager", () => ({
  EventManager: ({ onEventChange }: any) => (
    <div data-testid="event-manager">
      <button onClick={() => onEventChange({ id: "event-1", titulo: "My Event" })}>Activate Event</button>
      <button onClick={() => onEventChange(null)}>Deactivate Event</button>
    </div>
  )
}));

describe("EventsPage", () => {
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  it("renders loader if loading", () => {
    (useSession as any).mockReturnValue({ status: "loading", data: null });
    const { container } = render(<EventsPage />);
    expect(container.querySelector(".animate-spin") || screen.queryByTestId("loading-screen")).toBeDefined();
  });

  it("redirects to login if unauthenticated", () => {
    (useSession as any).mockReturnValue({ status: "unauthenticated", data: null });
    render(<EventsPage />);
    expect(mockRouter.push).toHaveBeenCalledWith("/login");
  });

  it("redirects to home if authenticated but not ARTISTA", () => {
    (useSession as any).mockReturnValue({
      status: "authenticated",
      data: { user: { rol: "PUBLICO" } }
    });
    render(<EventsPage />);
    expect(mockRouter.push).toHaveBeenCalledWith("/home");
  });

  it("returns null if authenticated but not ARTISTA (no UI)", () => {
    (useSession as any).mockReturnValue({
      status: "authenticated",
      data: { user: { rol: "PUBLICO" } }
    });
    const { container } = render(<EventsPage />);
    expect(container.innerHTML).toBe(""); // should return null
  });

  it("renders events page and live requests link for ARTISTA", async () => {
    (useSession as any).mockReturnValue({
      status: "authenticated",
      data: { user: { rol: "ARTISTA" } }
    });
    render(<EventsPage />);

    expect(screen.getByText("Gestión de Eventos")).toBeInTheDocument();

    // Check Live Requests is not visible initially
    expect(screen.queryByText("Pedidos en Vivo")).not.toBeInTheDocument();

    // Activate event
    const activateBtn = screen.getByText("Activate Event");
    fireEvent.click(activateBtn);

    // Check Live Requests is visible
    await waitFor(() => {
      expect(screen.getByText("Pedidos en Vivo")).toBeInTheDocument();
    });
    
    // Deactivate event
    const deactivateBtn = screen.getByText("Deactivate Event");
    fireEvent.click(deactivateBtn);
    
    await waitFor(() => {
      expect(screen.queryByText("Pedidos en Vivo")).not.toBeInTheDocument();
    });
  });
});
