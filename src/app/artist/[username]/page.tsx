"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import QRCode from "react-qr-code";
import { AnimatedBackground } from "@/components/animated-background";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BackButton } from "@/components/ui/back-button";
import Navbar from "@/components/Navbar";
import {
    MapPin, Music, Camera, MessageSquare, Users, PlayCircle,
    Globe, Calendar, ExternalLink, QrCode, Phone,
    Ticket, Building2, Wallet, Share2, X, ZoomIn, Search
} from "lucide-react";
import { toast } from "sonner";
import { getCountryByCode } from "@/lib/countries";
import { RedSocial, PublicUser } from "@/types/artist";

function getSocialIcon(name: string, dbIcon: string | undefined) {
    const iconType = (dbIcon || name).toLowerCase();
    if (iconType.includes('instagram')) return Camera;
    if (iconType.includes('twitter') || iconType.includes('x')) return MessageSquare;
    if (iconType.includes('facebook')) return Users;
    if (iconType.includes('youtube')) return PlayCircle;
    if (iconType.includes('whatsapp')) return Phone;
    return Globe;
}

function getYoutubeVideoId(url: string | undefined) {
    if (!url) return null;
    const match = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);
    return match ? match[2] : null;
}


export default function PaginaPerfilArtistaPublico() {
    const { username } = useParams();
    const { data: session } = useSession();
    const router = useRouter();
    const [artista, setArtista] = useState<PublicUser | null>(null);
    const [cargando, setCargando] = useState(true);
    const [imagenZoom, setImagenZoom] = useState<string | null>(null);

    const cargarDatosArtista = useCallback(async () => {
        try {
            const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/usuarios/perfil-publico/${username}`;
            const url = session?.user?.id ? baseUrl + "?usuarioSolicitanteId=" + session.user.id : baseUrl;
            const res = await fetch(url);

            if (res.ok) {
                const data = await res.json();
                setArtista(data);
            } else {
                if (res.status === 404) {
                    toast.error("Artista no encontrado o perfil no disponible");
                } else {
                    toast.error("Error al cargar datos del artista");
                }
                router.push("/home");
            }
        } catch (error) {
            console.error("Error cargando artista:", error);
            toast.error("Error al cargar datos del artista");
        } finally {
            setCargando(false);
        }
    }, [username, session?.user?.id, router]);

    useEffect(() => {
        if (username) {
            cargarDatosArtista();
        }
    }, [username, cargarDatosArtista]);

    const handleReserve = () => {
        toast.success("Funcionalidad de reservas pronto disponible!");
    };

    if (cargando) return <LoadingScreen />;

    if (!artista) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <AnimatedBackground />
                <div className="relative z-10 text-center space-y-6 max-w-md">
                    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                        <div className="bg-indigo-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Artista no encontrado</h2>
                        <p className="text-zinc-400 text-sm mb-6">
                            Lo sentimos, no pudimos encontrar al artista que estás buscando. Es posible que el enlace sea incorrecto o que el perfil ya no exista.
                        </p>
                        <Button
                            onClick={() => router.push('/home')}
                            className="bg-white text-black hover:bg-zinc-200 rounded-full px-8"
                        >
                            Volver al Inicio
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const perfil = artista.perfilArtista || {};
    // Use stored names if available, otherwise code lookup
    const pais = perfil.pais || getCountryByCode(perfil.paisId || "")?.name;
    const ciudad = perfil.ciudad || perfil.ciudadId;

    // Experience Calc
    const getExperience = () => {
        const start = new Date(perfil.fechaInicio!);
        const now = new Date();
        let diff = now.getFullYear() - start.getFullYear();
        const m = now.getMonth() - start.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < start.getDate())) {
            diff--;
        }
        if (diff <= 0) return "Menos de 1 año";
        return `${diff} año${diff > 1 ? 's' : ''}`;
    };

    // QR Logic: Show ONLY if both image and name exist (Payment QR)
    const showQR = perfil.pagoQR && perfil.nombreQR;

    const handleDownloadMusicQR = async () => {
        try {
            const qrElement = document.getElementById('music-request-qr')?.querySelector('svg');
            if (!qrElement) return;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const svgData = new XMLSerializer().serializeToString(qrElement);
            const img = new globalThis.Image();
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = globalThis.URL.createObjectURL(svgBlob);

            img.onload = () => {
                canvas.width = 512;
                canvas.height = 512;
                ctx?.drawImage(img, 0, 0, 512, 512);
                globalThis.URL.revokeObjectURL(url);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const downloadUrl = globalThis.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = downloadUrl;
                        a.download = `QR-Pedidos-${perfil.nombreArtistico || artista.nombreUsuario}.png`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        globalThis.URL.revokeObjectURL(downloadUrl);
                        toast.success('QR descargado exitosamente');
                    }
                });
            };
            img.src = url;
        } catch (error) {
            console.error('Error descargando QR:', error);
            toast.error('Error al descargar el QR');
        }
    };

    const executeShareOrCopy = async (file: File) => {
        if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: `Pide música a ${perfil.nombreArtistico || artista.nombre}`,
                    text: `Escanea este código QR para pedir canciones a ${perfil.nombreArtistico || artista.nombre}`,
                    files: [file]
                });
                toast.success('QR compartido exitosamente');
            } catch (err: unknown) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                    toast.error('Error al compartir');
                }
            }
        } else {
            const shareUrl = globalThis.location === undefined ? '' : `${globalThis.location.href.split('?')[0]}/music`;
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Enlace copiado al portapapeles');
        }
    };

    const handleShareMusicQR = async () => {
        try {
            const qrElement = document.getElementById('music-request-qr')?.querySelector('svg');
            if (!qrElement) return;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const svgData = new XMLSerializer().serializeToString(qrElement);
            const img = new globalThis.Image();
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = globalThis.URL.createObjectURL(svgBlob);

            img.onload = async () => {
                canvas.width = 512;
                canvas.height = 512;
                ctx?.drawImage(img, 0, 0, 512, 512);
                globalThis.URL.revokeObjectURL(url);

                canvas.toBlob(async (blob) => {
                    if (blob) {
                        const file = new File([blob], `QR-Pedidos-${perfil.nombreArtistico || artista.nombreUsuario}.png`, { type: 'image/png' });
                        await executeShareOrCopy(file);
                    }
                });
            };
            img.src = url;
        } catch (error) {
            console.error('Error compartiendo QR:', error);
            toast.error('Error al compartir el QR');
        }
    };

    return (
        <div className="relative min-h-[100dvh] bg-black text-white selection:bg-indigo-500/30 px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <Navbar />

            {/* Hero Section */}
            <div className="relative max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <BackButton href="/home" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Perfil de Artista</h1>
                        <p className="text-zinc-400 text-sm">Explora la música y trayectoria de este artista</p>
                    </div>
                </div>
                <div className="bg-zinc-900/40 border border-white/10 rounded-[2rem] p-6 md:p-8 backdrop-blur-2xl relative overflow-hidden group">
                    {/* Decorative Gradients */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center text-center md:text-left">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full blur-2xl bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors duration-500" />
                            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white/10 shadow-2xl relative">
                                <AvatarImage src={artista.imagen || undefined} alt={artista.nombre} className="object-cover" />
                                <AvatarFallback className="bg-zinc-900 text-4xl text-zinc-500">
                                    {artista.nombre?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {perfil.categoria && (
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-2 bg-zinc-900 border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xl whitespace-nowrap">
                                    <Music className="h-3 w-3 text-indigo-400" />
                                    <span className="text-[10px] font-bold tracking-wide uppercase">{perfil.categoria}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                                    {perfil.nombreArtistico || artista.nombre}
                                </h1>
                                <p className="text-lg text-zinc-400 font-medium">@{artista.nombreUsuario}</p>
                            </div>

                            {/* Key Stats Row */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 text-xs font-medium text-zinc-300">
                                {(pais || ciudad) && (
                                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                        <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                                        {[ciudad, pais].filter(Boolean).join(", ")}
                                    </div>
                                )}
                                {perfil.fechaInicio && (
                                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                        <Calendar className="h-3.5 w-3.5 text-purple-400" />
                                        {getExperience()} exp.
                                    </div>
                                )}
                                {Number(perfil.tarifaPorHora) > 0 && (
                                    <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-emerald-300">
                                        <Ticket className="h-3.5 w-3.5" />
                                        Desde {perfil.tarifaPorHora} {perfil.moneda || 'PEN'}/hr
                                    </div>
                                )}
                            </div>

                            <p className="max-w-2xl text-sm text-zinc-400 leading-relaxed mx-auto md:mx-0 font-light">
                                &quot;{perfil.biografia || 'Sin biografía disponible yet.'}&quot;
                            </p>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                                {session?.user?.id !== artista.id && (
                                    <Button
                                        onClick={handleReserve}
                                        className="bg-white text-black hover:bg-zinc-200 h-10 px-6 rounded-full text-sm font-bold shadow-lg shadow-white/5 transition-all hover:scale-105"
                                    >
                                        Reservar Contacto
                                    </Button>
                                )}
                                {/* Socials */}
                                <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-full border border-white/5">
                                    {perfil.redesSociales?.map((red: RedSocial) => {
                                        const dbIcon = red.redSocial?.icono;
                                        const name = red.redSocial?.nombre?.toLowerCase() || "";
                                        const isUrl = dbIcon?.startsWith('http');

                                        const renderIcon = () => {
                                            if (isUrl) return (
                                                <div className="relative w-4 h-4">
                                                    <Image
                                                        src={dbIcon!}
                                                        alt={name}
                                                        fill
                                                        sizes="16px"
                                                        className="object-contain filter brightness-100 contrast-100"
                                                        unoptimized
                                                    />
                                                </div>
                                            );
                                            const Icon = getSocialIcon(name, dbIcon);
                                            return <Icon className="h-4 w-4" />;
                                        };

                                        if (!red.nombreUsuario || !red.redSocial) return null;
                                        return (
                                            <a
                                                key={red.id}
                                                href={red.redSocial.urlBase + red.nombreUsuario}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:text-indigo-400 transition-colors"
                                                title={red.redSocial.nombre}
                                            >
                                                {renderIcon()}
                                            </a>
                                        );
                                    })}
                                    {(!perfil.redesSociales || perfil.redesSociales.length === 0) && (
                                        <span className="px-3 text-[10px] text-zinc-600">Sin redes</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Content */}
            <div className="max-w-5xl mx-auto px-4 md:px-6 pb-20 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: Details & Donation */}
                    <div className="lg:col-span-1 space-y-12 h-fit lg:sticky lg:top-24">

                        {/* Known Venues */}
                        {perfil.lugaresConocidos && (Array.isArray(perfil.lugaresConocidos) ? perfil.lugaresConocidos.length > 0 : perfil.lugaresConocidos) && (
                            <Card className="bg-zinc-900/20 border-white/5 rounded-2xl backdrop-blur-sm overflow-hidden">
                                <CardHeader className="py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                                            <Building2 className="h-4 w-4 text-indigo-400" />
                                        </div>
                                        <h3 className="font-bold text-sm">Ha tocado en</h3>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-4 pt-0">
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.isArray(perfil.lugaresConocidos)
                                            ? perfil.lugaresConocidos.map((lugar: string, i: number) => (
                                                <span key={`${lugar}-${i}`} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-md text-xs text-zinc-300">
                                                    {lugar}
                                                </span>
                                            ))
                                            : <span className="text-zinc-400 text-xs">{String(perfil.lugaresConocidos)}</span>
                                        }
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Donation / Support */}
                        <Card className="bg-gradient-to-b from-zinc-900/40 to-black/40 border-white/5 rounded-2xl backdrop-blur-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-24 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                            <CardHeader className="py-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-pink-500/10 rounded-lg">
                                        <Wallet className="h-4 w-4 text-pink-400" />
                                    </div>
                                    <h3 className="font-bold text-sm">Apoyar al Artista</h3>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pb-6 pt-0 relative z-10">
                                {/* QR Code Section - Conditional Render */}
                                {showQR ? (
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            onClick={() => setImagenZoom(perfil.pagoQR!)}
                                            className="bg-white p-3 rounded-2xl shadow-lg transform rotate-1 hover:rotate-0 transition-transform duration-300 mx-auto w-fit cursor-pointer group"
                                        >
                                            <div className="relative aspect-square w-32 bg-zinc-100 rounded-xl overflow-hidden mb-2">
                                                <Image
                                                    src={perfil.pagoQR!}
                                                    alt={perfil.nombreQR!}
                                                    fill
                                                    sizes="128px"
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-black text-sm">{perfil.nombreQR}</p>
                                                <p className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase mt-0.5">Escanea para donar</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(perfil.pagoQR!);
                                                    const blob = await response.blob();
                                                    const url = globalThis.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `QR-${perfil.nombreQR}.png`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    a.remove();
                                                    globalThis.URL.revokeObjectURL(url);
                                                } catch (error) {
                                                    console.error('Error descargando QR:', error);
                                                }
                                            }}
                                            className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Descargar QR
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-4 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center gap-2 bg-white/5">
                                        <QrCode className="h-8 w-8 text-zinc-600" />
                                        <p className="text-xs text-zinc-500 px-2">El artista no ha configurado un QR de donación aún.</p>
                                    </div>
                                )}

                                {/* Payment Link - Show URL */}
                                {perfil.urlPago ? (
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">Link de Pago</p>
                                        <a
                                            href={perfil.urlPago}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full p-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-lg text-indigo-300 hover:text-indigo-200 transition-all text-xs font-medium break-all group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                                <span className="truncate">{perfil.urlPago.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                                            </div>
                                        </a>
                                    </div>
                                ) : null}

                                {/* Info text if no methods */}
                                {!showQR && !perfil.urlPago && (
                                    <p className="text-[10px] text-center text-zinc-600 italic">No hay métodos de donación disponibles.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Gallery & Media */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* Active Event Banner */}
                        {perfil.eventos?.[0] && (
                            <div className="relative overflow-hidden rounded-2xl bg-indigo-600 p-6 shadow-2xl">
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-indigo-500 blur-2xl opacity-50"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                        </span>
                                        <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">En Vivo Ahora</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-1">{perfil.eventos[0].titulo}</h3>
                                    {perfil.eventos[0].descripcion && (
                                        <p className="text-indigo-100/80 text-sm mb-0">{perfil.eventos[0].descripcion}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Requests QR Section - Always Visible */}
                        {(
                            <div className="rounded-2xl bg-zinc-900 border border-white/10 p-6 flex flex-col items-center text-center space-y-4 shadow-xl">
                                <div className="p-3 bg-white rounded-xl">
                                    <div id="music-request-qr" style={{ height: "auto", margin: "0 auto", maxWidth: 160, width: "100%" }}>
                                        <QRCode
                                            size={256}
                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                            value={`${globalThis.location === undefined ? '' : globalThis.location.href.split('?')[0]}/music`}
                                            viewBox={`0 0 256 256`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">¡Pide tu canción!</h3>
                                    <p className="text-zinc-400 text-sm">Escanea el código para enviar tus pedidos al DJ.</p>
                                </div>

                                {/* Download and Share Buttons */}
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={handleDownloadMusicQR}
                                        className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Descargar
                                    </button>

                                    <button
                                        onClick={handleShareMusicQR}
                                        className="flex-1 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Compartir
                                    </button>
                                </div>
                                
                                {/* Copyable Link */}
                                <div className="flex items-center gap-2 w-full mt-2 bg-zinc-900 border border-white/10 rounded-lg p-1.5 pl-3">
                                    <input 
                                        readOnly 
                                        value={`${globalThis.location === undefined ? '' : globalThis.location.href.split('?')[0]}/music`}
                                        className="w-full bg-transparent text-xs text-zinc-400 outline-none truncate" 
                                    />
                                    <button
                                        onClick={() => {
                                            const url = `${globalThis.location === undefined ? '' : globalThis.location.href.split('?')[0]}/music`;
                                            navigator.clipboard.writeText(url);
                                            toast.success("Enlace copiado al portapapeles");
                                        }}
                                        className="p-2 shrink-0 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-md transition-colors"
                                        title="Copiar enlace"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Multimedia Section - Only show if has content */}
                        {(() => {
                            const videoIdYoutubeFavorito = getYoutubeVideoId(perfil.urlYoutubeFavorito);
                            const hasYouTubeFavorito = !!videoIdYoutubeFavorito;
                            const hasSoundCloudFavorito = !!perfil.urlSoundCloudFavorito;

                            const hasYouTube = perfil.redesSociales?.some((r: RedSocial) => {
                                const name = r.redSocial?.nombre?.toLowerCase() || "";
                                if (!name.includes('youtube')) return false;
                                const videoId = getYoutubeVideoId(r.nombreUsuario) || (r.nombreUsuario?.length === 11 ? r.nombreUsuario : null);
                                return !!videoId;
                            });
                            const hasSoundCloud = perfil.redesSociales?.some((r: RedSocial) => {
                                const name = r.redSocial?.nombre?.toLowerCase() || "";
                                return name.includes('soundcloud') && r.nombreUsuario;
                            });
                            const hasMultimedia = hasYouTubeFavorito || hasSoundCloudFavorito || hasYouTube || hasSoundCloud;

                            return hasMultimedia ? (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-pink-500 rounded-full" /> Multimedia
                                    </h2>
                                    <div className="grid grid-cols-1 gap-6">
                                        {/* YouTube Favorito */}
                                        {videoIdYoutubeFavorito && (() => {
                                            const videoId = videoIdYoutubeFavorito;
                                            return (
                                                <div key="yt-fav" className="space-y-2">
                                                    <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium flex items-center gap-1.5">
                                                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                                        </svg>
                                                        YouTube
                                                    </p>
                                                    <div className="rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 shadow-xl aspect-video relative group">
                                                        <iframe
                                                            src={`https://www.youtube.com/embed/${videoId}`}
                                                            title="YouTube video"
                                                            className="w-full h-full"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* SoundCloud Favorito */}
                                        {hasSoundCloudFavorito && (
                                            <div key="sc-fav" className="space-y-2">
                                                <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.05 0-.09.04-.099.099l-.135 1.326.135 1.303c.009.058.05.098.099.098.05 0 .09-.04.099-.098l.15-1.303-.15-1.326c-.009-.059-.05-.099-.099-.099m1.79-1.703c-.058 0-.104.046-.111.104l-.209 2.799.209 2.734c.007.057.053.103.111.103.056 0 .102-.046.11-.103l.232-2.734-.232-2.799c-.008-.058-.054-.104-.11-.104m.899-.15c-.066 0-.118.052-.127.118l-.18 2.949.18 2.881c.009.066.061.117.127.117.066 0 .119-.051.127-.117l.2-2.881-.2-2.949c-.008-.066-.061-.118-.127-.118m.9-.099c-.07 0-.127.058-.135.127l-.154 3.047.154 2.989c.008.068.065.126.135.126.069 0 .126-.058.134-.126l.17-2.989-.17-3.047c-.008-.069-.065-.127-.134-.127m.899-.134c-.075 0-.135.06-.144.135l-.127 3.181.127 3.091c.009.074.069.134.144.134.074 0 .134-.06.142-.134l.142-3.091-.142-3.181c-.008-.075-.068-.135-.142-.135m.9-.202c-.08 0-.145.066-.153.145l-.1 3.383.1 3.3c.008.08.073.145.153.145.079 0 .144-.065.152-.145l.112-3.3-.112-3.383c-.008-.079-.073-.145-.152-.145m.899-.09c-.084 0-.153.069-.162.153l-.072 3.473.072 3.399c.009.084.078.153.162.153.083 0 .152-.069.16-.153l.08-3.399-.08-3.473c-.008-.084-.077-.153-.16-.153m.9-.292c-.088 0-.16.073-.169.161l-.045 3.765.045 3.688c.009.088.081.16.169.16.087 0 .159-.072.168-.16l.05-3.688-.05-3.765c-.009-.088-.081-.161-.168-.161m.899.066c-.092 0-.168.076-.177.168l-.018 3.699.018 3.621c.009.092.085.168.177.168.091 0 .167-.076.176-.168l.02-3.621-.02-3.699c-.009-.092-.085-.168-.176-.168m.9.009c-.096 0-.175.08-.184.176v3.699l.018 3.621c.009.096.088.176.184.176.095 0 .174-.08.183-.176l.019-3.621-.019-3.699c-.009-.096-.088-.176-.183-.176m.899.066c-.1 0-.183.084-.192.184l.018 3.633-.018 3.555c.009.1.092.184.192.184.099 0 .182-.084.191-.184l.02-3.555-.02-3.633c-.009-.1-.092-.184-.191-.184m4.455 5.201c-.439 0-.805.084-1.064.245-.283-3.015-2.815-5.387-5.937-5.387-.656 0-1.294.105-1.881.298-.216.071-.27.141-.27.282v7.896c0 .149.119.271.27.284h9.164c1.403 0 2.545-1.138 2.545-2.541 0-1.404-1.142-2.542-2.545-2.542" />
                                                    </svg>
                                                    SoundCloud
                                                </p>
                                                <div className="rounded-xl overflow-hidden border border-white/5 bg-zinc-900 shadow-xl">
                                                    <iframe
                                                        width="100%"
                                                        height="166"
                                                        style={{ border: 0, overflow: 'hidden' }}
                                                        allow="autoplay"
                                                        title="SoundCloud favorite track"
                                                        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(perfil.urlSoundCloudFavorito!)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
                                                    ></iframe>
                                                </div>
                                            </div>
                                        )}

                                        {/* Redes Sociales Multimedia */}
                                        {perfil.redesSociales?.map((red) => {
                                            const name = red.redSocial?.nombre?.toLowerCase() || "";
                                            const url = red.redSocial?.urlBase + red.nombreUsuario;

                                            // YouTube Embed
                                            if (name.includes('youtube')) {
                                                const videoId = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(red.nombreUsuario)?.[2]
                                                    || (red.nombreUsuario.length === 11 ? red.nombreUsuario : null);

                                                if (videoId) {
                                                    return (
                                                        <div key={`${name}-${red.nombreUsuario}`} className="rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 shadow-xl aspect-video relative group">
                                                            <iframe
                                                                src={`https://www.youtube.com/embed/${videoId}`}
                                                                title="YouTube video player"
                                                                className="w-full h-full"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                            />
                                                        </div>
                                                    );
                                                }
                                            }

                                            // SoundCloud Embed
                                            if (name.includes('soundcloud')) {
                                                const scUrl = url.startsWith('http') ? url : `https://${url}`;
                                                return (
                                                    <div key={url} className="rounded-xl overflow-hidden border border-white/5 bg-zinc-900 shadow-xl">
                                                        <iframe
                                                            width="100%"
                                                            height="166"
                                                            style={{ border: 0, overflow: 'hidden' }}
                                                            allow="autoplay"
                                                            title="SoundCloud track player"
                                                            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(scUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
                                                        ></iframe>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            ) : null;
                        })()}

                        {/* Gallery Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full" /> Galería
                                </h2>
                                <span className="text-xs text-zinc-500 font-medium">
                                    {perfil.galeria?.length || 0} fotos
                                </span>
                            </div>

                            {perfil.galeria && perfil.galeria.length > 0 ? (
                                <div className="columns-1 md:columns-3 gap-4 space-y-4">
                                    {perfil.galeria.map((img: { id: string; url?: string; urlImagen?: string }) => (
                                        <button
                                            key={img.id}
                                            type="button"
                                            onClick={() => setImagenZoom(img.urlImagen || img.url || "")}
                                            className="relative break-inside-avoid rounded-2xl overflow-hidden group cursor-pointer border border-white/5 bg-zinc-900"
                                            aria-label="Ver imagen en galería"
                                        >
                                            <div className="relative w-full h-auto">
                                                <Image
                                                    src={img.urlImagen || img.url || ""}
                                                    alt="Galería item"
                                                    width={500}
                                                    height={500}
                                                    className="w-full h-auto transform transition-transform duration-700 group-hover:scale-105"
                                                    unoptimized
                                                />
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2">
                                                    <ZoomIn className="h-4 w-4 text-white" />
                                                    <p className="text-white font-medium text-xs">Ver imagen completa</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center text-center bg-zinc-900/20 rounded-[2rem] border border-white/5 border-dashed">
                                    <div className="p-3 bg-zinc-900 rounded-full mb-3">
                                        <Globe className="h-6 w-6 text-zinc-600" />
                                    </div>
                                    <h3 className="text-zinc-400 font-medium text-sm">Galería vacía</h3>
                                    <p className="text-zinc-600 text-xs max-w-xs mt-1">Este artista aún no ha compartido fotos de sus presentaciones.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Image Zoom Modal */}
            {imagenZoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
                    <button
                        type="button"
                        onClick={() => setImagenZoom(null)}
                        className="absolute inset-0 w-full h-full bg-black/95 backdrop-blur-md cursor-default border-none outline-none"
                        aria-label="Cerrar modal"
                    />
                    <button
                        onClick={() => setImagenZoom(null)}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all z-[60] group border border-white/5 active:scale-95 shadow-2xl"
                        aria-label="Cerrar"
                    >
                        <X className="h-5 w-5 text-white/80 group-hover:text-white" />
                    </button>

                    <div
                        className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500"
                    >
                        <div className="relative max-w-full max-h-full aspect-auto">
                            <Image
                                src={imagenZoom}
                                alt="Vista ampliada"
                                width={1600}
                                height={1600}
                                className="object-contain w-auto h-auto max-w-[95vw] max-h-[90vh] rounded-md shadow-2xl"
                                unoptimized
                                priority
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
