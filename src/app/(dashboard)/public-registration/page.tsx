"use client";

import { useSession } from "next-auth/react";
import { RegistrationForm } from "@/components/profile/RegistrationForm";

export default function PaginaRegistroPublico() {
    const { data: session } = useSession();
    const backHref = session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN' ? "/settings" : "/role-selection";

    return (
        <RegistrationForm
            title="Registro de Público"
            backHref={backHref}
            nameLabel="Nombre Completo"
            namePlaceholder="Tu nombre completo"
            showFoundationDate={false}
            buildPayload={(formData, _fechaFundacion, session) => ({
                correo: session?.user?.email,
                rol: 'PUBLICO',
                nombre: formData.nombre,
                nombreUsuario: formData.nombreUsuario,
                ciudad: formData.ciudad,
                pais: formData.pais,
                codigoTelefono: formData.codigoTelefono,
                numeroTelefono: formData.numeroTelefono,
                zonaHoraria: formData.zonaHoraria,
            })}
            errorMessage="Error al registrar perfil público. Inténtalo de nuevo."
        />
    );
}
