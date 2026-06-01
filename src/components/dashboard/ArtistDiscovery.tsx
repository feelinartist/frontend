"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Search, Loader2, Sparkles } from "lucide-react";

import { useSearchParams, useRouter } from "next/navigation";
import { ArtistCard } from "./ArtistCard";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

interface Artist {
    id: string;
    nombre: string;
    nombreUsuario: string;
    imagen?: string | null;
    perfilArtista?: {
        nombreArtistico?: string | null;
        categoria?: string | null;
        pais?: string | null;
        ciudad?: string | null;
        fechaInicio?: string | Date | null;
        lugaresConocidos?: string[];
        codigoTelefono?: string | null;
        numeroTelefono?: string | null;
        tarifaPorHora?: number | null;
        moneda?: string | null;
    } | null;
    siguiendo?: boolean;
}

export function ArtistDiscovery() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Read from URL params set by the SearchBar in Navbar
    const termino = searchParams.get("termino") || "";
    const paisId = searchParams.get("pais") || "all";

    const [artistas, setArtistas] = useState<Artist[]>([]);
    const [cargando, setCargando] = useState(true);

    const buscarArtistas = useCallback(async () => {
        if (!session?.user?.id) return;

        setCargando(true);
        try {
            const params = new URLSearchParams();
            if (termino) params.append("termino", termino);
            if (paisId && paisId !== "all") params.append("paisId", paisId);
            params.append("usuarioSolicitanteId", session.user.id);

            const res = await fetchApi(`/api/usuarios/buscar?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setArtistas(data);
            }
        } catch (error) {
            console.error("Error buscando artistas:", error);
        } finally {
            setCargando(false);
        }
    }, [termino, paisId, session?.user?.id]);

    useEffect(() => {
        buscarArtistas();
    }, [buscarArtistas]);

    const renderContent = () => {
        if (cargando) {
            return (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                    <p className="text-zinc-400 animate-pulse">Buscando talentos...</p>
                </div>
            );
        }
        
        if (artistas.length > 0) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {artistas.map((artista) => (
                        <ArtistCard
                            key={artista.id}
                            artista={artista}
                        />
                    ))}
                </div>
            );
        }

        return (
            <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
                <div className="bg-zinc-900/50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-zinc-600" />
                </div>
                <h3 className="text-white font-medium mb-1">No se encontraron artistas</h3>
                <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-6">
                    Intenta ajustar tus filtros de búsqueda o país para encontrar lo que buscas.
                </p>
                {(termino || paisId !== "all") && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(globalThis.location.pathname)}
                        className="border-white/10 text-zinc-400 hover:text-white"
                    >
                        Limpiar filtros
                    </Button>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Filter UI removed - now in Header */}

            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-400" />
                        {termino || paisId !== "all" ? "Resultados de búsqueda" : "Descubrir Artistas"}
                    </h2>
                    <span className="text-sm text-zinc-500">{artistas.length} artistas encontrados</span>
                </div>

                {renderContent()}
            </div>
        </div>
    );
}
