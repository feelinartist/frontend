
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Music2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { fetchApi, parseJsonSafe } from "@/lib/api";

interface Request {
    id: string;
    nombreSolicitante?: string;
    titulo: string;
    artista?: string;
    estado: "PENDIENTE" | "ACEPTADO" | "RECHAZADO";
    creadoEn: string;
    itunesId?: string;
}

interface GroupedRequest {
    groupId: string; // Identifier for the group (itunesId or title)
    titulo: string;
    artista: string;
    count: number;
    solicitantes: string[];
    requestIds: string[];
    itunesId?: string;
}

export function LiveRequestsFeed({ eventoId }: { readonly eventoId: string }) {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        try {
            const res = await fetchApi(`/api/eventos/${eventoId}/pedidos`);
            if (res.ok) {
                const data = await parseJsonSafe(res);
                setRequests(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    }, [eventoId]);

    const handleNuevoPedido = useCallback((pedido: Request) => {
        setRequests(prev => {
            if (prev.some(p => p.id === pedido.id)) return prev;
            return [pedido, ...prev];
        });
        toast.info(`¡Nuevo pedido: ${pedido.titulo}!`);
    }, []);

    useEffect(() => {
        fetchRequests();

        const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001');

        socket.on('connect', () => {
            socket.emit('join_event', eventoId);
        });

        socket.on('nuevo_pedido', handleNuevoPedido);

        return () => {
            socket.disconnect();
        };
    }, [eventoId, fetchRequests, handleNuevoPedido]);

    // Grouping Logic
    const groupedPendingRequests = useMemo(() => {
        const pending = requests.filter(r => r.estado === "PENDIENTE");
        const groups: Record<string, GroupedRequest> = {};

        pending.forEach(req => {
            // Key: Prefer itunesId, fallback to Title+Artist string
            const key = req.itunesId || `${req.titulo}-${req.artista || 'unknown'}`.toLowerCase();

            if (!groups[key]) {
                groups[key] = {
                    groupId: key,
                    titulo: req.titulo,
                    artista: req.artista || "Desconocido",
                    count: 0,
                    solicitantes: [],
                    requestIds: [],
                    itunesId: req.itunesId
                };
            }

            groups[key].count++;
            groups[key].requestIds.push(req.id);
            if (req.nombreSolicitante) {
                groups[key].solicitantes.push(req.nombreSolicitante);
            }
        });

        // Convert to array and sort by count DESC
        return Object.values(groups).sort((a, b) => b.count - a.count);
    }, [requests]);



    const handleUpdateStatusGroup = async (requestIds: string[], estado: "ACEPTADO" | "RECHAZADO") => {
        // Optimistic update
        setRequests(prev => prev.map(r => requestIds.includes(r.id) ? { ...r, estado } : r));

        let errorCount = 0;
        // Execute sequentially or Promise.all (Looping for now as volume is usually low)
        for (const id of requestIds) {
            try {
                const res = await fetchApi(`/api/pedidos/${id}/estado`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ estado })
                });
                if (!res.ok) errorCount++;
            } catch {
                errorCount++;
            }
        }

        if (errorCount > 0) {
            toast.warning(`Algunos pedidos no se pudieron actualizar (${errorCount} errores)`);
            fetchRequests(); // Sync with backend
        } else if (estado === "ACEPTADO") {
            toast.success("Canción aceptada");
        }
    };



    if (loading && requests.length === 0) {
        return <div className="p-8 text-center text-zinc-500"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
    }

    return (
        <Card className="border-white/10 bg-black/40 backdrop-blur-xl mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Music2 className="h-5 w-5 text-pink-500" />
                    Pedidos en Vivo
                </CardTitle>
                <CardDescription>Canciones solicitadas por el público en tiempo real.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Pending Requests */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                        Cola de Espera <Badge variant="secondary" className="bg-pink-500/10 text-pink-400">{groupedPendingRequests.length}</Badge>
                    </h3>

                    {groupedPendingRequests.length === 0 ? (
                        <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-zinc-500 text-sm">
                            Escaneando nuevos pedidos...
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {groupedPendingRequests.map((group) => (
                                <div key={group.groupId} className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between group relative overflow-hidden min-h-[72px]">
                                    {/* Popularity Highlight */}
                                    {/* Popularity Highlight - Always visible now */}
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-purple-500" />

                                    <div className="min-w-0 flex-1 mr-4 pl-2">
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-white truncate">{group.titulo}</div>
                                            {group.count > 1 && (
                                                <Badge className="bg-pink-600 hover:bg-pink-700 text-white border-0 text-[10px] h-5 px-1.5 gap-1">
                                                    <Users className="h-3 w-3" />
                                                    x{group.count}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-zinc-400 truncate">{group.artista}</div>


                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-9 w-9 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-full"
                                            onClick={() => handleUpdateStatusGroup(group.requestIds, "RECHAZADO")}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            className="h-9 w-9 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                            onClick={() => handleUpdateStatusGroup(group.requestIds, "ACEPTADO")}
                                        >
                                            <Check className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>



            </CardContent>
        </Card>
    );
}
