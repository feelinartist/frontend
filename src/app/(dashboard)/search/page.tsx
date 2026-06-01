"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatedBackground } from "@/components/animated-background";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BackButton } from "@/components/ui/back-button";
import { Loader2, MapPin, Music, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SearchResult {
    id: string;
    nombre?: string;
    nombreUsuario?: string;
    imagen?: string;
    perfilArtista?: {
        nombreArtistico?: string;
        paisId?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();
    const termino = searchParams.get("termino");
    const [resultados, setResultados] = useState<SearchResult[]>([]);
    const [cargando, setCargando] = useState(false);

    const buscarArtistas = useCallback(async () => {
        setCargando(true);
        try {
            const params = new URLSearchParams();
            if (termino) params.append("termino", termino);
            params.append("usuarioSolicitanteId", session?.user?.id || "");

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/usuarios/buscar?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setResultados(data);
            }
        } catch (error) {
            console.error("Error buscando artistas:", error);
        } finally {
            setCargando(false);
        }
    }, [termino, session?.user?.id]);

    useEffect(() => {
        if (termino && session?.user?.id) {
            buscarArtistas();
        }
    }, [termino, session?.user?.id, buscarArtistas]);

    const renderContent = () => {
        if (cargando) {
            return (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            );
        }
        
        if (resultados.length > 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resultados.map((artista) => (
                        <Link key={artista.id} href={`/artist/${artista.perfilArtista?.nombreArtistico || artista.nombreUsuario}`}>
                            <Card className="border-white/10 bg-black/40 backdrop-blur-xl hover:bg-white/5 transition-all cursor-pointer h-full">
                                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                                    <Avatar className="h-24 w-24 border-2 border-indigo-500/20">
                                        <AvatarImage src={artista.imagen || undefined} alt={artista.nombre || ''} />
                                        <AvatarFallback className="bg-zinc-800 text-2xl text-zinc-400">
                                            {artista.nombre?.[0]?.toUpperCase() || 'A'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-white">
                                            {artista.perfilArtista?.nombreArtistico || artista.nombre}
                                        </h3>
                                        <p className="text-sm text-zinc-400">@{artista.nombreUsuario}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <Music className="h-3 w-3" />
                                        <span>Artista</span>
                                        {artista.perfilArtista?.paisId && (
                                            <>
                                                <span className="mx-1">•</span>
                                                <MapPin className="h-3 w-3" />
                                                <span>{artista.perfilArtista.paisId}</span>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            );
        }

        return (
            <div className="text-center py-12 space-y-4">
                <p className="text-zinc-500">No se encontraron artistas.</p>
                <Button
                    onClick={() => router.push('/home')}
                    variant="outline"
                    className="bg-zinc-900/50 border-zinc-800 text-white hover:bg-zinc-800"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio
                </Button>
            </div>
        );
    };

    return (
        <div className="relative z-10 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <BackButton href="/home" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Resultados de búsqueda</h1>
                    <p className="text-zinc-400 text-sm">
                        {termino ? `Resultados para "${termino}"` : "Ingresa un término para buscar"}
                    </p>
                </div>
            </div>

            {renderContent()}
        </div>
    );
}

export default function PaginaBusqueda() {
    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <Suspense fallback={<LoadingScreen />}>
                <SearchContent />
            </Suspense>
        </div>
    );
}
