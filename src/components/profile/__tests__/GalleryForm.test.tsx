import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GalleryForm } from "../GalleryForm";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        fetchApi: vi.fn(),
    };
});

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
        warning: vi.fn(),
    },
}));

describe("GalleryForm Component", () => {
    const defaultProps = {
        galeria: [],
        usuarioId: "user-123",
        onSave: vi.fn(),
        onLoadingChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders empty state and handles undefined galeria", () => {
        render(<GalleryForm {...defaultProps} galeria={undefined as any} />);
        expect(screen.getByText("No has agregado imágenes aún")).toBeInTheDocument();
        expect(screen.getByText("0 de 6 imágenes")).toBeInTheDocument();
    });

    it("renders list of existing images", () => {
        render(<GalleryForm {...defaultProps} galeria={[
            { urlImagen: "https://example.com/img1.png" },
            { urlImagen: "https://example.com/" }
        ]} />);
        expect(screen.getByAltText("Imagen 1")).toBeInTheDocument();
        expect(screen.getByAltText("Imagen 2")).toBeInTheDocument();
        expect(screen.getByText("2 de 6 imágenes")).toBeInTheDocument();
    });

    it("handles no files selected in input", () => {
        render(<GalleryForm {...defaultProps} />);
        const input = document.getElementById("image-upload") as HTMLInputElement;
        fireEvent.change(input, { target: { files: null } });
        expect(toast.error).not.toHaveBeenCalled();
    });

    it("prevents upload if max image limit is already reached", () => {
        const fullGallery = [
            { urlImagen: "https://example.com/img1.png" },
            { urlImagen: "https://example.com/img2.png" },
            { urlImagen: "https://example.com/img3.png" },
            { urlImagen: "https://example.com/img4.png" },
            { urlImagen: "https://example.com/img5.png" },
            { urlImagen: "https://example.com/img6.png" },
        ];
        render(<GalleryForm {...defaultProps} galeria={fullGallery} />);
        
        expect(screen.queryByText("Subir Imagen")).not.toBeInTheDocument();
        expect(screen.getByText("Límite alcanzado")).toBeInTheDocument();

        // Trigger change event to hit the limit check
        const file = new File(["test-image"], "test.png", { type: "image/png" });
        const input = document.getElementById("image-upload") as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        expect(toast.error).toHaveBeenCalledWith("Solo puedes subir máximo 6 imágenes");
    });

    it("warns and slices if uploaded files exceed remaining slots", async () => {
        const partialGallery = [
            { urlImagen: "https://example.com/img1.png" },
            { urlImagen: "https://example.com/img2.png" },
            { urlImagen: "https://example.com/img3.png" },
            { urlImagen: "https://example.com/img4.png" },
            { urlImagen: "https://example.com/img5.png" },
        ];
        render(<GalleryForm {...defaultProps} galeria={partialGallery} />);
        
        // Remaining slots = 1. We upload 2 files.
        const file1 = new File(["test-image-1"], "test1.png", { type: "image/png" });
        const file2 = new File(["test-image-2"], "test2.png", { type: "image/png" });

        const readSpy = vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function(this: FileReader) {
            setTimeout(() => {
                Object.defineProperty(this, "result", { value: "data:image/png;base64,mock-img-data", configurable: true });
                if (this.onload) {
                    this.onload({} as ProgressEvent);
                }
            }, 0);
        });

        const input = document.getElementById("image-upload") as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file1, file2] } });

        await waitFor(() => {
            expect(toast.warning).toHaveBeenCalledWith("Solo puedes agregar 1 imagen(es) más");
            expect(toast.success).toHaveBeenCalledWith("1 imagen(es) agregada(s). Haz click en \"Guardar Cambios\" para subirlas.");
        });

        readSpy.mockRestore();
    });

    it("validates file sizes and duplicate file names", async () => {
        render(<GalleryForm {...defaultProps} galeria={[{ urlImagen: "https://example.com/test-existing.png" }]} />);
        
        // 1. Large file (> 5MB)
        const largeFile = new File(["a".repeat(6 * 1024 * 1024)], "large.png", { type: "image/png" });
        // 2. Duplicate file name (existing gallery URL splits to test-existing.png)
        const duplicateFile = new File(["duplicate-content"], "test-existing.png", { type: "image/png" });

        const input = document.getElementById("image-upload") as HTMLInputElement;
        fireEvent.change(input, { target: { files: [largeFile, duplicateFile] } });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("large.png excede el tamaño máximo de 5MB");
            expect(toast.error).toHaveBeenCalledWith("test-existing.png ya existe en la galería");
        });
    });

    it("handles FileReader failures gracefully in handleImageUpload", async () => {
        render(<GalleryForm {...defaultProps} />);
        const file = new File(["error-img"], "error.png", { type: "image/png" });

        const readSpy = vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function(this: FileReader) {
            setTimeout(() => {
                if (this.onerror) {
                    this.onerror({} as ProgressEvent);
                }
            }, 0);
        });

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const input = document.getElementById("image-upload") as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al procesar las imágenes");
            expect(consoleSpy).toHaveBeenCalled();
        });

        readSpy.mockRestore();
        consoleSpy.mockRestore();
    });

    it("allows removing an existing image", () => {
        render(<GalleryForm {...defaultProps} galeria={[{ urlImagen: "https://example.com/img1.png" }]} />);
        
        const removeButton = screen.getByRole("button", { name: "Eliminar Imagen 1" });
        fireEvent.click(removeButton);

        expect(toast.success).toHaveBeenCalledWith("Imagen eliminada");
        expect(screen.queryByAltText("Imagen 1")).not.toBeInTheDocument();
    });

    it("saves successfully with only existing images (no new uploads)", async () => {
        (fetchApi as any).mockResolvedValue({ ok: true });

        render(<GalleryForm {...defaultProps} galeria={[{ urlImagen: "https://example.com/img1.png" }]} />);

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith(
                "/api/usuarios/perfil",
                expect.objectContaining({
                    method: "PATCH",
                    body: expect.stringContaining('"galeria":[{"urlImagen":"https://example.com/img1.png"}]')
                })
            );
            expect(toast.success).toHaveBeenCalledWith("Galería actualizada correctamente");
            expect(defaultProps.onSave).toHaveBeenCalled();
        });
    });

    it("uploads new base64 images first, then updates profile successfully", async () => {
        // Mock upload endpoint and update profile endpoint
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/imagenes/galeria") {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ urls: ["https://s3.com/new1.png"] }),
                });
            }
            if (url === "/api/usuarios/perfil") {
                return Promise.resolve({ ok: true });
            }
            return Promise.resolve({ ok: false });
        });

        render(<GalleryForm {...defaultProps} galeria={[{ urlImagen: "https://example.com/img1.png" }]} />);

        // Upload a new image to populate base64 array
        const file = new File(["new-img"], "new.png", { type: "image/png" });
        const readSpy = vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function(this: FileReader) {
            setTimeout(() => {
                Object.defineProperty(this, "result", { value: "data:image/png;base64,mock-new-img", configurable: true });
                if (this.onload) {
                    this.onload({} as ProgressEvent);
                }
            }, 0);
        });

        const input = document.getElementById("image-upload") as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByAltText("Imagen 2")).toBeInTheDocument();
        });

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith(
                "/api/imagenes/galeria",
                expect.objectContaining({
                    method: "POST",
                    body: expect.stringContaining('"images":["data:image/png;base64,mock-new-img"]')
                })
            );
            expect(fetchApi).toHaveBeenCalledWith(
                "/api/usuarios/perfil",
                expect.objectContaining({
                    method: "PATCH",
                    body: expect.stringContaining('"galeria":[{"urlImagen":"https://example.com/img1.png"},{"urlImagen":"https://s3.com/new1.png"}]')
                })
            );
            expect(toast.success).toHaveBeenCalledWith("Galería actualizada correctamente");
            expect(defaultProps.onSave).toHaveBeenCalled();
        });

        readSpy.mockRestore();
    });

    it("handles gallery upload API failure gracefully", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/imagenes/galeria") {
                return Promise.resolve({ ok: false, status: 500 });
            }
            return Promise.resolve({ ok: false });
        });

        render(<GalleryForm {...defaultProps} />);

        // Upload a new image to populate base64 array
        const file = new File(["new-img"], "new.png", { type: "image/png" });
        const readSpy = vi.spyOn(FileReader.prototype, "readAsDataURL").mockImplementation(function(this: FileReader) {
            setTimeout(() => {
                Object.defineProperty(this, "result", { value: "data:image/png;base64,mock-new-img", configurable: true });
                if (this.onload) {
                    this.onload({} as ProgressEvent);
                }
            }, 0);
        });

        const input = document.getElementById("image-upload") as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByAltText("Imagen 1")).toBeInTheDocument();
        });

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al subir las imágenes");
        });

        readSpy.mockRestore();
    });

    it("handles profile update PATCH API failure gracefully", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/usuarios/perfil") {
                return Promise.resolve({
                    ok: false,
                    json: async () => ({ message: "Profile update blocked" }),
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<GalleryForm {...defaultProps} galeria={[{ urlImagen: "https://example.com/img1.png" }]} />);

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Profile update blocked");
        });
    });

    it("handles profile update PATCH API failure without custom message gracefully", async () => {
        (fetchApi as any).mockImplementation((url: string, init?: any) => {
            if (url === "/api/usuarios/perfil") {
                return Promise.resolve({
                    ok: false,
                    json: async () => ({}),
                });
            }
            return Promise.resolve({ ok: false });
        });

        render(<GalleryForm {...defaultProps} galeria={[{ urlImagen: "https://example.com/img1.png" }]} />);

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al guardar");
        });
    });

    it("handles submit throwing a non-Error object exception gracefully", async () => {
        (fetchApi as any).mockRejectedValueOnce("Raw string exception");

        render(<GalleryForm {...defaultProps} galeria={[{ urlImagen: "https://example.com/img1.png" }]} />);

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Error al actualizar galería");
        });
    });

    it("displays spinner during loading state", async () => {
        // Keep api request pending
        let resolvePromise: any;
        const pendingPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });
        (fetchApi as any).mockImplementation(() => pendingPromise);

        render(<GalleryForm {...defaultProps} galeria={[{ urlImagen: "https://example.com/img1.png" }]} />);

        const submitButton = screen.getByText("Guardar Cambios");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("Guardando cambios...")).toBeInTheDocument();
            expect(defaultProps.onLoadingChange).toHaveBeenCalledWith(true);
        });

        // Cleanup
        resolvePromise({ ok: true });
    });
});
