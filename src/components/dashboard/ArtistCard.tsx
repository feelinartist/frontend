"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Music, ExternalLink, Calendar, Phone, Building2, Ticket } from "lucide-react";
import Link from "next/link";
import { countries } from "@/lib/countries";

interface ArtistCardProps {
    readonly artista: {
        readonly id: string;
        readonly nombre: string;
        readonly nombreUsuario: string;
        readonly imagen?: string | null;
        readonly perfilArtista?: {
            readonly nombreArtistico?: string | null;
            readonly categoria?: string | null;
            readonly pais?: string | null;
            readonly ciudad?: string | null;
            readonly fechaInicio?: string | Date | null;
            readonly lugaresConocidos?: string[];
            readonly codigoTelefono?: string | null;
            readonly numeroTelefono?: string | null;
            readonly tarifaPorHora?: number | null;
            readonly moneda?: string | null;
        } | null;
        readonly siguiendo?: boolean;
    };
}

export function ArtistCard({ artista }: ArtistCardProps) {
    const nombreMostrar = artista.perfilArtista?.nombreArtistico || artista.nombre;

    // --- Helper Logic ---

    // Calculate Experience
    const getExperience = () => {
        if (!artista.perfilArtista?.fechaInicio) return null;
        const start = new Date(artista.perfilArtista.fechaInicio);
        const now = new Date();
        const diff = now.getFullYear() - start.getFullYear();
        if (diff === 0) return "Menos de 1 año";
        return `${diff} año${diff > 1 ? 's' : ''}`;
    };

    // Get Country Name
    const getCountryName = (code: string | null | undefined) => {
        if (!code) return null;
        const c = countries.find(x => x.code === code || x.name === code);
        return c ? c.name : code;
    };

    // Format Known Places
    const getPlaces = () => {
        const places = artista.perfilArtista?.lugaresConocidos;
        if (!places) return null;
        if (Array.isArray(places) && places.length > 0) {
            // Show top 2 and +X more
            if (places.length <= 2) return places.join(", ");
            return `${places.slice(0, 2).join(", ")} y ${places.length - 2} más`;
        }
        if (typeof places === 'string') return places;
        return null;
    };

    // Format Contact
    const getContact = () => {
        const code = artista.perfilArtista?.codigoTelefono;
        const num = artista.perfilArtista?.numeroTelefono;
        if (num) return `${code || ''} ${num}`;
        return null;
    };

    const exp = getExperience();
    const countryName = getCountryName(artista.perfilArtista?.pais);
    const cityName = artista.perfilArtista?.ciudad; // Should be name if stored properly
    const places = getPlaces();
    const contact = getContact();
    const rate = artista.perfilArtista?.tarifaPorHora;
    const currency = artista.perfilArtista?.moneda || 'PEN';
    const origin = [cityName, countryName].filter(Boolean).join(", ");
    const placesTitle = Array.isArray(artista.perfilArtista?.lugaresConocidos) 
        ? artista.perfilArtista.lugaresConocidos.join(", ") 
        : '';
    const initials = artista.nombre?.[0]?.toUpperCase() || 'A';

    return (
        <Card className="group border-white/10 bg-black/40 backdrop-blur-xl hover:bg-white/5 transition-all overflow-hidden h-full flex flex-col">
            <Link href={`/artist/${artista.nombreUsuario}`} className="flex-1 p-4 flex flex-col gap-3">

                {/* Header: Avatar & Basic Info */}
                <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                        <Avatar className="h-14 w-14 border-2 border-indigo-500/20 group-hover:border-indigo-500/50 transition-colors">
                            <AvatarImage src={artista.imagen || undefined} alt={artista.nombre} />
                            <AvatarFallback className="bg-zinc-800 text-sm text-zinc-400">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                            {nombreMostrar}
                        </h3>
                        <p className="text-xs text-zinc-400 truncate">@{artista.nombreUsuario}</p>

                        {artista.perfilArtista?.categoria && (
                            <div className="flex items-center gap-1 mt-1 text-indigo-400 text-xs font-medium">
                                <Music className="h-3 w-3" />
                                <span>{artista.perfilArtista.categoria}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-2 bg-white/5 rounded-xl p-2.5 border border-white/5">
                    {/* Primary Info Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {exp && (
                            <div className="flex flex-col gap-0.5">
                                <span className="text-zinc-500 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Experiencia
                                </span>
                                <span className="text-zinc-200 font-medium">{exp}</span>
                            </div>
                        )}
                        {origin && (
                            <div className="flex flex-col gap-0.5">
                                <span className="text-zinc-500 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> Origen
                                </span>
                                <span className="text-zinc-200 font-medium leading-tight truncate">
                                    {origin}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Secondary Info (Places, Rate, Contact) */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                        {places && (
                            <div className="flex flex-col gap-0.5 text-xs">
                                <span className="text-zinc-500 flex items-center gap-1">
                                    <Building2 className="h-3 w-3" /> Ha tocado en
                                </span>
                                <span className="text-zinc-200 truncate" title={placesTitle}>
                                    {places}
                                </span>
                            </div>
                        )}

                        {/* Stack Rate and Contact vertically to avoid truncation */}
                        {(Number(rate) > 0 || contact) && (
                            <div className="flex flex-col gap-1.5 pt-1">
                                {Number(rate) > 0 && (
                                    <div className="text-xs">
                                        <span className="text-zinc-500 block mb-0.5">Desde</span>
                                        <span className="text-green-400 font-bold flex items-center gap-1">
                                            <Ticket className="h-3 w-3" /> {rate} {currency}/hr
                                        </span>
                                    </div>
                                )}
                                {contact && (
                                    <div className="text-xs">
                                        <span className="text-zinc-500 block mb-0.5">Contacto</span>
                                        <div className="flex items-center gap-1 text-zinc-300 font-medium">
                                            <Phone className="h-3 w-3 shrink-0" />
                                            <span className="whitespace-nowrap truncate">{contact}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </Link>

            <div className="p-3 border-t border-white/5 bg-white/5">
                <Link href={`/artist/${artista.nombreUsuario}`} className="w-full">
                    <Button
                        variant="default"
                        className="w-full bg-white text-black hover:bg-zinc-200 rounded-lg h-9 text-xs font-bold flex items-center justify-center gap-2"
                    >
                        Contratar / Ver perfil
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                </Link>
            </div>
        </Card>
    );
}
