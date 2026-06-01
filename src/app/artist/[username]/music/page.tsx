
import { RequestMusicForm } from "@/components/request-music-form";
import { AnimatedBackground } from "@/components/animated-background";
import { CalendarOff } from "lucide-react";
import { EventStatusMonitor } from "@/components/EventStatusMonitor";
import Image from "next/image";

async function getArtistAndEvent(username: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

        // 1. Get User by Username
        const resUser = await fetch(`${baseUrl}/api/usuarios/perfil-publico/${username}`, {
            cache: 'no-store'
        });

        if (!resUser.ok) return null;

        const user = await resUser.json();
        if (!user?.perfilArtista) return null;

        // 2. Get Active Event
        const resEvent = await fetch(`${baseUrl}/api/eventos/activo/${user.perfilArtista.id}`, {
            cache: 'no-store'
        });

        let event = null;
        if (resEvent.ok) {
            const eventData = await resEvent.json();
            if (eventData) {
                event = eventData;
            }
        }

        return { artist: user.perfilArtista, event, user };
    } catch (error) {
        console.error("Error fetching artist/event data:", error);
        return null;
    }
}

export default async function MusicRequestPage(props: Readonly<{ params: Promise<{ username: string }> }>) {
    const params = await props.params;
    const data = await getArtistAndEvent(params.username);

    if (!data) {
        return (
            <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center p-6 text-center">
                <AnimatedBackground />
                <h1 className="text-2xl font-bold text-white mb-2">Artista no encontrado</h1>
                <p className="text-zinc-400">El artista que buscas no existe.</p>
            </div>
        );
    }

    const { artist, event, user } = data;
    const isLive = event && artist.pedidosActivos;

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />

            <div className="relative z-10 max-w-md mx-auto flex flex-col items-center min-h-[80vh] justify-center">

                {/* Header / Brand */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20" />
                        <div className="h-24 w-24 rounded-full border-4 border-white/10 shadow-2xl overflow-hidden relative z-10">
                            {user.imagen ? (
                                <div className="relative h-full w-full">
                                    <Image
                                        src={user.imagen}
                                        alt={artist.nombreArtistico || user.nombre}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            ) : (
                                <div className="h-full w-full bg-zinc-900 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-zinc-500">
                                        {(artist.nombreArtistico || user.nombre || user.nombreUsuario || "?")[0].toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        {/** Verified Badge Optional */}
                        {artist.categoria && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-black/50 text-white uppercase tracking-wider shadow-lg">
                                {artist.categoria}
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
                        {artist.nombreArtistico || user.nombre || user.nombreUsuario}
                    </h1>
                    {isLive && (
                        <p className="text-indigo-400 text-sm font-medium animate-pulse">
                            En Vivo
                        </p>
                    )}
                </div>

                {/* Status / Form */}
                {isLive ? (
                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
                        <div className="mb-6 pb-6 border-b border-white/5">
                            <h2 className="text-lg font-semibold text-white mb-1">{event.titulo}</h2>
                            <p className="text-xs text-green-400 font-medium flex items-center justify-center bg-green-500/10 py-1 px-3 rounded-full w-fit mx-auto">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />{" "}Recibiendo Pedidos
                            </p>
                        </div>

                        <RequestMusicForm
                            eventoId={event.id}
                            artistName={user.nombre || "el artista"}
                            artistProfile={artist}
                        />
                    </div>
                ) : (
                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl">
                        <CalendarOff className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Sin Evento Activo</h2>
                        <p className="text-zinc-400 text-sm">
                            {user.nombre} no está recibiendo pedidos de canciones en este momento.
                        </p>
                    </div>
                )}

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Powered by Feelin</p>
                </div>

                <EventStatusMonitor
                    eventoId={event?.id}
                    artistId={artist.id}
                    currentStatus={isLive || false}
                />
            </div>
        </div>
    );
}
