"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { RegistrationPageShell } from "@/components/profile/RegistrationPageShell";
import { ProfileContactSection } from "@/components/profile/ProfileContactSection";
import { NameAndUsernameSection } from "@/components/profile/NameAndUsernameSection";
import { ProfileDatePicker } from "@/components/profile/ProfileDatePicker";
import { ProfileFormWrapper } from '@/components/profile/ProfileFormWrapper';
import { useProfileFormControls } from '@/components/profile/useProfileFormControls';
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

interface RegistrationFormData {
    nombre: string;
    nombreUsuario: string;
    ciudad: string;
    pais: string;
    codigoTelefono: string;
    numeroTelefono: string;
    zonaHoraria: string;
}

interface RegistrationFormProps {
    readonly title: string;
    readonly backHref: string;
    readonly nameLabel: string;
    readonly namePlaceholder: string;
    readonly showFoundationDate?: boolean;
    readonly buildPayload: (formData: RegistrationFormData, fechaFundacion: Date | undefined, session: Session | null) => Record<string, unknown>;
    readonly validate?: (formData: RegistrationFormData, fechaFundacion: Date | undefined) => string | null;
    readonly errorMessage?: string;
}

export function RegistrationForm({
    title,
    backHref,
    nameLabel,
    namePlaceholder,
    showFoundationDate = false,
    buildPayload,
    validate,
    errorMessage,
}: RegistrationFormProps) {
    const { data: session, update, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<RegistrationFormData>({
        nombre: "",
        nombreUsuario: "",
        ciudad: "",
        pais: "",
        codigoTelefono: "+51",
        numeroTelefono: "",
        zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const { date: fechaFundacion, setDate: setFechaFundacion, open: calendarioAbierto, setOpen: setCalendarioAbierto, verified: usuarioVerificado, setVerified: setUsuarioVerificado } = useProfileFormControls(undefined, false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/login');
            return;
        }

        if (session?.user?.name && !formData.nombre) {
            setFormData(prev => ({ ...prev, nombre: session.user.name || "" }));
        }

        const rolUsuario = session?.user?.rol;
        if (rolUsuario && rolUsuario !== 'SUPER_ADMIN' && rolUsuario !== 'ADMIN') {
            router.push('/home');
        }
    }, [session, router, status, formData.nombre]);

    const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!usuarioVerificado) {
            toast.error("Por favor verifica tu nombre de usuario");
            return;
        }

        const validationMessage = validate?.(formData, fechaFundacion);
        if (validationMessage) {
            toast.error(validationMessage);
            return;
        }

        setIsLoading(true);

        try {
            const payload = buildPayload(formData, fechaFundacion, session);
            const response = await fetchApi('/api/usuarios/rol', {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                toast.success("¡Registro completado con éxito!");

                const esAdmin = session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN';
                if (update) {
                    await update({
                        rol: esAdmin ? session.user.rol : (data.rol?.nombre || payload['rol']),
                        name: formData.nombre,
                        accessToken: data.token,
                    });
                }

                globalThis.location.replace(esAdmin ? '/settings' : '/home');
            } else {
                console.error('Error al registrar perfil');
                toast.error(errorMessage ?? "Error al registrar perfil. Inténtalo de nuevo.");
            }
        } catch (error) {
            console.error('Error registrando perfil:', error);
            toast.error("Error de conexión. Verifica tu internet.");
        } finally {
            setIsLoading(false);
        }
    };

    if (status === "loading") {
        return <LoadingScreen />;
    }

    return (
        <RegistrationPageShell
            title={title}
            backHref={backHref}
        >
            <ProfileFormWrapper onSubmit={handleSubmit} isLoading={isLoading} saveDisabled={!usuarioVerificado} saveLabel={"Completar Registro"}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <NameAndUsernameSection
                        nameLabel={nameLabel}
                        nameId="nombre"
                        nameValue={formData.nombre}
                        namePlaceholder={namePlaceholder}
                        onNameChange={(value) => setFormData({ ...formData, nombre: value })}
                        usernameValue={formData.nombreUsuario}
                        onUsernameChange={(value) => setFormData({ ...formData, nombreUsuario: value })}
                        onStatusChange={setUsuarioVerificado}
                    />

                    {showFoundationDate && (
                        <div className="space-y-1.5 md:col-span-2">
                            <ProfileDatePicker
                                label="Fecha de Fundación"
                                date={fechaFundacion}
                                open={calendarioAbierto}
                                onOpenChange={setCalendarioAbierto}
                                onSelect={setFechaFundacion}
                                placeholder="¿Cuándo se fundó?"
                            />
                        </div>
                    )}
                </div>

                <div className="h-px bg-zinc-900 w-full" />

                <ProfileContactSection
                    country={formData.pais}
                    city={formData.ciudad}
                    phoneCode={formData.codigoTelefono}
                    phoneNumber={formData.numeroTelefono}
                    timezone={formData.zonaHoraria}
                    onCountryChange={(value) => setFormData({ ...formData, pais: value })}
                    onCityChange={(value) => setFormData({ ...formData, ciudad: value })}
                    onPhoneCodeChange={(value) => setFormData({ ...formData, codigoTelefono: value })}
                    onPhoneNumberChange={(value) => setFormData({ ...formData, numeroTelefono: value })}
                    onTimezoneChange={(value) => setFormData({ ...formData, zonaHoraria: value })}
                />
            </ProfileFormWrapper>
        </RegistrationPageShell>
    );
}
