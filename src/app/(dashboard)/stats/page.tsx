"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { StatsMetricCards } from "@/components/stats/StatsMetricCards";
import { GenresChartCard } from "@/components/stats/GenresChartCard";
import { SongsAnalysisCard } from "@/components/stats/SongsAnalysisCard";

interface EstadisticasArtista {
    perfilArtistaId: string;
    totalEventos: number;
    totalPedidos: number;
    totalAceptados: number;
    totalRechazados: number;
    totalPendientes: number;
    tasaAceptacion: number;
    generosPorConteo: Array<{
        genero: string;
        conteo: number;
        porcentaje: number;
    }>;
    topCanciones: Array<{
        titulo: string;
        artista: string;
        conteo: number;
        aceptados: number;
        rechazados: number;
        genero?: string;
    }>;
    topAceptadas: Array<{
        titulo: string;
        artista: string;
        total: number;
    }>;
    topRechazadas: Array<{
        titulo: string;
        artista: string;
        total: number;
    }>;
    eventosMasActivos: Array<{
        eventoId: string;
        titulo: string;
        totalPedidos: number;
        fecha: string;
    }>;
}

export default function PaginaEstadisticas() {
    const { data: session } = useSession();
    const router = useRouter();
    const [estadisticas, setEstadisticas] = useState<EstadisticasArtista | null>(null);

    const [cargando, setCargando] = useState(true);

    const initializeData = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            setCargando(true);
            // 1. Get Profile
            const perfilRes = await fetchApi(`/api/usuarios/perfil/${session.user.id}`);
            if (!perfilRes.ok) throw new Error("Error al obtener perfil");
            const perfil = await perfilRes.json();

            if (!perfil.perfilArtista?.id) {
                toast.error("No tienes un perfil de artista");
                router.push("/home");
                return;
            }

            const artistId = perfil.perfilArtista.id;

            // 2. Load events and global stats in parallel
            const [eventosRes, statsRes] = await Promise.all([
                fetchApi(`/api/eventos/artista/${artistId}`),
                fetchApi(`/api/estadisticas/artista/${artistId}`)
            ]);

            if (eventosRes.ok) {
                // Currently unused, could be used for event-specific stats filter dropdown
                // const eventosData = await eventosRes.json();
            }

            if (statsRes.ok) {
                const data = await statsRes.json();
                setEstadisticas(data);
            } else {
                toast.error("Error al cargar estadísticas");
            }
        } catch (error) {
            console.error("Error cargando datos de estadísticas:", error);
            toast.error("Error al conectar con el servidor");
        } finally {
            setCargando(false);
        }
    }, [session?.user?.id, router]);

    useEffect(() => {
        initializeData();
    }, [initializeData]);

    if (cargando) return <LoadingScreen />;
    if (!estadisticas) return (
        <div className="relative min-h-[100dvh] bg-black flex flex-col items-center justify-center p-6 text-center">
            <AnimatedBackground />
            <h1 className="text-2xl font-bold text-white mb-2">Error al cargar estadísticas</h1>
            <p className="text-zinc-400 mb-6">No pudimos obtener tus datos en este momento.</p>
            <Button onClick={() => router.push("/home")}>Volver al Inicio</Button>
        </div>
    );

    const topCancionesMapped = estadisticas.topCanciones.map(c => ({
        titulo: c.titulo,
        artista: c.artista,
        total: c.conteo,
        aceptados: c.aceptados,
        rechazados: c.rechazados
    }));

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <BackButton href="/home" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Estadísticas Globales</h1>
                        <p className="text-zinc-400 text-sm">Análisis de todos tus eventos</p>
                    </div>
                </div>

                <Button
                    onClick={() => router.push('/stats/events')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    Ver por Evento
                </Button>

                {/* Métricas Principales */}
                <StatsMetricCards
                    totalPedidos={estadisticas.totalPedidos}
                    totalAceptados={estadisticas.totalAceptados}
                    totalRechazados={estadisticas.totalRechazados}
                    tasaAceptacion={estadisticas.tasaAceptacion}
                />

                {/* Gráficos y Tabs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Géneros */}
                    <GenresChartCard generosPorConteo={estadisticas.generosPorConteo} />

                    {/* Tabs de Canciones */}
                    <SongsAnalysisCard
                        topCanciones={topCancionesMapped}
                        topAceptadas={estadisticas.topAceptadas}
                        topRechazadas={estadisticas.topRechazadas}
                        onViewReport={() => router.push('/stats/songs')}
                    />
                </div>

                {/* Eventos Más Activos - Solo en vista global */}
                {estadisticas.eventosMasActivos?.length > 0 && (
                    <Card className="bg-zinc-900/40 border-white/10 mt-8">
                        <CardHeader>
                            <CardTitle className="text-white">Eventos Más Activos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {estadisticas.eventosMasActivos.map((evento, index) => (
                                    <div key={evento.eventoId} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{evento.titulo}</p>
                                                <p className="text-sm text-zinc-400">
                                                    {new Date(evento.fecha).toLocaleDateString('es-ES', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-indigo-500">{evento.totalPedidos}</p>
                                            <p className="text-xs text-zinc-500">pedidos</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
