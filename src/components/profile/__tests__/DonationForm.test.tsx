import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DonationForm } from "../DonationForm";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { convertFileToBase64 } from "@/lib/useFileToBase64";
import { useConfigList } from "@/lib/useConfigList";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(() => "loading-toast"),
    dismiss: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  fetchApi: vi.fn(),
  parseJsonSafe: vi.fn(async (res) => {
    try { return await res.json(); } catch { return null; }
  }),
}));

vi.mock("@/lib/useFileToBase64", () => ({
  convertFileToBase64: vi.fn(),
  DEFAULT_MAX_FILE_SIZE: 2000000,
}));

vi.mock("@/lib/useConfigList", () => ({
  useConfigList: vi.fn(),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select data-testid="mock-select" value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ children }: any) => <>{children}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

vi.mock("@/components/ui/DashedEmptyState", () => ({
  DashedEmptyState: () => <div data-testid="empty-state" />,
}));

vi.mock("@/components/profile/ProfileFormWrapper", () => ({
  ProfileFormWrapper: ({ children, onSubmit }: any) => (
    <form data-testid="form-wrapper" onSubmit={onSubmit}>
      {children}
      <button type="submit">Guardar Cambios</button>
    </form>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} alt={props.alt || "mock"} />,
}));

describe("DonationForm", () => {
  const mockOnSave = vi.fn();
  const mockOnLoadingChange = vi.fn();

  const defaultProps = {
    metodosDonacion: [],
    perfilArtista: {},
    usuarioId: "user-1",
    onSave: mockOnSave,
    onLoadingChange: mockOnLoadingChange,
  };

  const mockAvailableMethods = [
    { id: "method-1", nombre: "Yape" },
    { id: "method-2", nombre: "Plin" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useConfigList as any).mockReturnValue({ data: mockAvailableMethods });
  });

  it("renders with empty state", () => {
    render(<DonationForm {...defaultProps} />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("adds and removes donation method", async () => {
    render(<DonationForm {...defaultProps} />);
    
    const addBtn = screen.getByRole("button", { name: /Agregar Método/i });
    fireEvent.click(addBtn);
    
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    
    // Select a different method
    const select = screen.getByTestId("mock-select");
    fireEvent.change(select, { target: { value: "method-2" } });

    // There should be one input for account number
    const accountInput = screen.getByPlaceholderText(/Ingresa el número de cuenta/i);
    await userEvent.type(accountInput, "123456");
    expect(accountInput).toHaveValue("123456");

    // Type in payment URL
    const urlInput = screen.getByPlaceholderText("https://paypal.me/tuusuario");
    await userEvent.type(urlInput, "https://paypal.me/newuser");
    expect(urlInput).toHaveValue("https://paypal.me/newuser");

    // Test file input click trigger
    const uploadBtn = screen.getByRole("button", { name: /Subir QR/i });
    const fileInput = screen.getByTestId("form-wrapper").querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");
    fireEvent.click(uploadBtn);
    expect(clickSpy).toHaveBeenCalled();

    // Remove
    const removeBtn = screen.getByRole("button", { name: "Eliminar método" });
    fireEvent.click(removeBtn);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("handles maximum available methods", async () => {
    render(<DonationForm {...defaultProps} />);
    const addBtn = screen.getByRole("button", { name: /Agregar Método/i });
    await userEvent.click(addBtn);
    await userEvent.click(addBtn);
    await userEvent.click(addBtn); // Third click should fail
        expect(addBtn).toBeDisabled();
  });

  it("submits without QR correctly", async () => {
    (fetchApi as any).mockResolvedValueOnce({ ok: true });
    
    render(<DonationForm {...defaultProps} />);
    
    // Submitting empty should work (it saves empty lists)
    fireEvent.submit(screen.getByTestId("form-wrapper"));
    
    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/perfil", expect.anything());
      expect(mockOnSave).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Métodos de donación actualizados correctamente");
    });
  });

  it("validates missing account number", async () => {
    render(<DonationForm {...defaultProps} />);
    const addBtn = screen.getByRole("button", { name: /Agregar Método/i });
    fireEvent.click(addBtn);
    
    fireEvent.submit(screen.getByTestId("form-wrapper"));
    
    expect(toast.error).toHaveBeenCalledWith("Todos los métodos de donación deben tener un número de cuenta");
  });

  it("validates QR name vs Image mismatch", async () => {
    render(<DonationForm {...defaultProps} />);
    
    const qrNameInput = screen.getByPlaceholderText("Ej: Yape, Plin, PayPal");
    await userEvent.type(qrNameInput, "My QR");
    
    fireEvent.submit(screen.getByTestId("form-wrapper"));
    expect(toast.error).toHaveBeenCalledWith("Debes subir una imagen para el QR si ingresas un nombre");
  });

  it("handles QR file upload validation size", async () => {
    render(<DonationForm {...defaultProps} />);
    
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    Object.defineProperty(file, 'size', { value: 3000000 }); // 3MB

    const input = screen.getByTestId("form-wrapper").querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(toast.error).toHaveBeenCalledWith("El QR no puede exceder 2MB de tamaño");
  });

  it("handles QR upload and remove", async () => {
    (convertFileToBase64 as any).mockResolvedValue("data:image/png;base64,mock");
    render(<DonationForm {...defaultProps} />);
    
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("form-wrapper").querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("QR cargado. Haz click en 'Guardar Cambios' para subirlo.");
    });
    
    const removeBtn = screen.getByRole("button", { name: "Eliminar QR" });
    fireEvent.click(removeBtn);
    expect(toast.success).toHaveBeenCalledWith("QR eliminado");
  });

  it("submits with QR base64 correctly", async () => {
    (convertFileToBase64 as any).mockResolvedValue("data:image/png;base64,mock");
    (fetchApi as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ url: "https://mock.qr" }) }) // Image upload
      .mockResolvedValueOnce({ ok: true }); // Patch profile

    render(<DonationForm {...defaultProps} />);
    
    // Upload
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("form-wrapper").querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => expect(screen.getByAltText("QR Code")).toBeInTheDocument());

    const qrNameInput = screen.getByPlaceholderText("Ej: Yape, Plin, PayPal");
    await userEvent.type(qrNameInput, "My QR");

    fireEvent.submit(screen.getByTestId("form-wrapper"));

    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledTimes(2);
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it("handles submit failure for QR upload", async () => {
    (convertFileToBase64 as any).mockResolvedValue("data:image/png;base64,mock");
    (fetchApi as any).mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    render(<DonationForm {...defaultProps} />);
    
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("form-wrapper").querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => expect(screen.getByAltText("QR Code")).toBeInTheDocument());

    const qrNameInput = screen.getByPlaceholderText("Ej: Yape, Plin, PayPal");
    await userEvent.type(qrNameInput, "My QR");

    fireEvent.submit(screen.getByTestId("form-wrapper"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al subir el QR");
    });
  });

  it("handles save profile error", async () => {
    (fetchApi as any).mockResolvedValueOnce({ ok: false, json: async () => ({ message: "Backend error" }) });
    
    render(<DonationForm {...defaultProps} />);
    
    fireEvent.submit(screen.getByTestId("form-wrapper"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Backend error"));
    });
  });

  it("handles QR convert error", async () => {
    (convertFileToBase64 as any).mockRejectedValueOnce(new Error("Convert error"));
    
    render(<DonationForm {...defaultProps} />);
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("form-wrapper").querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al procesar el QR");
    });
  });

  it("initializes from metodosDonacion correctly", () => {
    const props = {
      ...defaultProps,
      metodosDonacion: [{ metodoDonacionId: "method-1", numeroCuenta: "999", id: "1" }],
    };
    render(<DonationForm {...props} />);
    expect(screen.getByDisplayValue("999")).toBeInTheDocument();
  });

  it("handles QR file upload with no file selected", async () => {
    render(<DonationForm {...defaultProps} />);
    const input = screen.getByTestId("form-wrapper").querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("validates missing QR name when QR image is present", async () => {
    (convertFileToBase64 as any).mockResolvedValue("data:image/png;base64,mock");
    render(<DonationForm {...defaultProps} />);
    
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("form-wrapper").querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => expect(screen.getByAltText("QR Code")).toBeInTheDocument());

    fireEvent.submit(screen.getByTestId("form-wrapper"));
    expect(toast.error).toHaveBeenCalledWith("Debes ingresar un nombre para identificar el QR");
  });

  it("submits with pre-existing QR URL correctly", async () => {
    (fetchApi as any).mockResolvedValueOnce({ ok: true });
    
    const props = {
      ...defaultProps,
      perfilArtista: {
        pagoQR: "https://example.com/existing-qr.png",
        nombreQR: "Yape",
        urlPago: "https://paypal.me/existing"
      }
    };
    render(<DonationForm {...props} />);
    
    fireEvent.submit(screen.getByTestId("form-wrapper"));
    
    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/perfil", expect.objectContaining({
        body: expect.stringContaining("existing-qr.png")
      }));
    });
  });

  it("initializes from metodosDonacion fallbacks correctly", () => {
    const props = {
      ...defaultProps,
      metodosDonacion: [
        { metodoDonacionId: "method-1", identificador: "ident-123", id: "1" } as any,
        { metodoDonacionId: "method-2", numeroTelefono: "tel-123", id: "2" } as any,
        { metodoDonacionId: "method-2", id: "3" } as any
      ],
    };
    render(<DonationForm {...props} />);
    expect(screen.getByDisplayValue("ident-123")).toBeInTheDocument();
    expect(screen.getByDisplayValue("tel-123")).toBeInTheDocument();
  });

  it("handles duplicate available methods to cover no firstAvailable case", async () => {
    (useConfigList as any).mockReturnValue({
      data: [
        { id: "method-1", nombre: "Yape" },
        { id: "method-1", nombre: "Yape Duplicate" }
      ]
    });
    
    const props = {
      ...defaultProps,
      metodosDonacion: [{ metodoDonacionId: "method-1", numeroCuenta: "999", id: "1" }]
    };
    
    render(<DonationForm {...props} />);
    
    const addBtn = screen.getByRole("button", { name: /Agregar Método/i });
    // donations length is 1, availableMethods length is 2, so button is enabled!
    fireEvent.click(addBtn);
    
    expect(toast.error).toHaveBeenCalledWith("Ya has agregado todos los métodos disponibles");
  });

  it("handles submit when a donation item has empty metodoDonacionId to cover filter branch", async () => {
    (fetchApi as any).mockResolvedValueOnce({ ok: true });
    
    const props = {
      ...defaultProps,
      metodosDonacion: [
        { metodoDonacionId: "", numeroCuenta: "999", id: "1" }
      ]
    };
    render(<DonationForm {...props} />);
    
    fireEvent.submit(screen.getByTestId("form-wrapper"));
    
    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/perfil", expect.objectContaining({
        body: expect.stringContaining('"metodosDonacion":[]')
      }));
    });
  });

  it("handles null or undefined fallbacks for metodosDonacion and perfilArtista", () => {
    // 1. both null/undefined
    const { unmount } = render(
      <DonationForm
        metodosDonacion={null as any}
        perfilArtista={null as any}
        usuarioId="user-1"
        onSave={mockOnSave}
      />
    );
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    unmount();

    // 2. metodosDonacion contains item with metodoDonacion but no id, and no standard account fields
    const mockMethodsNullFields = [
      {
        id: "1",
        metodoDonacion: {} as any,
        metodoDonacionId: "method-1"
      }
    ];
    const { unmount: unmount2 } = render(
      <DonationForm
        metodosDonacion={mockMethodsNullFields as any}
        perfilArtista={{}}
        usuarioId="user-1"
        onSave={mockOnSave}
      />
    );
    // input is rendered but empty account field fallback
    expect(screen.getByPlaceholderText(/Ingresa el número de cuenta/i)).toHaveValue("");
    unmount2();

    // 3. metodosDonacion contains item with metodoDonacion and id
    const mockMethodsWithObject = [
      {
        id: "1",
        metodoDonacion: { id: "method-1" },
        metodoDonacionId: "method-2"
      }
    ];
    render(
      <DonationForm
        metodosDonacion={mockMethodsWithObject as any}
        perfilArtista={{}}
        usuarioId="user-1"
        onSave={mockOnSave}
      />
    );
  });

  it("handles parseJsonSafe returning null during QR upload and profile PATCH", async () => {
    const { parseJsonSafe } = await import("@/lib/api");
    (parseJsonSafe as any)
      .mockResolvedValueOnce(null) // for image upload json response
      .mockResolvedValueOnce(null); // for profile PATCH json response

    (convertFileToBase64 as any).mockResolvedValue("data:image/png;base64,mock");
    (fetchApi as any)
      .mockResolvedValueOnce({ ok: true }) // Image upload resolves but parseJsonSafe returns null
      .mockResolvedValueOnce({ ok: false }); // Profile PATCH fails and parseJsonSafe returns null

    render(<DonationForm {...defaultProps} />);
    
    // Upload image to trigger base64 upload
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = screen.getByTestId("form-wrapper").querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => expect(screen.getByAltText("QR Code")).toBeInTheDocument());

    const qrNameInput = screen.getByPlaceholderText("Ej: Yape, Plin, PayPal");
    await userEvent.type(qrNameInput, "My QR");

    fireEvent.submit(screen.getByTestId("form-wrapper"));

    await waitFor(() => {
      // toast.error should show the default fallback error "Error al guardar"
      expect(toast.error).toHaveBeenCalledWith("Error al guardar");
    });
  });

  it("submits with a valid donation method to cover filter/map callbacks on line 200", async () => {
    (fetchApi as any).mockResolvedValueOnce({ ok: true });
    
    const props = {
      ...defaultProps,
      metodosDonacion: [
        { metodoDonacionId: "method-1", numeroCuenta: "123456", id: "1" }
      ]
    };
    render(<DonationForm {...props} />);
    
    fireEvent.submit(screen.getByTestId("form-wrapper"));
    
    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/perfil", expect.objectContaining({
        body: expect.stringContaining('"metodosDonacion":[{"metodoDonacionId":"method-1","numeroCuenta":"123456"}]')
      }));
    });
  });

  it("handles non-Error exceptions during submit to cover line 218 fallback", async () => {
    (fetchApi as any).mockRejectedValueOnce("Raw string exception");
    
    render(<DonationForm {...defaultProps} />);
    
    fireEvent.submit(screen.getByTestId("form-wrapper"));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error al actualizar métodos de donación");
    });
  });
});
