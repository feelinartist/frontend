import { useMemo } from "react";
import { ProfileContactSection } from "@/components/profile/ProfileContactSection";
import { ProfileFormHeader } from "@/components/profile/ProfileFormHeader";
import { getVenueInitialFormData } from '@/lib/profile-initializers';
import { useProfileFormControls } from '@/components/profile/useProfileFormControls';
import { ProfileFormWrapper } from '@/components/profile/ProfileFormWrapper';
import { useFormData } from '@/lib/useFormData';

interface VenueUserData {
    nombre?: string;
    nombreUsuario?: string;
    correo?: string;
    perfilDiscoteca?: {
        ciudad?: string | null;
        pais?: string | null;
        codigoTelefono?: string | null;
        numeroTelefono?: string | null;
        zonaHoraria?: string | null;
        fechaFundacion?: string | Date | null;
    } | null;
}

interface VenueProfileFormProps {
    readonly userData: VenueUserData;
    readonly onSubmit: (data: Partial<VenueUserData> & { fechaFundacion?: string | null }) => Promise<void>;
    readonly countries: { readonly name: string; readonly code: string; readonly phoneCode: string }[];
    readonly isLoading: boolean;
}

export function VenueProfileForm({ userData, onSubmit, countries, isLoading }: VenueProfileFormProps) {
    const initialFormData = useMemo(() => getVenueInitialFormData(userData, countries), [userData, countries]);

    const { formData, updateField } = useFormData({
        initialData: initialFormData,
        dependencies: [userData, countries],
    });

    const { date: fechaFundacion, setDate: setFechaFundacion, open: calendarioAbierto, setOpen: setCalendarioAbierto, verified: usuarioVerificado, setVerified: setUsuarioVerificado } = useProfileFormControls(userData.perfilDiscoteca?.fechaFundacion ?? undefined, true);

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const payload = {
            ...formData,
            fechaFundacion: fechaFundacion ? fechaFundacion.toISOString() : null
        };
        onSubmit(payload);
    };

    return (
        <ProfileFormWrapper onSubmit={handleSubmit} isLoading={isLoading} saveDisabled={!usuarioVerificado}>
            <ProfileFormHeader
                email={userData.correo || ""}
                dateLabel="Fecha de Fundación"
                date={fechaFundacion}
                dateOpen={calendarioAbierto}
                onDateOpenChange={setCalendarioAbierto}
                onDateSelect={setFechaFundacion}
                datePlaceholder="¿Cuándo se fundó?"
                nameLabel="Nombre de la Discoteca"
                nameId="nombre"
                nameValue={formData.nombre}
                namePlaceholder="Nombre comercial"
                onNameChange={(value) => updateField('nombre', value)}
                usernameValue={formData.nombreUsuario}
                onUsernameChange={(value) => updateField('nombreUsuario', value)}
                onStatusChange={setUsuarioVerificado}
            />

            <div className="h-px bg-zinc-900 w-full" />

            <ProfileContactSection
                country={formData.pais}
                city={formData.ciudad}
                phoneCode={formData.codigoTelefono}
                phoneNumber={formData.numeroTelefono}
                timezone={formData.zonaHoraria}
                onCountryChange={(value) => updateField('pais', value)}
                onCityChange={(value) => updateField('ciudad', value)}
                onPhoneCodeChange={(value) => updateField('codigoTelefono', value)}
                onPhoneNumberChange={(value) => updateField('numeroTelefono', value)}
                onTimezoneChange={(value) => updateField('zonaHoraria', value)}
            />

        </ProfileFormWrapper>
    );
}
