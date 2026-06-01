
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, MapPin, Loader2, Calendar, Play, Square, QrCode } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";

interface Evento {
    id: string;
    titulo: string;
    descripcion?: string;
    horaInicio: string | Date;
    [key: string]: unknown;
}

interface EventManagerProps {
    readonly onEventChange?: (event: Evento | null) => void;
}

export function EventManager({ onEventChange }: EventManagerProps) {
    const { data: session } = useSession();
    const [activeEvent, setActiveEvent] = useState<Evento | null>(null);
    const [userTimezone, setUserTimezone] = useState("UTC");
    const [pedidosActivos, setPedidosActivos] = useState(false);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    const artistaId = (session?.user as { perfilArtista?: { id: string }, id?: string })?.perfilArtista?.id || session?.user?.id;

    const fetchState = useCallback(async () => {
        try {
            if (!artistaId) return;

            // Fetch Active Event
            const resEvent = await fetchApi(`/api/eventos/activo/${artistaId}`, { cache: "no-store" });
            if (resEvent.ok) {
                const data = await resEvent.json();
                setActiveEvent(data);
            }

            // Fetch Profile (QR Status & Timezone)
            if (session?.user?.id) {
                const resProfile = await fetchApi(`/api/usuarios/perfil/${session.user.id}`, { cache: "no-store" });
                if (resProfile.ok) {
                    const profileData = await resProfile.json();
                    setPedidosActivos(profileData.perfilArtista?.pedidosActivos || false);
                    setUserTimezone(profileData.perfilPublico?.zonaHoraria || profileData.perfilArtista?.zonaHoraria || "UTC");
                }
            }
        } catch (error) {
            console.error("Error fetching event state:", error);
        } finally {
            setLoading(false);
        }
    }, [artistaId, session?.user?.id]);

    useEffect(() => {
        if (onEventChange) {
            onEventChange(activeEvent);
        }
    }, [activeEvent, onEventChange]);

    useEffect(() => {
        if (session?.user) {
            fetchState();
        }
    }, [session?.user?.id, fetchState]);

    const handleGetLocation = () => {
        setLoadingLocation(true);
        if (!navigator.geolocation) {
            toast.error("Geolocalización no soportada");
            setLoadingLocation(false);
            return;
        }

        // NOSONAR - Justification: Geolocation access is explicitly triggered by direct user interaction ("Obtener mi ubicación" button) to set event coordinates.
        navigator.geolocation.getCurrentPosition( // NOSONAR
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLoadingLocation(false);
                toast.success("Ubicación obtenida");
            },
            (error) => {
                console.error("Error obtaining location:", error);
                toast.error("No se pudo obtener la ubicación");
                setLoadingLocation(false);
            }
        );
    };

    const handleCreateEvent = async () => {
        if (!title) {
            toast.error("El título es obligatorio");
            return;
        }

        if (!location) {
            toast.error("La ubicación es obligatoria");
            return;
        }

        try {
            const res = await fetchApi('/api/eventos', {
                method: "POST",
                body: JSON.stringify({
                    artistaId,
                    titulo: title,
                    descripcion: description,
                    latitud: location?.lat,
                    longitud: location?.lng
                })
            });

            if (res.ok) {
                const newEvent = await res.json();
                setActiveEvent(newEvent);
                setPedidosActivos(true); // Auto-activate QR
                toast.success("Evento iniciado exitosamente");
                setTitle("");
                setDescription("");
            } else {
                toast.error("Error al iniciar evento");
            }
        } catch {
            toast.error("Error de conexión");
        }
    };

    const handleEndEvent = async () => {
        if (!activeEvent) return;

        try {
            const res = await fetchApi(`/api/eventos/${activeEvent.id}/finalizar`, {
                method: "PATCH"
            });

            if (res.ok) {
                setActiveEvent(null);
                setPedidosActivos(false); // Auto-deactivate QR
                setTitle("");
                setDescription("");
                setLocation(null);
                toast.success("Evento finalizado");
            } else {
                toast.error("Error al finalizar evento");
            }
        } catch {
            toast.error("Error de conexión");
        }
    };

    const handleTogglePedidos = async (checked: boolean) => {
        if (!artistaId) {
            toast.error("Error de sesión: No se identificó al artista");
            return;
        }

        try {
            const res = await fetchApi('/api/usuarios/perfil/pedidos', {
                method: "PATCH",
                body: JSON.stringify({
                    artistaId,
                    activo: checked
                })
            });

            if (res.ok) {
                const updatedProfile = await res.json();

                // Authoritative update from server response
                setPedidosActivos(updatedProfile.pedidosActivos);

                if (updatedProfile.pedidosActivos === checked) {
                    toast.success(checked ? "Pedidos activados" : "Pedidos desactivados");
                } else {
                    toast.warning("El servidor devolvió un estado inesperado.");
                }
            } else {
                toast.error("Error al actualizar estado de pedidos");
            }
        } catch {
            toast.error("Error de conexión");
        }
    };

    if (loading) return null;

    const getWarningMessage = () => {
        if (!title && !location) return "Completa el título y la ubicación";
        if (!title) return "Ingresa un título";
        return "La ubicación es obligatoria";
    };

    return (
        <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-400" />
                    Gestor de Eventos
                </CardTitle>
                <CardDescription>Controla tu evento actual y la recepción de pedidos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {activeEvent && (
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="space-y-0.5">
                            <Label className="text-base text-zinc-200 flex items-center gap-2">
                                <QrCode className="h-4 w-4" /> Activar Pedidos
                            </Label>
                            <p className="text-xs text-zinc-400">Permite que el público escanee tu QR para pedir canciones.</p>
                        </div>
                        <Switch
                            checked={pedidosActivos}
                            onCheckedChange={handleTogglePedidos}
                            className="data-[state=checked]:bg-indigo-500"
                        />
                    </div>
                )}

                {activeEvent ? (
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-indigo-300 text-lg">{activeEvent.titulo}</h3>
                                {activeEvent.descripcion && <p className="text-sm text-indigo-200/70">{activeEvent.descripcion}</p>}
                                <div className="flex items-center gap-2 mt-2 text-xs text-indigo-300/50">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                        Iniciado {new Date(activeEvent.horaInicio).toLocaleString("es-ES", {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true,
                                            timeZone: userTimezone
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className="px-2 py-1 bg-indigo-500/20 rounded text-[10px] font-bold text-indigo-300 uppercase animate-pulse">
                                En Vivo
                            </div>
                        </div>

                        <Button
                            variant="destructive"
                            onClick={handleEndEvent}
                            className="w-full text-xs h-8 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                        >
                            <Square className="h-3 w-3 mr-2 fill-current" /> Finalizar Evento
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="event-title" className="text-xs">Nombre de discoteca o evento</Label>
                            <Input
                                id="event-title"
                                placeholder="Ej. Viernes de Rock en..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event-desc" className="text-xs">Descripción (Opcional)</Label>
                            <Input
                                id="event-desc"
                                placeholder="Detalles extra..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-white/5 border-white/10"
                            />
                        </div>

                        {/* Location Button */}
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                            <div className="text-xs text-zinc-400">
                                {location ? (
                                    <span className="text-green-400 flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> Ubicación guardada
                                    </span>
                                ) : (
                                    "Guardar ubicación del evento"
                                )}
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleGetLocation}
                                disabled={loadingLocation || !!location}
                                className="h-7 text-xs border-white/10 hover:bg-white/10 bg-transparent text-zinc-300"
                            >
                                {loadingLocation ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3 mr-1" />}
                                {location ? "Listo" : "Usar mi ubicación"}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Button
                                onClick={handleCreateEvent}
                                disabled={!title || !location}
                                className="w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
                            >
                                <Play className="h-4 w-4 mr-2 fill-current" /> Iniciar Evento
                            </Button>
                            {(!title || !location) && (
                                <p className="text-xs text-amber-400/80 text-center flex items-center justify-center gap-1">
                                    <span>⚠️</span>
                                    {getWarningMessage()}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
