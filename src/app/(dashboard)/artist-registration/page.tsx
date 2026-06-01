"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchApi } from "@/lib/api";
import { RegistrationPageShell } from "@/components/profile/RegistrationPageShell";
import { ProfileFormWrapper } from '@/components/profile/ProfileFormWrapper';
import { ProfileContactSection } from "@/components/profile/ProfileContactSection";
import { ProfileDatePicker } from "@/components/profile/ProfileDatePicker";
import { useProfileFormControls } from '@/components/profile/useProfileFormControls';
import { NameAndUsernameSection } from "@/components/profile/NameAndUsernameSection";
import { PlacesEditor } from '@/components/profile/PlacesEditor';

import { toast } from "sonner";

export default function ArtistRegistrationPage() {
    const { data: session, update, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
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
    });
    const { date: fechaInicio, setDate: setFechaInicio, open: calendarioAbierto, setOpen: setCalendarioAbierto, verified: usuarioVerificado, setVerified: setUsuarioVerificado } = useProfileFormControls(undefined, false);
    const [lugaresConocidos, setLugaresConocidos] = useState<readonly string[]>([]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push('/login');
            return;
        }

        if (session?.user?.name && !formData.nombreArtistico) {
            setFormData(prev => ({ ...prev, nombreArtistico: session.user.name || "" }));
        }
        const rolUsuario = session?.user?.rol;
        if (rolUsuario && rolUsuario !== 'SUPER_ADMIN' && rolUsuario !== 'ADMIN') {
            router.push('/home');
        }
    }, [session, router, status, formData.nombreArtistico]);



    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === "numeroTelefono") {
            const numericValue = value.replaceAll(/\D/g, "");
            setFormData({ ...formData, [name]: numericValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleCategoryChange = (value: string) => {
        setFormData({ ...formData, categoria: value });
    };

    const handleCurrencyChange = (value: string) => {
        setFormData({ ...formData, moneda: value });
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
                tarifaPorHora: Number.parseFloat(formData.tarifaPorHora) || 0,
                moneda: formData.moneda,
                zonaHoraria: formData.zonaHoraria,
                lugaresConocidos: lugaresConocidos
            };

            const response = await fetchApi('/api/usuarios/rol', {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                toast.success("¡Registro completado con éxito!");
                
                const esAdmin = session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN';
                if (update) {
                    await update({
                        rol: esAdmin ? session.user.rol : (data.rol?.nombre || 'ARTISTA'),
                        nombreArtistico: formData.nombreArtistico,
                        name: formData.nombreArtistico,
                        accessToken: data.token
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

    return (
        <RegistrationPageShell
            title="Registro de Artista"
            backHref={session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN' ? "/settings" : "/role-selection"}
        >
                <ProfileFormWrapper onSubmit={handleSubmit} isLoading={isLoading} saveDisabled={!usuarioVerificado}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <NameAndUsernameSection
                            nameLabel="Nombre Artístico"
                            nameId="nombreArtistico"
                            nameValue={formData.nombreArtistico}
                            namePlaceholder="Tu nombre de artista"
                            onNameChange={(value) => setFormData({ ...formData, nombreArtistico: value })}
                            usernameValue={formData.nombreUsuario}
                            onUsernameChange={(value) => setFormData({ ...formData, nombreUsuario: value })}
                            onStatusChange={setUsuarioVerificado}
                        />

                        <div className="space-y-1.5">
                            <Label htmlFor="categoria" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Categoría</Label>
                            <Select value={formData.categoria} onValueChange={handleCategoryChange} required>
                                <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 focus:ring-[#0055FF] focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm">
                                    <SelectValue placeholder="Selecciona tu categoría" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                                    <SelectItem value="DJ">DJ</SelectItem>
                                    <SelectItem value="BANDA">Banda</SelectItem>
                                    <SelectItem value="SOLISTA">Solista</SelectItem>
                                    <SelectItem value="ORQUESTA">Orquesta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <ProfileDatePicker
                                label="Inicio de Carrera"
                                date={fechaInicio}
                                open={calendarioAbierto}
                                onOpenChange={setCalendarioAbierto}
                                onSelect={(date) => setFechaInicio(date)}
                                placeholder="¿Cuándo empezaste?"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-zinc-900 w-full" />

                    {/* Details Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="tarifaPorHora" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Tarifa por Hora</Label>
                            <div className="flex gap-3">
                                <Select value={formData.moneda} onValueChange={handleCurrencyChange}>
                                    <SelectTrigger className="w-[100px] bg-zinc-900/50 border-zinc-800 focus:ring-[#0055FF] focus:border-[#0055FF] text-white h-11 rounded-xl px-3 text-sm">
                                        <SelectValue placeholder="PEN" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                                        <SelectItem value="PEN">PEN</SelectItem>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="MXN">MXN</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    id="tarifaPorHora"
                                    name="tarifaPorHora"
                                    type="number"
                                    placeholder="0.00"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.tarifaPorHora}
                                    onChange={handleChange}
                                    className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm placeholder:text-zinc-600 flex-1"
                                />
                            </div>
                        </div>

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
                    </div>

                    <div className="h-px bg-zinc-900 w-full" />

                    {/* Bio & Venues */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="biografia" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Biografía</Label>
                            <Textarea
                                id="biografia"
                                name="biografia"
                                placeholder="Cuéntanos un poco sobre ti..."
                                value={formData.biografia}
                                onChange={handleChange}
                                spellCheck={true}
                                lang="es"
                                className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white min-h-[120px] rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 resize-none relative z-20"
                            />
                        </div>

                        <PlacesEditor items={lugaresConocidos} onChange={(items) => setLugaresConocidos(items)} />
                    </div>
                </ProfileFormWrapper>
        </RegistrationPageShell>
    );
}
