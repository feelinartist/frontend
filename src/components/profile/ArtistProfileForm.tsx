import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { ProfileContactSection } from '@/components/profile/ProfileContactSection';
import { ProfileFormHeader } from '@/components/profile/ProfileFormHeader';
import { getArtistInitialFormData } from '@/lib/profile-initializers';
import { useProfileFormControls } from '@/components/profile/useProfileFormControls';
import { ProfileFormWrapper } from '@/components/profile/ProfileFormWrapper';
import { useFormData } from '@/lib/useFormData';
import { PlacesEditor } from '@/components/profile/PlacesEditor';

interface UserData {
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

    const { formData, handleChange, updateField } = useFormData({
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

    return (
        <ProfileFormWrapper onSubmit={handleSubmit} isLoading={isLoading} saveDisabled={!usuarioVerificado}>
            <ProfileFormHeader
                email={userData.correo || ""}
                dateLabel="Inicio de Carrera"
                date={fechaInicio}
                dateOpen={calendarioAbierto}
                onDateOpenChange={setCalendarioAbierto}
                onDateSelect={setFechaInicio}
                datePlaceholder="¿Cuándo empezaste?"
                nameLabel="Nombre Artístico"
                nameId="nombreArtistico"
                nameValue={formData.nombreArtistico}
                namePlaceholder="Tu nombre de artista"
                onNameChange={(value) => updateField('nombreArtistico', value)}
                usernameValue={formData.nombreUsuario}
                onUsernameChange={(value) => updateField('nombreUsuario', value)}
                onStatusChange={setUsuarioVerificado}
            />

                <div className="space-y-1.5">
                    <StyledSelect
                        label="Categoría"
                        value={formData.categoria}
                        onValueChange={(value) => updateField('categoria', value)}
                        placeholder="Selecciona tu categoría"
                    >
                        <SelectItem value="DJ">DJ</SelectItem>
                        <SelectItem value="BANDA">Banda</SelectItem>
                        <SelectItem value="SOLISTA">Solista</SelectItem>
                        <SelectItem value="ORQUESTA">Orquesta</SelectItem>
                    </StyledSelect>
                </div>

            <div className="h-px bg-zinc-900 w-full" />

            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <Label htmlFor="tarifaPorHora" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Tarifa por Hora</Label>
                    <div className="flex gap-3">
                        <Select value={formData.moneda} onValueChange={(value) => updateField('moneda', value)}>
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
                            value={formData.tarifaPorHora}
                            onChange={handleChange}
                            className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm flex-1"
                            placeholder="0.00"
                        />
                    </div>
                </div>

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
            </div>

            <div className="h-px bg-zinc-900 w-full" />

            {/* Bio & Venues */}
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                    <Label htmlFor="biografia" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Biografía</Label>
                    <Textarea
                        id="biografia"
                        name="biografia"
                        value={formData.biografia}
                        onChange={handleChange}
                        spellCheck={true}
                        lang="es"
                        className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white min-h-[120px] rounded-xl px-4 py-3 text-sm resize-none"
                        placeholder="Cuéntanos un poco sobre ti..."
                    />
                </div>

                <PlacesEditor items={lugaresConocidos} onChange={(items) => setLugaresConocidos(items)} />

                {/* Multimedia Favorita */}
                <div className="space-y-1.5">
                    <Label htmlFor="urlYoutubeFavorito" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Video Favorito de YouTube (URL)</Label>
                    <Input
                        id="urlYoutubeFavorito"
                        name="urlYoutubeFavorito"
                        value={formData.urlYoutubeFavorito || ""}
                        onChange={handleChange}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm"
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-zinc-600 ml-1">Comparte tu video favorito para que te conozcan mejor</p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="urlSoundCloudFavorito" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Canción Favorita de SoundCloud (URL)</Label>
                    <Input
                        id="urlSoundCloudFavorito"
                        name="urlSoundCloudFavorito"
                        value={formData.urlSoundCloudFavorito || ""}
                        onChange={handleChange}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm"
                        placeholder="https://soundcloud.com/..."
                    />
                    <p className="text-xs text-zinc-600 ml-1">Comparte tu canción favorita para que te conozcan mejor</p>
                </div>
            </div>

        </ProfileFormWrapper>
    );
}
