import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegistrationForm } from "../RegistrationForm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";

// Mocks
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  fetchApi: vi.fn(),
  parseJsonSafe: vi.fn((response) => response.json()),
}));

vi.mock("@/components/ui/loading-screen", () => ({
  LoadingScreen: () => <div data-testid="loading-screen" />,
}));

vi.mock("@/components/profile/RegistrationPageShell", () => ({
  RegistrationPageShell: ({ children }: any) => <div data-testid="shell">{children}</div>,
}));

vi.mock("@/components/profile/ProfileContactSection", () => ({
  ProfileContactSection: ({ onCountryChange, onCityChange, onPhoneCodeChange, onPhoneNumberChange, onTimezoneChange }: any) => (
    <div data-testid="contact-section">
      <button onClick={() => onCountryChange("Peru")}>Set Country</button>
      <button onClick={() => onCityChange("Lima")}>Set City</button>
      <button onClick={() => onPhoneCodeChange("+51")}>Set Phone Code</button>
      <button onClick={() => onPhoneNumberChange("123456789")}>Set Phone</button>
      <button onClick={() => onTimezoneChange("America/Lima")}>Set Timezone</button>
    </div>
  ),
}));

vi.mock("@/components/profile/NameAndUsernameSection", () => ({
  NameAndUsernameSection: ({ onNameChange, onUsernameChange, onStatusChange }: any) => (
    <div data-testid="name-section">
      <button onClick={() => onNameChange("New Name")}>Set Name</button>
      <button onClick={() => onUsernameChange("new_user")}>Set Username</button>
      <button onClick={() => onStatusChange(true)}>Verify Username</button>
      <button onClick={() => onStatusChange(false)}>Unverify Username</button>
    </div>
  ),
}));

vi.mock("@/components/profile/ProfileDatePicker", () => ({
  ProfileDatePicker: ({ onSelect, onOpenChange }: any) => (
    <div data-testid="date-picker">
      <button onClick={() => onSelect(new Date("2020-01-01"))}>Set Date</button>
      <button onClick={() => onOpenChange(true)}>Open Calendar</button>
    </div>
  ),
}));

vi.mock("@/components/profile/ProfileFormWrapper", () => ({
  ProfileFormWrapper: ({ children, onSubmit }: any) => (
    <form data-testid="form-wrapper" onSubmit={onSubmit}>
      {children}
      <button type="submit">Submit Form</button>
    </form>
  ),
}));

vi.mock("@/components/profile/useProfileFormControls", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useState } = require("react");
  return {
    useProfileFormControls: () => {
      const [date, setDate] = useState<Date | undefined>();
      const [open, setOpen] = useState(false);
      const [verified, setVerified] = useState(false);
      return { date, setDate, open, setOpen, verified, setVerified };
    },
  };
});

describe("RegistrationForm", () => {
  const defaultProps = {
    title: "Test Reg",
    backHref: "/back",
    nameLabel: "Name",
    namePlaceholder: "Enter name",
    buildPayload: vi.fn(() => ({ test: "payload" })),
    validate: vi.fn(() => null),
  };

  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    global.location = { replace: mockReplace } as any;
  });

  it("shows loading screen when session is loading", () => {
    (useSession as any).mockReturnValue({ status: "loading" });
    render(<RegistrationForm {...defaultProps} />);
    expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
  });

  it("redirects to login if unauthenticated", () => {
    (useSession as any).mockReturnValue({ status: "unauthenticated" });
    render(<RegistrationForm {...defaultProps} />);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("redirects to home if authenticated but not SUPER_ADMIN/ADMIN", () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { rol: "USER", name: "User" } } });
    render(<RegistrationForm {...defaultProps} />);
    expect(mockPush).toHaveBeenCalledWith("/home");
  });

  it("renders correctly and uses session name", () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { rol: "ADMIN", name: "Admin" } } });
    render(<RegistrationForm {...defaultProps} showFoundationDate={true} />);
    expect(screen.getByTestId("shell")).toBeInTheDocument();
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
  });

  it("submits form successfully", async () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { rol: "ADMIN", name: "Admin" } }, update: mockUpdate });
    (fetchApi as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "123", rol: { nombre: "ADMIN" } }),
    });

    render(<RegistrationForm {...defaultProps} />);

    // Trigger state changes via mocked components
    fireEvent.click(screen.getByText("Verify Username"));
    fireEvent.click(screen.getByText("Set Name"));
    fireEvent.click(screen.getByText("Set Username"));
    fireEvent.click(screen.getByText("Set Country"));
    fireEvent.click(screen.getByText("Set City"));
    fireEvent.click(screen.getByText("Set Phone Code"));
    fireEvent.click(screen.getByText("Set Phone"));
    fireEvent.click(screen.getByText("Set Timezone"));

    fireEvent.click(screen.getByText("Submit Form"));

    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/rol", expect.anything());
    });
    expect(toast.success).toHaveBeenCalledWith("¡Registro completado con éxito!");
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/settings");
  });

  it("fails submission if unverified username", async () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { rol: "ADMIN" } } });
    render(<RegistrationForm {...defaultProps} />);
    
    // Unverified by default since we mock setVerified. Actually, let's use the UI to ensure it's unverified
    fireEvent.click(screen.getByText("Unverify Username"));
    
    fireEvent.click(screen.getByText("Submit Form"));
    expect(toast.error).toHaveBeenCalledWith("Por favor verifica tu nombre de usuario");
  });

  it("fails submission if validation fails", async () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { rol: "ADMIN" } } });
    const propsWithValidation = {
      ...defaultProps,
      validate: vi.fn(() => "Validation error"),
    };
    render(<RegistrationForm {...propsWithValidation} />);
    
    fireEvent.click(screen.getByText("Verify Username"));
    fireEvent.click(screen.getByText("Submit Form"));

    expect(toast.error).toHaveBeenCalledWith("Validation error");
  });

  it("shows error on fetch failure", async () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { rol: "ADMIN" } } });
    (fetchApi as any).mockResolvedValueOnce({ ok: false });

    render(<RegistrationForm {...defaultProps} errorMessage="Custom error" />);
    
    fireEvent.click(screen.getByText("Verify Username"));
    fireEvent.click(screen.getByText("Submit Form"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Custom error");
    });
  });

  it("handles catch block during fetch", async () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { rol: "ADMIN" } } });
    (fetchApi as any).mockRejectedValueOnce(new Error("Network Error"));

    render(<RegistrationForm {...defaultProps} />);
    
    fireEvent.click(screen.getByText("Verify Username"));
    fireEvent.click(screen.getByText("Submit Form"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error de conexión. Verifica tu internet.");
    });
  });

  it("submits form successfully for non-admin user (registration)", async () => {
    (useSession as any).mockReturnValue({
      status: "authenticated",
      data: { user: { id: "u123", name: "New User" } },
      update: mockUpdate
    });
    (fetchApi as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "123", rol: { nombre: "ARTISTA" } }),
    });

    render(<RegistrationForm {...defaultProps} />);

    fireEvent.click(screen.getByText("Verify Username"));
    fireEvent.click(screen.getByText("Submit Form"));

    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/rol", expect.anything());
    });
    expect(toast.success).toHaveBeenCalledWith("¡Registro completado con éxito!");
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/home");
  });

  it("shows default error on fetch failure when errorMessage is not provided", async () => {
    (useSession as any).mockReturnValue({ status: "authenticated", data: { user: { rol: "ADMIN" } } });
    (fetchApi as any).mockResolvedValueOnce({ ok: false });

    render(<RegistrationForm {...defaultProps} errorMessage={undefined} />);
    
    fireEvent.click(screen.getByText("Verify Username"));
    fireEvent.click(screen.getByText("Submit Form"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al registrar perfil. Inténtalo de nuevo.");
    });
  });
});
