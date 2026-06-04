import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LiveRequestsPage from "../page";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  fetchApi: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/components/ui/loading-screen", () => ({
  LoadingScreen: () => <div data-testid="loading-screen" />,
}));

vi.mock("@/components/ui/back-button", () => ({
  BackButton: () => <button data-testid="back-button">Back</button>,
}));

vi.mock("@/components/animated-background", () => ({
  AnimatedBackground: () => <div data-testid="animated-background" />,
}));

vi.mock("@/components/dashboard/LiveRequestsFeed", () => ({
  LiveRequestsFeed: ({ eventoId }: any) => <div data-testid="feed">Feed for {eventoId}</div>,
}));

describe("LiveRequestsPage", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it("shows loading screen", () => {
    (useSession as any).mockReturnValue({ status: "loading" });
    render(<LiveRequestsPage />);
    expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
  });

  it("redirects unauthenticated users", () => {
    (useSession as any).mockReturnValue({ status: "unauthenticated" });
    render(<LiveRequestsPage />);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("redirects authenticated but non-ARTISTA users", () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { rol: "USER" } } });
    render(<LiveRequestsPage />);
    expect(mockPush).toHaveBeenCalledWith("/home");
  });

  it("fetches active event and renders feed", async () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { id: "artist-1", rol: "ARTISTA" } } });
    (fetchApi as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "event-1", titulo: "Live Event" }),
    });

    render(<LiveRequestsPage />);

    await waitFor(() => {
      expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Pedidos en Vivo")).toBeInTheDocument();
    expect(screen.getByText("Live Event")).toBeInTheDocument();
    expect(screen.getByTestId("feed")).toHaveTextContent("Feed for event-1");
  });

  it("handles fetch active event null data", async () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { id: "artist-1", rol: "ARTISTA" } } });
    (fetchApi as any).mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    render(<LiveRequestsPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("No hay evento activo");
      expect(mockPush).toHaveBeenCalledWith("/events");
    });
  });

  it("handles fetch active event not ok", async () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { id: "artist-1", rol: "ARTISTA" } } });
    (fetchApi as any).mockResolvedValueOnce({
      ok: false,
    });

    render(<LiveRequestsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/events");
    });
  });

  it("handles fetch active event throw error", async () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { id: "artist-1", rol: "ARTISTA" } } });
    (fetchApi as any).mockRejectedValueOnce(new Error("Network Error"));

    render(<LiveRequestsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/events");
    });
  });

  it("does not fetch if missing artistaId", async () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { rol: "ARTISTA" } } }); // No id
    
    render(<LiveRequestsPage />);
    
    await waitFor(() => {
      expect(fetchApi).not.toHaveBeenCalled();
      expect(screen.queryByTestId("loading-screen")).not.toBeInTheDocument();
    });
  });
});
