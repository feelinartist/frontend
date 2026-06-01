"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, Image as ImageIcon, Save } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { convertFileToBase64 } from '@/lib/useFileToBase64';

interface GalleryFormProps {
    readonly galeria: { readonly urlImagen: string }[];
    readonly usuarioId: string;
    readonly onSave: () => void;
    readonly onLoadingChange?: (loading: boolean) => void;
}

export function GalleryForm({ galeria, usuarioId, onSave, onLoadingChange }: GalleryFormProps) {
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>(galeria?.map(g => g.urlImagen) || []);
    const [imageNames, setImageNames] = useState<string[]>(galeria?.map(g => g.urlImagen.split('/').pop() || '') || []);

    const MAX_IMAGES = 6;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

    // Helper to sync local and global loading
    const setGlobalLoading = (isLoading: boolean) => {
        setLoading(isLoading);
        onLoadingChange?.(isLoading);
    };

    // using shared convertFileToBase64

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Check limit
        if (images.length >= MAX_IMAGES) {
            toast.error(`Solo puedes subir máximo ${MAX_IMAGES} imágenes`);
            return;
        }

        const remainingSlots = MAX_IMAGES - images.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);

        if (files.length > remainingSlots) {
            toast.warning(`Solo puedes agregar ${remainingSlots} imagen(es) más`);
        }

        try {
            // Validate file sizes and duplicates
            const validFiles: File[] = [];
            const errors: string[] = [];

            for (const file of filesToProcess) {
                // Check file size
                if (file.size > MAX_FILE_SIZE) {
                    errors.push(`${file.name} excede el tamaño máximo de 5MB`);
                    continue;
                }

                // Check for duplicate filename
                if (imageNames.includes(file.name)) {
                    errors.push(`${file.name} ya existe en la galería`);
                    continue;
                }

                validFiles.push(file);
            }

            // Show errors if any
            if (errors.length > 0) {
                errors.forEach(error => toast.error(error));
            }

            // Process valid files
            if (validFiles.length > 0) {
                toast.loading("Procesando imágenes...");

                // Convert to base64 for preview only
                const base64Images = await Promise.all(
                    validFiles.map(file => convertFileToBase64(file))
                );

                const newNames = validFiles.map(f => f.name);

                setImages(prev => [...prev, ...base64Images]);
                setImageNames(prev => [...prev, ...newNames]);
                toast.dismiss();
                toast.success(`${base64Images.length} imagen(es) agregada(s). Haz click en "Guardar Cambios" para subirlas.`);
            }

            // Reset input
            e.target.value = '';
        } catch (error) {
            console.error("Error converting images:", error);
            toast.dismiss();
            toast.error("Error al procesar las imágenes");
        }
    };

    const handleRemoveImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        const newNames = imageNames.filter((_, i) => i !== index);
        setImages(newImages);
        setImageNames(newNames);
        toast.success("Imagen eliminada");
    };

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setGlobalLoading(true);

        try {
            // Separate existing URLs from new base64 images
            const existingUrls = images.filter(img => img.startsWith('http'));
            const newBase64Images = images.filter(img => img.startsWith('data:'));

            let uploadedUrls = [...existingUrls];

            // Upload new images if any
            if (newBase64Images.length > 0) {
                const loadingToast = toast.loading(`Subiendo ${newBase64Images.length} imagen(es)...`);

                const response = await fetchApi('/api/imagenes/galeria', {
                    method: 'POST',
                    body: JSON.stringify({
                        usuarioId,
                        images: newBase64Images
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al subir las imágenes');
                }

                const data = await response.json();
                uploadedUrls = [...uploadedUrls, ...data.urls];
                toast.dismiss(loadingToast);
            }

            // Save to profile
            const profileResponse = await fetchApi('/api/usuarios/perfil', {
                method: 'PATCH',
                body: JSON.stringify({
                    usuarioId,
                    galeria: uploadedUrls.map(url => ({ urlImagen: url }))
                }),
            });

            if (!profileResponse.ok) {
                const error = await profileResponse.json();
                throw new Error(error.message || "Error al guardar");
            }

            toast.success("Galería actualizada correctamente");
            onSave();
        } catch (error: unknown) {
            console.error("Error:", error);
            const errorMessage = error instanceof Error ? error.message : "Error al actualizar galería";
            toast.error(errorMessage);
        } finally {
            setGlobalLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">

                    {images.length < MAX_IMAGES && (
                        <label htmlFor="image-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-black/20 text-white hover:bg-white/10 rounded-lg transition-colors">
                                <Upload className="h-4 w-4" />
                                <span>Subir Imagen</span>
                            </div>
                        </label>
                    )}
                    <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{images.length} de {MAX_IMAGES} imágenes</span>
                    {images.length >= MAX_IMAGES && (
                        <span className="text-amber-400">Límite alcanzado</span>
                    )}
                </div>

                {images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((url, index) => (
                            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-900">
                                <Image
                                    src={url}
                                    alt={`Imagen ${index + 1}`}
                                    width={300}
                                    height={300}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                                <button
                                    type="button"
                                    aria-label={`Eliminar Imagen ${index + 1}`}
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-lg">
                        <ImageIcon className="h-12 w-12 text-zinc-600 mb-4" />
                        <p className="text-zinc-400 text-sm">No has agregado imágenes aún</p>
                        <p className="text-zinc-500 text-xs mt-1">Haz click en &quot;Subir Imagen&quot; para comenzar</p>
                    </div>
                )}
            </div>

            <div className="pt-4">
                <Button
                    type="submit"
                    className="w-full bg-white text-black hover:bg-zinc-200 font-semibold h-11 rounded-xl text-sm shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Guardando cambios...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" />
                            Guardar Cambios
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
