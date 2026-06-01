"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";
import { BackButton } from "@/components/ui/back-button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface Evento {
    id: string;
    titulo: string;
    horaInicio: Date;
    horaFin: Date | null;
    totalPedidos: number;
    totalAceptados: number;
    totalRechazados: number;
    tasaAceptacion: number;
}

export default function EventListPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [cargando, setCargando] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const cargarEventos = useCallback(async () => {
        try {
            setCargando(true);
            const perfilRes = await fetchApi(`/api/usuarios/perfil/${session?.user?.id}`);
            if (!perfilRes.ok) throw new Error("Error al obtener perfil");
            const perfil = await perfilRes.json();

            if (!perfil.perfilArtista?.id) return;

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });
            if (search) params.append('search', search);

            const res = await fetchApi(`/api/eventos/artista/${perfil.perfilArtista.id}/paginated?${params}`);
            if (!res.ok) throw new Error("Error al cargar eventos");

            const data = await res.json();
            setEventos(data.eventos);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setCargando(false);
        }
    }, [session?.user?.id, page, search]);

    const getAcceptanceColor = (rate: number) => {
        if (rate >= 70) return 'text-green-500';
        if (rate >= 40) return 'text-yellow-500';
        return 'text-red-500';
    };

    useEffect(() => {
        if (session?.user) {
            cargarEventos();
        }
    }, [session?.user?.id, cargarEventos]);

    if (cargando) return <LoadingScreen />;

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <BackButton href="/stats" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Mis Eventos</h1>
                        <p className="text-zinc-400 text-sm">Selecciona un evento para ver sus estadísticas</p>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" />
                        <Input
                            placeholder="Buscar evento..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-10 bg-zinc-900 border-white/10 text-white"
                        />
                    </div>
                </div>

                {/* Events Table */}
                <Card className="bg-zinc-900/40 border-white/10">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-white/10">
                                    <tr>
                                        <th className="text-left p-4 text-zinc-400 font-medium">Evento</th>
                                        <th className="text-left p-4 text-zinc-400 font-medium">Fecha</th>
                                        <th className="text-right p-4 text-zinc-400 font-medium">Pedidos</th>
                                        <th className="text-right p-4 text-zinc-400 font-medium">Tasa Aceptación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventos.map((evento) => (
                                        <tr
                                            key={evento.id}
                                            onClick={() => router.push(`/stats/events/${evento.id}`)}
                                            className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                                        >
                                            <td className="p-4 text-white font-medium">{evento.titulo}</td>
                                            <td className="p-4 text-zinc-400">
                                                {new Date(evento.horaInicio).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="p-4 text-right text-white">{evento.totalPedidos}</td>
                                            <td className="p-4 text-right">
                                                <span className={`font-bold ${getAcceptanceColor(evento.tasaAceptacion)}`}>
                                                    {evento.tasaAceptacion}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 border-t border-white/10">
                                <p className="text-sm text-zinc-400">
                                    Página {page} de {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="bg-zinc-900 border-white/10 text-white hover:bg-zinc-800"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="bg-zinc-900 border-white/10 text-white hover:bg-zinc-800"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
