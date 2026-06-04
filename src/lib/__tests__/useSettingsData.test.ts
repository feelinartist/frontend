import { renderHook, act } from "@testing-library/react";
import { useSettingsData } from "../useSettingsData";
import { fetchApi } from "@/lib/api";

// Mock fetchApi
vi.mock("@/lib/api", () => ({
    fetchApi: vi.fn(),
}));

describe("useSettingsData", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Spy on console.error to prevent it from cluttering the test output
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should initialize with default values", () => {
        const { result } = renderHook(() => useSettingsData(undefined));

        expect(result.current.bloqueados).toEqual([]);
        expect(result.current.cargandoBloqueados).toBe(false);
        expect(result.current.perfilesExistentes).toEqual({
            artista: false,
            publico: false,
            discoteca: false,
        });
    });

    it("should fetch data when userId is provided", async () => {
        const mockBloqueados = [{ id: "1", nombre: "Blocked User" }];
        const mockPerfil = { perfilArtista: true, perfilPublico: false, perfilDiscoteca: true };

        vi.mocked(fetchApi).mockImplementation(async (url: string) => {
            if (url.includes("/bloqueados/")) {
                return {
                    ok: true,
                    json: async () => mockBloqueados,
                } as any;
            }
            if (url.includes("/perfil/")) {
                return {
                    ok: true,
                    json: async () => mockPerfil,
                } as any;
            }
            return { ok: false } as any;
        });

        const { result } = renderHook(() => useSettingsData("user1"));

        // Initial state before fetch resolves
        expect(result.current.cargandoBloqueados).toBe(true);

        // Wait for all state updates
        await vi.waitFor(() => {
            expect(result.current.cargandoBloqueados).toBe(false);
        });

        expect(result.current.bloqueados).toEqual(mockBloqueados);
        expect(result.current.perfilesExistentes).toEqual({
            artista: true,
            publico: false,
            discoteca: true,
        });
    });

    it("should handle error when fetching bloqueados", async () => {
        vi.mocked(fetchApi).mockImplementation(async (url: string) => {
            if (url.includes("/bloqueados/")) {
                throw new Error("Network error");
            }
            if (url.includes("/perfil/")) {
                return { ok: true, json: async () => ({}) } as any;
            }
            return { ok: false } as any;
        });

        const { result } = renderHook(() => useSettingsData("user1"));

        await vi.waitFor(() => {
            expect(result.current.cargandoBloqueados).toBe(false);
        });

        expect(console.error).toHaveBeenCalledWith("Error cargando bloqueados:", expect.any(Error));
        expect(result.current.bloqueados).toEqual([]);
    });

    it("should handle non-ok response when fetching bloqueados", async () => {
        vi.mocked(fetchApi).mockImplementation(async (url: string) => {
            if (url.includes("/bloqueados/")) {
                return { ok: false } as any;
            }
            if (url.includes("/perfil/")) {
                return { ok: true, json: async () => ({}) } as any;
            }
            return { ok: false } as any;
        });

        const { result } = renderHook(() => useSettingsData("user1"));

        await vi.waitFor(() => {
            expect(result.current.cargandoBloqueados).toBe(false);
        });

        expect(result.current.bloqueados).toEqual([]);
    });

    it("should handle error when fetching perfil", async () => {
        vi.mocked(fetchApi).mockImplementation(async (url: string) => {
            if (url.includes("/bloqueados/")) {
                return { ok: true, json: async () => [] } as any;
            }
            if (url.includes("/perfil/")) {
                throw new Error("Profile error");
            }
            return { ok: false } as any;
        });

        const { result } = renderHook(() => useSettingsData("user1"));

        await vi.waitFor(() => {
            expect(console.error).toHaveBeenCalledWith("Error cargando perfil:", expect.any(Error));
        });

        expect(result.current.perfilesExistentes).toEqual({
            artista: false,
            publico: false,
            discoteca: false,
        });
    });

    it("should handle non-ok response when fetching perfil", async () => {
        vi.mocked(fetchApi).mockImplementation(async (url: string) => {
            if (url.includes("/bloqueados/")) {
                return { ok: true, json: async () => [] } as any;
            }
            if (url.includes("/perfil/")) {
                return { ok: false } as any;
            }
            return { ok: false } as any;
        });

        const { result } = renderHook(() => useSettingsData("user1"));

        await vi.waitFor(() => {
            expect(result.current.cargandoBloqueados).toBe(false); // Wait for block request to finish
        });

        expect(result.current.perfilesExistentes).toEqual({
            artista: false,
            publico: false,
            discoteca: false,
        });
    });

    it("should throw error if desbloquearUsuario is called without userId", async () => {
        const { result } = renderHook(() => useSettingsData(undefined));

        await expect(result.current.desbloquearUsuario("blocked1")).rejects.toThrow("Usuario no autenticado");
    });

    it("should throw error if desbloquearUsuario fetch fails", async () => {
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: false } as any);

        const { result } = renderHook(() => useSettingsData("user1"));

        await expect(result.current.desbloquearUsuario("blocked1")).rejects.toThrow("Error al desbloquear usuario");
        
        expect(fetchApi).toHaveBeenCalledWith("/api/usuarios/desbloquear", {
            method: "POST",
            body: JSON.stringify({
                bloqueadorId: "user1",
                bloqueadoId: "blocked1",
            }),
        });
    });

    it("should successfully desbloquearUsuario and reload bloqueados", async () => {
        let callCount = 0;
        vi.mocked(fetchApi).mockImplementation(async (url: string) => {
            if (url === "/api/usuarios/desbloquear") {
                return { ok: true } as any;
            }
            if (url.includes("/bloqueados/")) {
                callCount++;
                if (callCount === 1) {
                    return { ok: true, json: async () => [{ id: "blocked1" }] } as any;
                } else {
                    return { ok: true, json: async () => [] } as any;
                }
            }
            if (url.includes("/perfil/")) {
                return { ok: true, json: async () => ({}) } as any;
            }
            return { ok: false } as any;
        });

        const { result } = renderHook(() => useSettingsData("user1"));

        await vi.waitFor(() => {
            expect(result.current.bloqueados).toEqual([{ id: "blocked1" }]);
        });

        await act(async () => {
            await result.current.desbloquearUsuario("blocked1");
        });

        expect(result.current.bloqueados).toEqual([]);
    });

    it("cargarBloqueados should return early if no userId", async () => {
        const { result } = renderHook(() => useSettingsData(undefined));
        
        await act(async () => {
            await result.current.cargarBloqueados();
        });
        
        expect(fetchApi).not.toHaveBeenCalled();
    });

    it("cargarPerfil should return early if no userId", async () => {
        const { result } = renderHook(() => useSettingsData(undefined));
        
        await act(async () => {
            await result.current.cargarPerfil();
        });
        
        expect(fetchApi).not.toHaveBeenCalled();
    });
});
