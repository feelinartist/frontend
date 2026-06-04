import { useMemo, useState } from "react";
import { ArtistFormFields } from "@/components/profile/ArtistFormFields";
import { getArtistInitialFormData } from '@/lib/profile-initializers';
import { useProfileFormControls } from '@/components/profile/useProfileFormControls';
import { ProfileFormWrapper } from '@/components/profile/ProfileFormWrapper';
import { useFormData } from '@/lib/useFormData';

interface UserData {
    id?: string;
    nombre?: string;
    nombreUsuario?: string;
    correo?: string;
    perfilArtista?: {
        nombreArtistico?: string | null;
        categoria?: string | null;
        biografia?: string | null;
        ciudad?: string | null;
        pais?: string | null;
        codigoTelefono?: string | null;
        numeroTelefono?: string | null;
        tarifaPorHora?: string | number | null;
        moneda?: string | null;
        zonaHoraria?: string | null;
        fechaInicio?: string | Date | null;
        lugaresConocidos?: string[] | string | null;
        urlYoutubeFavorito?: string | null;
        urlSoundCloudFavorito?: string | null;
    } | null;
}

interface ArtistProfileFormProps {
    readonly userData: UserData;
    readonly onSubmit: (data: Partial<UserData> & { fechaInicio?: string | null }) => Promise<void>;
    readonly countries: { readonly name: string; readonly code: string; readonly phoneCode: string }[];
    readonly isLoading: boolean;
}

export function ArtistProfileForm({ userData, onSubmit, countries, isLoading }: ArtistProfileFormProps) {
    const initialFormData = useMemo(() => getArtistInitialFormData(userData, countries), [userData, countries]);

    const { formData, updateField } = useFormData({
        initialData: initialFormData,
        dependencies: [userData, countries],
    });

    const getInitialLugares = (): string[] => {
        const lugares = userData.perfilArtista?.lugaresConocidos;
        if (Array.isArray(lugares)) {
            return lugares;
        } else if (typeof lugares === 'string') {
            try {
                return JSON.parse(lugares);
            } catch (e) {
                console.error("Error parsing lugaresConocidos", e);
                return [];
            }
        }
        return [];
    };

    const { date: fechaInicio, setDate: setFechaInicio, open: calendarioAbierto, setOpen: setCalendarioAbierto, verified: usuarioVerificado, setVerified: setUsuarioVerificado } = useProfileFormControls(userData.perfilArtista?.fechaInicio ?? undefined, true);
    const [lugaresConocidos, setLugaresConocidos] = useState<readonly string[]>(getInitialLugares());

    // lugaresConocidos managed by PlacesEditor via setLugaresConocidos

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Prepare payload merging separate states
        const payload = {
            ...formData,
            fechaInicio: fechaInicio ? fechaInicio.toISOString() : null,
            lugaresConocidos: lugaresConocidos
        };

        onSubmit(payload);
    };

    const handleFieldChange = (field: keyof typeof formData, value: string) => {
        updateField(field, value as typeof formData[keyof typeof formData]);
    };

    const formProps = {
        email: userData.correo || "",
        usuarioId: userData.id,
        formData,
        dateLabel: "Inicio de Carrera",
        date: fechaInicio,
        dateOpen: calendarioAbierto,
        datePlaceholder: "¿Cuándo empezaste?",
        onDateOpenChange: setCalendarioAbierto,
        onDateSelect: setFechaInicio,
        onNameChange: (value: string) => updateField('nombreArtistico', value),
        onUsernameChange: (value: string) => updateField('nombreUsuario', value),
        onStatusChange: setUsuarioVerificado,
        onCategoryChange: (value: string) => updateField('categoria', value),
        onCurrencyChange: (value: string) => updateField('moneda', value),
        onFieldChange: handleFieldChange,
        places: lugaresConocidos,
        onPlacesChange: setLugaresConocidos,
    };

    return (
        <ProfileFormWrapper onSubmit={handleSubmit} isLoading={isLoading} saveDisabled={!usuarioVerificado}>
            <ArtistFormFields {...formProps} />
        </ProfileFormWrapper>
    );
}
