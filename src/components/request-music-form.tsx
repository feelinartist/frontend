"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Music, User, Search, X, Send, Download } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ArtistProfile {
    pagoQR?: string | null;
    musicQR?: string | null;
    nombreQR?: string | null;
    urlPago?: string | null;
    metodosDonacion?: Array<{
        metodoDonacion: { nombre: string };
        numeroCuenta: string;
    }>;
    redesSociales?: Array<{
        redSocial: { urlBase: string; icono?: string | null; nombre: string };
        nombreUsuario: string;
    }>;
}

interface Track {
    id: string;
    itunesId: string;
    name: string;
    album: {
        images: Array<{ url: string }>;
    };
    artists: Array<{ name: string }>;
    genre?: string;
    previewUrl?: string;
    artworkUrlHighRes?: string;
}

interface RequestMusicFormProps {
    readonly eventoId: string;
    readonly artistName: string;
    readonly artistProfile?: ArtistProfile;
}


export function RequestMusicForm({ eventoId, artistName, artistProfile }: RequestMusicFormProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Search & Selection State
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Track[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [yourName, setYourName] = useState("");

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 2 && !selectedTrack) {
                setIsSearching(true);
                try {
                    // iTunes Client-Side Search
                    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=6`);

                    if (!response.ok) {
                        if (response.status === 403 || response.status === 429) {
                            toast.error("Muchas búsquedas recientes. Espera unos segundos.");
                        }
                        setResults([]);
                        return;
                    }

                    const data = await response.json();

                    if (data.results) {
                        interface ITunesSong {
                            trackId: number;
                            trackName: string;
                            artistName: string;
                            artworkUrl100: string;
                            primaryGenreName?: string;
                            previewUrl?: string;
                        }

                        const mappedTracks: Track[] = data.results.map((item: ITunesSong) => {
                            // High Res Image Trick: Replace 100x100 with 600x600 for better quality
                            const highResImage = item.artworkUrl100?.replace('100x100', '600x600');

                            return {
                                id: String(item.trackId), // Internal ID for key
                                itunesId: String(item.trackId),
                                name: item.trackName,
                                artists: [{ name: item.artistName }],
                                album: {
                                    images: [
                                        { url: item.artworkUrl100 }, // Standard (used for thumbnail)
                                        { url: highResImage } // High Res
                                    ]
                                },
                                genre: item.primaryGenreName,
                                previewUrl: item.previewUrl,
                                artworkUrlHighRes: highResImage
                            };
                        });
                        setResults(mappedTracks);
                    } else {
                        setResults([]);
                    }

                } catch (error) {
                    console.error("Search error", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 600); // Slightly increased debounce for iTunes

        return () => clearTimeout(timer);
    }, [query, selectedTrack]);

    const handleSelectTrack = (track: Track) => {
        setSelectedTrack(track);
        setQuery("");
        setResults([]);
    };

    const handleRemoveTrack = () => {
        setSelectedTrack(null);
        setQuery("");
    };

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedTrack || !yourName) {
            toast.error("Selecciona una canción y tu nombre");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pedidos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventoId,
                    titulo: selectedTrack.name,
                    artista: selectedTrack.artists[0].name,
                    itunesId: selectedTrack.itunesId,
                    nombreSolicitante: yourName,
                    usuarioId: session?.user?.id ?? null,
                    genero: selectedTrack.genre,
                    imagenUrl: selectedTrack.artworkUrlHighRes || selectedTrack.album.images[0].url,
                    previewUrl: selectedTrack.previewUrl
                })
            });

            if (res.ok) {
                setSuccess(true);
                toast.success("¡Pedido enviado!");
                setSelectedTrack(null);
                setYourName("");
            } else {
                const err = await res.json();
                toast.error(err.error || "Error al enviar pedido");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-4 animate-in zoom-in duration-300">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                    <Send className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">¡Pedido Enviado!</h3>
                <p className="text-zinc-400 mb-4 text-xs">
                    Tu pedido ha sido enviado a {artistName}. <br />
                    ¡Espera a que lo acepten!
                </p>

                {/* Donation and Social Section */}
                {(() => {
                    const qrImage = artistProfile?.pagoQR || artistProfile?.musicQR; // Fallback logic adjust if needed
                    const hasDonationMethods = artistProfile?.metodosDonacion && artistProfile.metodosDonacion.length > 0;
                    const hasSocialMedia = artistProfile?.redesSociales && artistProfile.redesSociales.length > 0;
                    const hasDonationOptions = qrImage || artistProfile?.urlPago || hasDonationMethods;

                    const showSection = hasDonationOptions || hasSocialMedia;

                    return showSection && (
                        <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
                            <p className="text-sm font-medium text-white">
                                {hasDonationOptions ? "¿Te gusta la música? Apoya al DJ" : "Sigue al DJ en redes"}
                            </p>

                            {/* QR Code */}
                            {qrImage && (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-1.5 bg-white rounded-lg shadow-lg">
                                        <Image src={qrImage} alt="QR Donación" width={96} height={96} className="w-24 h-24 object-contain" unoptimized />
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5">
                                        {artistProfile?.nombreQR && (
                                            <p className="text-[10px] font-bold text-white uppercase tracking-wider">{artistProfile?.nombreQR}</p>
                                        )}
                                        <button
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                try {
                                                    const response = await fetch(qrImage);
                                                    const blob = await response.blob();
                                                    const url = globalThis.URL.createObjectURL(blob);
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.download = `qr-${artistProfile?.nombreQR || 'donacion'}.png`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                    globalThis.URL.revokeObjectURL(url);
                                                } catch (error) {
                                                    console.error("Download failed:", error);
                                                    globalThis.open(qrImage, '_blank');
                                                }
                                            }}
                                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-[10px] text-zinc-300 hover:text-white cursor-pointer border border-white/5"
                                        >
                                            <Download className="w-2.5 h-2.5" />
                                            Descargar QR
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Payment Link */}
                            {artistProfile.urlPago && (
                                <a
                                    href={artistProfile.urlPago}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors text-center truncate px-3"
                                >
                                    {artistProfile.urlPago.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                                </a>
                            )}

                            {/* Other Donation Methods */}
                            {hasDonationMethods && (
                                <div className="space-y-1.5 pt-2 border-t border-white/10">
                                    {artistProfile.metodosDonacion?.map((d) => (
                                        <div key={d.numeroCuenta} className="flex items-center justify-between text-[10px] text-zinc-400 bg-zinc-800/50 p-1.5 rounded-lg">
                                            <div>
                                                <span className="text-indigo-400 font-bold">{d.metodoDonacion.nombre}:</span> {d.numeroCuenta}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(d.numeroCuenta);
                                                    toast.success("Copiado al portapapeles");
                                                }}
                                                className="p-1 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white"
                                                title="Copiar número"
                                            >
                                                <div className="h-3 w-3">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                                    </svg>
                                                </div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Social Media Links */}
                            {hasSocialMedia && (
                                <div className={`space-y-1.5 ${hasDonationOptions ? 'pt-2 border-t border-white/10' : ''}`}>
                                    {hasDonationOptions && <p className="text-[10px] font-bold text-zinc-400">Sígueme en redes:</p>}
                                    <div className="flex flex-wrap gap-1.5 justify-center">
                                        {artistProfile.redesSociales?.map((social) => (
                                            <a
                                                key={`${social.redSocial.nombre}-${social.nombreUsuario}`}
                                                href={`${social.redSocial.urlBase}${social.nombreUsuario}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[10px] text-white transition-colors flex items-center gap-1.5"
                                            >
                                                {social.redSocial.icono && (
                                                    <Image src={social.redSocial.icono} alt={social.redSocial.nombre} width={12} height={12} className="w-3 h-3" unoptimized />
                                                )}
                                                {!social.redSocial.icono && social.redSocial.nombre}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                <Button
                    onClick={() => setSuccess(false)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 text-xs h-9"
                >
                    Pedir otra canción
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 relative">

            {/* Search Section */}
            <div className="space-y-2 relative z-20">
                <Label htmlFor="track-search" className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                    <Music className="h-3 w-3" /> Buscar Canción o Artista <span className="text-red-500">*</span>
                </Label>

                {selectedTrack ? (
                    <div className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl relative group">
                        <Image
                            src={selectedTrack.album.images[0]?.url}
                            alt={selectedTrack.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg shadow-lg"
                            unoptimized
                        />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-white leading-tight">{selectedTrack.name}</p>
                            <p className="text-xs text-indigo-200">{selectedTrack.artists[0].name}</p>
                            {selectedTrack.genre && (
                                <p className="text-[10px] text-zinc-400 mt-0.5">{selectedTrack.genre}</p>
                            )}
                        </div>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={handleRemoveTrack}
                            className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input
                            id="track-search"
                            placeholder="Busca por título o artista..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-3">
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                            </div>
                        )}

                        {/* Dropdown Results */}
                        {results.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                                {results.map((track) => (
                                    <button
                                        key={track.id}
                                        type="button"
                                        onClick={() => handleSelectTrack(track)}
                                        className="w-full text-left p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors border-b border-white/5 last:border-0"
                                        aria-label={`Seleccionar ${track.name} de ${track.artists[0].name}`}
                                    >
                                        <Image
                                            src={track.album.images[0]?.url}
                                            alt={track.name}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded bg-zinc-800 object-cover"
                                            unoptimized
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{track.name}</p>
                                            <p className="text-xs text-zinc-400 truncate">{track.artists[0].name}</p>
                                            {track.genre && <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 mt-1 inline-block">{track.genre}</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Name Section */}
            <div className="space-y-2 relative z-10">
                <Label htmlFor="yourName" className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                    <User className="h-3 w-3" /> Tu Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="yourName"
                    placeholder="Ej. Juan Pérez"
                    value={yourName}
                    onChange={(e) => setYourName(e.target.value)}
                    className="bg-black/20 border-white/10 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                />
            </div>

            <Button
                type="submit"
                disabled={loading || !selectedTrack || !yourName}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-6 shadow-lg shadow-indigo-500/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar Pedido"}
            </Button>
        </form>
    );
}
