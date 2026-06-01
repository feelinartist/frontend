"use client";

import { useSession } from "next-auth/react";
import { RegistrationForm } from "@/components/profile/RegistrationForm";

export default function VenueRegistrationPage() {
    const { data: session } = useSession();
    const backHref = session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN' ? "/settings" : "/role-selection";

    return (
        <RegistrationForm
            title="Registro de Discoteca"
            backHref={backHref}
            nameLabel="Nombre de la Discoteca"
            namePlaceholder="Nombre del local"
            showFoundationDate={true}
            buildPayload={(formData, fechaFundacion, session) => ({
                correo: session?.user?.email,
                rol: 'DISCOTECA',
                nombre: formData.nombre,
                nombreUsuario: formData.nombreUsuario,
                ciudadId: formData.ciudad,
                paisId: formData.pais,
                codigoTelefono: formData.codigoTelefono,
                numeroTelefono: formData.numeroTelefono,
                zonaHoraria: formData.zonaHoraria,
                fechaFundacion: fechaFundacion ? fechaFundacion.toISOString() : null,
            })}
            validate={(_, fechaFundacion) =>
                fechaFundacion && fechaFundacion > new Date()
                    ? "La fecha de fundación no puede ser futura"
                    : null
            }
            errorMessage="Error al registrar discoteca. Inténtalo de nuevo."
        />
    );
}
