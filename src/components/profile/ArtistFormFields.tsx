"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { ProfileContactSection } from "@/components/profile/ProfileContactSection";
import { ProfileFormHeader } from "@/components/profile/ProfileFormHeader";
import { PlacesEditor } from "@/components/profile/PlacesEditor";

export interface ArtistFormFieldsData {
    nombreArtistico: string;
    nombreUsuario: string;
    categoria: string;
    biografia: string;
    ciudad: string;
    pais: string;
    codigoTelefono: string;
    numeroTelefono: string;
    tarifaPorHora: string | number;
    moneda: string;
    zonaHoraria: string;
    urlYoutubeFavorito: string;
    urlSoundCloudFavorito: string;
}

export type ArtistFormFieldName = keyof ArtistFormFieldsData;

interface ArtistFormFieldsProps {
    readonly email: string;
    readonly usuarioId?: string;
    readonly formData: ArtistFormFieldsData;
    readonly dateLabel: string;
    readonly date: Date | undefined;
    readonly dateOpen: boolean;
    readonly datePlaceholder: string;
    readonly onDateOpenChange: (open: boolean) => void;
    readonly onDateSelect: (date: Date | undefined) => void;
    readonly onNameChange: (value: string) => void;
    readonly onUsernameChange: (value: string) => void;
    readonly onStatusChange: (value: boolean) => void;
    readonly onCategoryChange: (value: string) => void;
    readonly onCurrencyChange: (value: string) => void;
    readonly onFieldChange: (field: ArtistFormFieldName, value: string) => void;
    readonly places: readonly string[];
    readonly onPlacesChange: (items: readonly string[]) => void;
}

export function ArtistFormFields({
    email,
    usuarioId,
    formData,
    dateLabel,
    date,
    dateOpen,
    datePlaceholder,
    onDateOpenChange,
    onDateSelect,
    onNameChange,
    onUsernameChange,
    onStatusChange,
    onCategoryChange,
    onCurrencyChange,
    onFieldChange,
    places,
    onPlacesChange,
}: ArtistFormFieldsProps) {
    return (
        <>
            <ProfileFormHeader
                email={email}
                dateLabel={dateLabel}
                date={date}
                dateOpen={dateOpen}
                onDateOpenChange={onDateOpenChange}
                onDateSelect={onDateSelect}
                datePlaceholder={datePlaceholder}
                nameLabel="Nombre Artístico"
                nameId="nombreArtistico"
                nameValue={formData.nombreArtistico}
                namePlaceholder="Tu nombre de artista"
                onNameChange={onNameChange}
                usernameValue={formData.nombreUsuario}
                onUsernameChange={onUsernameChange}
                onStatusChange={onStatusChange}
                usuarioId={usuarioId}
            />

            <div className="space-y-1.5">
                <StyledSelect
                    label="Categoría"
                    value={formData.categoria}
                    onValueChange={onCategoryChange}
                    placeholder="Selecciona tu categoría"
                >
                    <SelectItem value="DJ">DJ</SelectItem>
                    <SelectItem value="BANDA">Banda</SelectItem>
                    <SelectItem value="SOLISTA">Solista</SelectItem>
                    <SelectItem value="ORQUESTA">Orquesta</SelectItem>
                </StyledSelect>
            </div>

            <div className="h-px bg-zinc-900 w-full" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <Label htmlFor="tarifaPorHora" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Tarifa por Hora</Label>
                    <div className="flex gap-3">
                        <Select value={formData.moneda} onValueChange={onCurrencyChange}>
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
                            onChange={(event) => onFieldChange("tarifaPorHora", event.target.value)}
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
                    onCountryChange={(value) => onFieldChange("pais", value)}
                    onCityChange={(value) => onFieldChange("ciudad", value)}
                    onPhoneCodeChange={(value) => onFieldChange("codigoTelefono", value)}
                    onPhoneNumberChange={(value) => onFieldChange("numeroTelefono", value)}
                    onTimezoneChange={(value) => onFieldChange("zonaHoraria", value)}
                />
            </div>

            <div className="h-px bg-zinc-900 w-full" />

            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1.5">
                    <Label htmlFor="biografia" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Biografía</Label>
                    <Textarea
                        id="biografia"
                        name="biografia"
                        value={formData.biografia}
                        onChange={(event) => onFieldChange("biografia", event.target.value)}
                        spellCheck={true}
                        lang="es"
                        className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white min-h-[120px] rounded-xl px-4 py-3 text-sm resize-none"
                        placeholder="Cuéntanos un poco sobre ti..."
                    />
                </div>

                <PlacesEditor items={places} onChange={onPlacesChange} />

                <div className="space-y-1.5">
                    <Label htmlFor="urlYoutubeFavorito" className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Video Favorito de YouTube (URL)</Label>
                    <Input
                        id="urlYoutubeFavorito"
                        name="urlYoutubeFavorito"
                        value={formData.urlYoutubeFavorito}
                        onChange={(event) => onFieldChange("urlYoutubeFavorito", event.target.value)}
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
                        value={formData.urlSoundCloudFavorito}
                        onChange={(event) => onFieldChange("urlSoundCloudFavorito", event.target.value)}
                        className="bg-zinc-900/50 border-zinc-800 focus:border-[#0055FF] text-white h-11 rounded-xl px-4 text-sm"
                        placeholder="https://soundcloud.com/..."
                    />
                    <p className="text-xs text-zinc-600 ml-1">Comparte tu canción favorita para que te conozcan mejor</p>
                </div>
            </div>
        </>
    );
}
