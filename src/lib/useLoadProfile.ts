import { useCallback, useState } from "react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { countries } from "@/lib/countries";

interface PerfilArtista {
    id?: string;
    nombreArtistico?: string | null;
    categoria?: string | null;
    pais?: string | null;
    ciudad?: string | null;
    fechaInicio?: string | Date | null;
    lugaresConocidos?: string[];
    codigoTelefono?: string | null;
    numeroTelefono?: string | null;
    tarifaPorHora?: number | null;
    moneda?: string | null;
    biografia?: string | null;
    urlPago?: string | null;
    pagoQR?: string | null;
    nombreQR?: string | null;
    galeria?: { id?: string; urlImagen: string; tipo?: string; descripcion?: string }[];
    redesSociales?: {
        id: string;
        nombreUsuario: string;
        redSocial: {
            id: string;
            nombre: string;
            icono: string;
            urlBase: string;
        };
        redSocialId?: string;
    }[];
    metodosDonacion?: {
        id: string;
        metodoDonacionId: string;
        numeroCuenta: string;
        numeroTelefono?: string;
        identificador?: string;
        metodoDonacion?: {
            id: string;
            nombre: string;
        };
    }[];
    [key: string]: unknown;
}

interface PerfilDiscoteca {
    id?: string;
    nombre?: string | null;
    direccion?: string | null;
    capacidad?: number | null;
    fechaFundacion?: string | Date | null;
    pais?: string | null;
    ciudad?: string | null;
    zonaHoraria?: string | null;
    [key: string]: unknown;
}

interface PerfilPublico {
    id?: string;
    preferencias?: unknown;
    pais?: string | null;
    ciudad?: string | null;
    zonaHoraria?: string | null;
    [key: string]: unknown;
}

interface PerfilCompleto {
    nombre?: string;
    correo?: string;
    nombreUsuario?: string;
    perfilArtista?: PerfilArtista | null;
    perfilDiscoteca?: PerfilDiscoteca | null;
    perfilPublico?: PerfilPublico | null;
    [key: string]: unknown;
}

interface ProfileData {
    nombre?: string;
    correo?: string;
    nombreUsuario?: string;
    nombreArtistico?: string;
    pais?: string;
    ciudad?: string;
    zonaHoraria?: string;
    numeroTelefono?: string;
    codigoTelefono?: string;
    [key: string]: unknown;
}

interface UseLoadProfileReturn {
    perfilCompleto: PerfilCompleto | null;
    formData: ProfileData;
    isLoading: boolean;
    loadProfile: () => Promise<void>;
}

const normalize = (text: string) =>
    text.toLowerCase().normalize("NFD").replaceAll(/[\u0300-\u036f]/g, "");

export function useLoadProfile(userId: string | undefined): UseLoadProfileReturn {
    const [perfilCompleto, setPerfilCompleto] = useState<Record<string, unknown> | null>(null);
    const [formData, setFormData] = useState<ProfileData>({
        nombre: "",
        correo: "",
        nombreUsuario: "",
        nombreArtistico: "",
        pais: "",
        ciudad: "",
        zonaHoraria: "",
        numeroTelefono: "",
        codigoTelefono: "+51",
    });
    const [isLoading, setIsLoading] = useState(true);

    const loadProfile = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const res = await fetchApi(`/api/usuarios/perfil/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setPerfilCompleto(data);

                // Extract profile specific data
                let perfilData: Record<string, unknown> = {};
                if (data.perfilArtista) perfilData = data.perfilArtista;
                else if (data.perfilPublico) perfilData = data.perfilPublico;
                else if (data.perfilDiscoteca) perfilData = data.perfilDiscoteca;

                setFormData({
                    nombre: data.nombre || "",
                    correo: data.correo || "",
                    nombreArtistico: data.perfilArtista?.nombreArtistico || "",
                    nombreUsuario: data.nombreUsuario || "",
                    pais: (() => {
                        const paisGuardado = perfilData.pais;
                        if (typeof paisGuardado !== "string") return "";

                        // Try to find exact code match
                        const exactMatch = countries.find(c => c.code === paisGuardado);
                        if (exactMatch) return exactMatch.code;

                        // Try to find name match (case and accent insensitive)
                        const nameMatch = countries.find(c => normalize(c.name) === normalize(paisGuardado));
                        if (nameMatch) return nameMatch.code;

                        return "";
                    })(),
                    ciudad: typeof perfilData.ciudad === "string" ? perfilData.ciudad : "",
                    zonaHoraria: typeof perfilData.zonaHoraria === "string" ? perfilData.zonaHoraria : "",
                    numeroTelefono: typeof perfilData.numeroTelefono === "string" ? perfilData.numeroTelefono : "",
                    codigoTelefono: typeof perfilData.codigoTelefono === "string" ? perfilData.codigoTelefono : "+51",
                });
            }
        } catch (error) {
            console.error("Error cargando perfil:", error);
            toast.error("Error al cargar datos del perfil");
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    return {
        perfilCompleto,
        formData,
        isLoading,
        loadProfile,
    };
}
