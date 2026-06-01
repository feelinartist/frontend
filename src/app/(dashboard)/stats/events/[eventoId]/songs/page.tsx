"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";
import { BackButton } from "@/components/ui/back-button";
import { SongDetailsTable } from "@/components/stats/song-details-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/lib/useDebounce";

interface SongStats {
    titulo: string;
    artista: string;
    genero: string;
    total: number;
    aceptados: number;
    rechazados: number;
    ultimoPedido: string;
    [key: string]: unknown;
}

export default function EventSongsPage() {
    const { data: session } = useSession();
    const params = useParams();
    const eventoId = params?.eventoId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<SongStats[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [eventName, setEventName] = useState("");

    // Filters
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("pedidas");

    // Debounce
    const debouncedSearch = useDebounce(search, 500);

    const fetchEventDetails = useCallback(async () => {
        try {
            const res = await fetch(`/api/estadisticas/evento/${eventoId}`);
            if (res.ok) {
                const stats = await res.json();
                setEventName(stats.eventoTitulo);
            }
        } catch (e) {
            console.error(e);
        }
    }, [eventoId]);

    const fetchSongs = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                search: debouncedSearch,
                ordenarPor: sort
            });

            const res = await fetch(`/api/estadisticas/evento/${eventoId}/canciones?${params}`);
            if (!res.ok) throw new Error("Error al cargar canciones");

            const result = await res.json();
            setData(result.canciones);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar el reporte de canciones");
        } finally {
            setIsLoading(false);
        }
    }, [eventoId, page, debouncedSearch, sort]);

    useEffect(() => {
        if (session?.user?.id && eventoId) {
            fetchSongs();
            fetchEventDetails();
        }
    }, [session?.user?.id, eventoId, fetchSongs, fetchEventDetails]);

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <BackButton href={`/stats/events/${eventoId}`} />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Reporte: {eventName || 'Cargando...'}</h1>
                        <p className="text-zinc-400 text-sm">Detalle de pedidos para este evento específico.</p>
                    </div>
                </div>

                <Card className="bg-zinc-900/40 border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            Historial del Evento
                        </CardTitle>
                        <CardDescription>
                            Visualiza todas las canciones solicitadas durante este evento
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SongDetailsTable
                            data={data}
                            totalPoints={total}
                            page={page}
                            totalPages={totalPages}
                            isLoading={isLoading}
                            onPageChange={setPage}
                            onSearchChange={setSearch}
                            onSortChange={setSort}
                            currentSort={sort}
                            currentSearch={search}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
