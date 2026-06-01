"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedBackground } from "@/components/animated-background";
import { BackButton } from "@/components/ui/back-button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { StatsMetricCards } from "@/components/stats/StatsMetricCards";
import { GenresChartCard } from "@/components/stats/GenresChartCard";
import { SongsAnalysisCard } from "@/components/stats/SongsAnalysisCard";

interface EstadisticasEvento {
    totalPedidos: number;
    totalAceptados: number;
    totalRechazados: number;
    tasaAceptacion: number;
    generosPorConteo: Array<{ genero: string; conteo: number; porcentaje: number }>;
    topCanciones: Array<{
        titulo: string;
        artista: string;
        genero: string;
        total: number;
        aceptados: number;
        rechazados: number;
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
    evento?: {
        titulo: string;
        horaInicio: Date;
    };
}

export default function EventStatsPage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const eventoId = params?.eventoId as string;
    const [estadisticas, setEstadisticas] = useState<EstadisticasEvento | null>(null);
    const [cargando, setCargando] = useState(true);

    const cargarEstadisticas = useCallback(async () => {
        try {
            setCargando(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/estadisticas/evento/${eventoId}`);
            if (!res.ok) throw new Error("Error al cargar estadísticas");

            const data = await res.json();
            setEstadisticas(data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setCargando(false);
        }
    }, [eventoId]);

    useEffect(() => {
        if (session?.user && eventoId) {
            cargarEstadisticas();
        }
    }, [session?.user?.id, eventoId, cargarEstadisticas]);

    if (cargando) return <LoadingScreen />;
    if (!estadisticas) return null;

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header with Breadcrumb */}
                <div className="flex items-center gap-4 mb-8">
                    <BackButton href="/stats/events" />
                    <div>
                        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                            <Link href="/stats" className="hover:text-white">Estadísticas</Link>
                            <span>›</span>
                            <Link href="/stats/events" className="hover:text-white">Eventos</Link>
                            <span>›</span>
                            <span className="text-white">{estadisticas.evento?.titulo || 'Evento'}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{estadisticas.evento?.titulo}</h1>
                        <p className="text-zinc-400 text-sm">
                            {estadisticas.evento?.horaInicio && new Date(estadisticas.evento.horaInicio).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

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
                        topCanciones={estadisticas.topCanciones}
                        topAceptadas={estadisticas.topAceptadas}
                        topRechazadas={estadisticas.topRechazadas}
                        onViewReport={() => router.push(`/stats/events/${eventoId}/songs`)}
                    />
                </div>
            </div>
        </div >
    );
}
