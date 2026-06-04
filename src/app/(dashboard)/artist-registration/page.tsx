"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { fetchApi, parseJsonSafe } from "@/lib/api";
import { RegistrationPageShell } from "@/components/profile/RegistrationPageShell";
import { ArtistFormFields, type ArtistFormFieldsData } from "@/components/profile/ArtistFormFields";
import { ProfileFormWrapper } from '@/components/profile/ProfileFormWrapper';
import { useProfileFormControls } from '@/components/profile/useProfileFormControls';
import { useFormData } from '@/lib/useFormData';

import { toast } from "sonner";

export default function ArtistRegistrationPage() {
    const { data: session, update, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { formData, updateField } = useFormData<ArtistFormFieldsData & Record<string, unknown>>({
        initialData: {
            nombreArtistico: "",
            nombreUsuario: "",
            categoria: "",
            biografia: "",
            ciudad: "",
            pais: "",
            codigoTelefono: "+51",
            numeroTelefono: "",
            tarifaPorHora: "",
            moneda: "PEN",
            zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
            urlYoutubeFavorito: "",
            urlSoundCloudFavorito: "",
        },
        dependencies: [],
    });
    const { date: fechaInicio, setDate: setFechaInicio, open: calendarioAbierto, setOpen: setCalendarioAbierto, verified: usuarioVerificado, setVerified: setUsuarioVerificado } = useProfileFormControls(undefined, false);
    const [lugaresConocidos, setLugaresConocidos] = useState<readonly string[]>([]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/login');
            return;
        }

        if (session?.user?.name && !formData.nombreArtistico) {
            updateField('nombreArtistico', session.user.name);
        }
        const rolUsuario = session?.user?.rol;
        if (rolUsuario && rolUsuario !== 'SUPER_ADMIN' && rolUsuario !== 'ADMIN') {
            router.push('/home');
        }
    }, [session, router, status, formData.nombreArtistico]);

    const handleFieldChange = (field: keyof ArtistFormFieldsData, value: string) => {
        updateField(field, value as ArtistFormFieldsData[typeof field]);
    };

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!usuarioVerificado) {
            toast.error("Por favor verifica tu nombre de usuario");
            return;
        }

        if (fechaInicio && fechaInicio > new Date()) {
            toast.error("La fecha de inicio no puede ser futura");
            return;
        }
        setIsLoading(true);

        try {
            const payload = {
                correo: session?.user?.email,
                rol: 'ARTISTA',
                nombreArtistico: formData.nombreArtistico,
                nombreUsuario: formData.nombreUsuario,
                categoria: formData.categoria,
                biografia: formData.biografia,
                ciudadId: formData.ciudad,
                paisId: formData.pais,
                codigoTelefono: formData.codigoTelefono,
                numeroTelefono: formData.numeroTelefono,
                fechaInicio: fechaInicio ? fechaInicio.toISOString() : null,
                tarifaPorHora: Number.parseFloat(String(formData.tarifaPorHora)) || 0,
                moneda: formData.moneda,
                zonaHoraria: formData.zonaHoraria,
                lugaresConocidos: lugaresConocidos,
                urlYoutubeFavorito: formData.urlYoutubeFavorito,
                urlSoundCloudFavorito: formData.urlSoundCloudFavorito,
            };

            const response = await fetchApi('/api/usuarios/rol', {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await parseJsonSafe<{ token?: string; rol?: { nombre: string } }>(response);
                toast.success("¡Registro completado con éxito!");
                
                const esAdmin = session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN';
                if (update) {
                    await update({
                        rol: esAdmin ? session.user.rol : (data?.rol?.nombre || 'ARTISTA'),
                        nombreArtistico: formData.nombreArtistico,
                        name: formData.nombreArtistico,
                        accessToken: data?.token || session?.accessToken
                    });
                }
                // Hard navigation to force full JWT re-evaluation
                globalThis.location.replace(esAdmin ? '/settings' : '/home');
            } else {
                console.error('Failed to register artist');
                toast.error("Error al registrar artista. Inténtalo de nuevo.");
            }
        } catch (error) {
            console.error('Error registering artist:', error);
            toast.error("Error de conexión. Verifica tu internet.");
        } finally {
            setIsLoading(false);
        }
    };

    if (status === "loading") {
        return <LoadingScreen />;
    }

    const artistFieldsConfig = {
        email: session?.user?.email || "",
        usuarioId: session?.user?.id,
        formData,
        dateLabel: "Inicio de Carrera",
        date: fechaInicio,
        dateOpen: calendarioAbierto,
        datePlaceholder: "¿Cuándo empezaste?",
        onDateOpenChange: setCalendarioAbierto,
        onDateSelect: setFechaInicio,
        onNameChange: (val: string) => updateField('nombreArtistico', val),
        onUsernameChange: (val: string) => updateField('nombreUsuario', val),
        onStatusChange: setUsuarioVerificado,
        onCategoryChange: (val: string) => updateField('categoria', val),
        onCurrencyChange: (val: string) => updateField('moneda', val),
        onFieldChange: handleFieldChange,
        places: lugaresConocidos,
        onPlacesChange: setLugaresConocidos,
    };

    return (
        <RegistrationPageShell
            title="Registro de Artista"
            backHref={session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN' ? "/settings" : "/role-selection"}
        >
            <ProfileFormWrapper onSubmit={handleSubmit} isLoading={isLoading} saveDisabled={!usuarioVerificado}>
                <ArtistFormFields {...artistFieldsConfig} />
            </ProfileFormWrapper>
        </RegistrationPageShell>
    );
}
