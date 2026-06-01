"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { BackButton } from "@/components/ui/back-button";
import { AnimatedBackground } from "@/components/animated-background";
import { SongDetailsTable } from "@/components/stats/song-details-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Music } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
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

export default function GlobalSongsPage() {
    const { data: session } = useSession();

    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<SongStats[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Filters
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("pedidas");

    // Debounce search
    const debouncedSearch = useDebounce(search, 500);

    const fetchSongs = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                search: debouncedSearch,
                ordenarPor: sort
            });

            const resProfile = await fetchApi(`/api/usuarios/perfil/${session?.user?.id}`);
            if (!resProfile.ok) throw new Error("Error al cargar perfil");
            const profile = await resProfile.json();
            const perfilArtistaId = profile.perfilArtista?.id;

            if (!perfilArtistaId) return;

            const res = await fetchApi(`/api/estadisticas/artista/${perfilArtistaId}/canciones?${params}`);
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
    }, [session?.user?.id, page, debouncedSearch, sort]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchSongs();
        }
    }, [session?.user?.id, fetchSongs]);

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <BackButton href="/stats" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Reporte Detallado de Canciones</h1>
                        <p className="text-zinc-400 text-sm">Análisis completo de todas las canciones solicitadas en tus eventos.</p>
                    </div>
                </div>

                <Card className="bg-zinc-900/40 border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Music className="w-5 h-5 text-indigo-500" />
                            Historial de Canciones
                        </CardTitle>
                        <CardDescription>
                            Visualiza y filtra todo el historial de pedidos
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
