"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { fetchApi, parseJsonSafe } from "@/lib/api";
import { convertFileToBase64, DEFAULT_MAX_FILE_SIZE } from "@/lib/useFileToBase64";
import { DashedEmptyState } from "@/components/ui/DashedEmptyState";
import { useLoadingState } from "@/lib/use-loading-state";
import { useConfigList } from "@/lib/useConfigList";
import { ProfileFormWrapper } from '@/components/profile/ProfileFormWrapper';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

interface MetodoDonacion {
    id: string;
    nombre: string;
}

interface PerfilArtistaDonacion {
    id: string;
    metodoDonacionId: string;
    numeroCuenta: string;
    numeroTelefono?: string;
    identificador?: string;
    metodoDonacion?: MetodoDonacion;
}

interface PerfilArtista {
    urlPago?: string | null;
    pagoQR?: string | null;
    nombreQR?: string | null;
}

interface DonationFormProps {
    readonly metodosDonacion: PerfilArtistaDonacion[];
    readonly perfilArtista: PerfilArtista;
    readonly usuarioId: string;
    readonly onSave: () => void;
    readonly onLoadingChange?: (loading: boolean) => void;
}

interface DonationMethod {
    id: string; // Unique ID for React key
    metodoDonacionId: string;
    numeroCuenta: string;
}

export function DonationForm({ metodosDonacion, perfilArtista, usuarioId, onSave, onLoadingChange }: DonationFormProps) {
    const [loading, setGlobalLoading] = useLoadingState(onLoadingChange);
    const { data: availableMethods = [] } = useConfigList<MetodoDonacion>('/api/config/metodos-donacion');
    const [donations, setDonations] = useState<DonationMethod[]>(
        metodosDonacion?.map(md => ({
            id: crypto.randomUUID(),
            metodoDonacionId: md.metodoDonacion?.id || md.metodoDonacionId,
            numeroCuenta: md.numeroCuenta || md.identificador || md.numeroTelefono || ""
        })) || []
    );

    // Global QR and URL (one per artist profile)
    const [urlPagoGlobal, setUrlPagoGlobal] = useState(perfilArtista?.urlPago || "");
    const [pagoQRGlobal, setPagoQRGlobal] = useState(perfilArtista?.pagoQR || "");
    const [nombreQRGlobal, setNombreQRGlobal] = useState(perfilArtista?.nombreQR || "");
    const fileInputRef = useRef<HTMLInputElement>(null);

    

    const handleAdd = () => {
        // Find first method that hasn't been selected yet
        const selectedIds = new Set(donations.map(d => d.metodoDonacionId));
        const firstAvailable = availableMethods.find(m => !selectedIds.has(m.id));

        // Only add if there's an available method
        if (!firstAvailable) {
            toast.error("Ya has agregado todos los métodos disponibles");
            return;
        }

        setDonations([...donations, {
            id: crypto.randomUUID(),
            metodoDonacionId: firstAvailable.id,
            numeroCuenta: ""
        }]);
    };

    const handleRemove = (index: number) => {
        setDonations(donations.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof DonationMethod, value: string) => {
        const updated = [...donations];
        updated[index][field] = value;
        setDonations(updated);
    };

    const MAX_QR_SIZE = DEFAULT_MAX_FILE_SIZE;

    const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        if (file.size > MAX_QR_SIZE) {
            toast.error("El QR no puede exceder 2MB de tamaño");
            e.target.value = '';
            return;
        }

        try {
            toast.loading("Procesando QR...");

            // Convert to base64 for preview only
            const base64 = await convertFileToBase64(file);
            setPagoQRGlobal(base64);

            toast.dismiss();
            toast.success("QR cargado. Haz click en 'Guardar Cambios' para subirlo.");

            // Reset input
            e.target.value = '';
        } catch (error) {
            console.error("Error converting QR:", error);
            toast.dismiss();
            toast.error("Error al procesar el QR");
        }
    };

    const handleRemoveQR = () => {
        setPagoQRGlobal("");
        toast.success("QR eliminado");
    };



    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setGlobalLoading(true);

        // Validation: QR Name and Image must exist together
        const hasQRName = !!nombreQRGlobal.trim();
        const hasQRImage = !!pagoQRGlobal;

        if (hasQRName !== hasQRImage) {
            toast.error(hasQRName
                ? "Debes subir una imagen para el QR si ingresas un nombre"
                : "Debes ingresar un nombre para identificar el QR"
            );
            setGlobalLoading(false);
            return;
        }

        // Validation: All donation methods must have an account number
        const methodsWithEmptyAccount = donations.some(d => !d.numeroCuenta || d.numeroCuenta.trim() === "");
        if (methodsWithEmptyAccount) {
            toast.error("Todos los métodos de donación deben tener un número de cuenta");
            setGlobalLoading(false);
            return;
        }

        try {
            let finalQRUrl = pagoQRGlobal;

            // Upload QR if it's a new base64 image
            if (pagoQRGlobal?.startsWith('data:')) {
                const loadingToast = toast.loading("Subiendo QR...");

                const response = await fetchApi('/api/imagenes/qr-pago', {
                    method: 'POST',
                    body: JSON.stringify({
                        usuarioId,
                        image: pagoQRGlobal
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al subir el QR');
                }

                const data = await parseJsonSafe<{ url?: string }>(response) ?? {};
                finalQRUrl = data.url || finalQRUrl;
                toast.dismiss(loadingToast);
            } else if (pagoQRGlobal) {
                // It's already a URL
                finalQRUrl = pagoQRGlobal;
            }

            const response = await fetchApi('/api/usuarios/perfil', {
                method: 'PATCH',
                body: JSON.stringify({
                    usuarioId,
                    metodosDonacion: donations.filter(d => d.metodoDonacionId && d.numeroCuenta).map((d) => ({
                        metodoDonacionId: d.metodoDonacionId,
                        numeroCuenta: d.numeroCuenta
                    })),
                    urlPago: urlPagoGlobal,
                    pagoQR: finalQRUrl,
                    nombreQR: nombreQRGlobal
                }),
            });

            if (!response.ok) {
                const bodyError = await parseJsonSafe<{ message?: string }>(response);
                throw new Error(bodyError?.message || "Error al guardar");
            }
            toast.success("Métodos de donación actualizados correctamente");
            onSave();
        } catch (e: unknown) {
            console.error("Excepción en donaciones:", e);
            toast.error(e instanceof Error ? e.message : "Error al actualizar métodos de donación");
        } finally {
            setGlobalLoading(false);
        }
    };

    return (
        <ProfileFormWrapper onSubmit={handleSubmit} isLoading={loading}>
            <div className="space-y-6">
                {/* Payment Methods Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">

                        <Button
                            type="button"
                            onClick={handleAdd}
                            variant="outline"
                            className="border-white/10 bg-black/20 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={donations.length >= availableMethods.length}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Método
                        </Button>
                    </div>

                    {donations.length > 0 ? (
                        <div className="space-y-3">
                            {donations.map((donation, index) => {
                                const selectedMethod = availableMethods.find(m => m.id === donation.metodoDonacionId);

                                return (
                                    <div key={donation.id} className="flex gap-3 items-end p-3 border border-zinc-800 rounded-lg bg-zinc-900/30">
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-zinc-300">Método</Label>
                                            <Select
                                                value={donation.metodoDonacionId}
                                                onValueChange={(value) => handleChange(index, 'metodoDonacionId', value)}
                                            >
                                                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white h-11 rounded-xl px-3 text-sm">
                                                    <SelectValue>
                                                        {selectedMethod?.nombre || "Selecciona un método"}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                    {availableMethods
                                                        .filter(method => {
                                                            // Show current selection or methods not yet selected
                                                            const isCurrentSelection = method.id === donation.metodoDonacionId;
                                                            const isAlreadySelected = donations.some((d, i) =>
                                                                i !== index && d.metodoDonacionId === method.id
                                                            );
                                                            return isCurrentSelection || !isAlreadySelected;
                                                        })
                                                        .map(method => (
                                                            <SelectItem key={method.id} value={method.id}>
                                                                {method.nombre}
                                                            </SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <Label className="text-zinc-300">Número de Cuenta</Label>
                                            <Input
                                                value={donation.numeroCuenta}
                                                onChange={(e) => handleChange(index, 'numeroCuenta', e.target.value)}
                                                placeholder="Ingresa el número de cuenta, teléfono, email, etc."
                                                className="bg-zinc-900/50 border-zinc-800 text-white h-11 rounded-xl px-4 text-sm"
                                            />
                                        </div>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Eliminar método"
                                            onClick={() => handleRemove(index)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <DashedEmptyState title="No has agregado métodos de donación" subtitle={"Haz click en \"Agregar Método\" para comenzar"} />
                    )}
                </div>

                {/* Global QR and URL Section */}
                <div className="border-t border-zinc-800 pt-6 space-y-4">
                    <div>
                        <h3 className="text-lg font-medium text-white">Información Adicional</h3>
                        <p className="text-sm text-zinc-400">Agrega un QR o link de pago general (opcional)</p>
                    </div>

                    <div className="space-y-4">
                        {/* Payment URL */}
                        <div className="space-y-2">
                            <Label className="text-zinc-300">URL de Pago (Opcional)</Label>
                            <Input
                                value={urlPagoGlobal}
                                onChange={(e) => setUrlPagoGlobal(e.target.value)}
                                placeholder="https://paypal.me/tuusuario"
                                className="bg-zinc-900/50 border-zinc-800 text-white h-11 rounded-xl px-4 text-sm"
                            />
                            <p className="text-xs text-zinc-500">Link general para recibir donaciones</p>
                        </div>

                        {/* QR Name */}
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Nombre del QR (Opcional)</Label>
                            <Input
                                value={nombreQRGlobal}
                                onChange={(e) => setNombreQRGlobal(e.target.value)}
                                placeholder="Ej: Yape, Plin, PayPal"
                                className="bg-zinc-900/50 border-zinc-800 text-white h-11 rounded-xl px-4 text-sm"
                            />
                            <p className="text-xs text-zinc-500">Identifica de qué app es el QR</p>
                        </div>

                        {/* QR Code */}
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Código QR (Opcional)</Label>
                            {pagoQRGlobal ? (
                                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 group">
                                    <Image
                                        src={pagoQRGlobal}
                                        alt="QR Code"
                                        width={128}
                                        height={128}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                    <button
                                        type="button"
                                        aria-label="Eliminar QR"
                                        onClick={handleRemoveQR}
                                        className="absolute top-1 right-1 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <Button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        variant="outline"
                                        className="border-zinc-800 hover:bg-zinc-800/50 text-white gap-2"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Subir QR
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleQRUpload}
                                    />
                                </div>
                            )}
                            <p className="text-xs text-zinc-500">QR general para recibir donaciones</p>
                        </div>
                    </div>
                </div>
            </div>
        </ProfileFormWrapper>
    );
}
