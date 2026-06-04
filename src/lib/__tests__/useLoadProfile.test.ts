import { renderHook, act } from "@testing-library/react";
import { useLoadProfile } from "../useLoadProfile";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { vi, Mock } from "vitest";

vi.mock("@/lib/api", () => ({
  fetchApi: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/lib/countries", () => ({
  countries: [
    { code: "PE", name: "Perú" },
    { code: "US", name: "United States" },
    { code: "MX", name: "México" }
  ]
}));

describe("useLoadProfile", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("handles undefined userId", async () => {
        const { result } = renderHook(() => useLoadProfile(undefined));

        await act(async () => {
            await result.current.loadProfile();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.perfilCompleto).toBeNull();
    });

    it("loads data successfully with artista profile and exact country code", async () => {
        const mockData = {
            nombre: "Test",
            correo: "test@test.com",
            nombreUsuario: "tester",
            perfilArtista: {
                nombreArtistico: "Art",
                pais: "PE",
                ciudad: "Lima",
                zonaHoraria: "GMT-5",
                numeroTelefono: "123",
                codigoTelefono: "+51"
            }
        };

        (fetchApi as Mock).mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const { result } = renderHook(() => useLoadProfile("123"));

        await act(async () => {
            await result.current.loadProfile();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.perfilCompleto).toEqual(mockData);
        expect(result.current.formData).toEqual({
            nombre: "Test",
            correo: "test@test.com",
            nombreUsuario: "tester",
            nombreArtistico: "Art",
            pais: "PE",
            ciudad: "Lima",
            zonaHoraria: "GMT-5",
            numeroTelefono: "123",
            codigoTelefono: "+51"
        });
    });

    it("loads data successfully with publico profile and country name match", async () => {
        const mockData = {
            perfilPublico: {
                pais: "peru", // Should match 'Perú' normalized
                ciudad: 123, // Invalid type, should fallback
                zonaHoraria: null, // Should fallback
            }
        };

        (fetchApi as Mock).mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const { result } = renderHook(() => useLoadProfile("123"));

        await act(async () => {
            await result.current.loadProfile();
        });

        expect(result.current.formData.pais).toBe("PE");
        expect(result.current.formData.ciudad).toBe("");
        expect(result.current.formData.zonaHoraria).toBe("");
    });

    it("loads data successfully with discoteca profile and unknown country", async () => {
        const mockData = {
            perfilDiscoteca: {
                pais: "Unknown",
                codigoTelefono: null,
                numeroTelefono: null
            }
        };

        (fetchApi as Mock).mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const { result } = renderHook(() => useLoadProfile("123"));

        await act(async () => {
            await result.current.loadProfile();
        });

        expect(result.current.formData.pais).toBe("");
        expect(result.current.formData.codigoTelefono).toBe("+51");
        expect(result.current.formData.numeroTelefono).toBe("");
    });

    it("loads data successfully with no specific profile and non-string country", async () => {
        const mockData = {
            perfilArtista: {
                pais: 123 // not string
            }
        };

        (fetchApi as Mock).mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const { result } = renderHook(() => useLoadProfile("123"));

        await act(async () => {
            await result.current.loadProfile();
        });

        expect(result.current.formData.pais).toBe("");
    });
    
    it("loads data successfully when no profile types exist", async () => {
        const mockData = {
            nombre: "Only Name"
        };

        (fetchApi as Mock).mockResolvedValue({
            ok: true,
            json: async () => mockData
        });

        const { result } = renderHook(() => useLoadProfile("123"));

        await act(async () => {
            await result.current.loadProfile();
        });

        expect(result.current.formData.nombre).toBe("Only Name");
        expect(result.current.formData.pais).toBe("");
    });
    
    it("handles fetch failure without throwing", async () => {
        (fetchApi as Mock).mockResolvedValue({
            ok: false
        });

        const { result } = renderHook(() => useLoadProfile("123"));

        await act(async () => {
            await result.current.loadProfile();
        });

        expect(result.current.isLoading).toBe(false);
        // formData remains default
    });

    it("handles fetch error and calls toast", async () => {
        (fetchApi as Mock).mockRejectedValue(new Error("API Error"));

        const { result } = renderHook(() => useLoadProfile("123"));

        await act(async () => {
            await result.current.loadProfile();
        });

        expect(result.current.isLoading).toBe(false);
        expect(toast.error).toHaveBeenCalledWith("Error al cargar datos del perfil");
        expect(console.error).toHaveBeenCalledWith("Error cargando perfil:", expect.any(Error));
    });
});
