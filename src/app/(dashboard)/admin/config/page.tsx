"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AnimatedBackground } from "@/components/animated-background";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';


import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
    Plus,
    Pencil,
    Trash2,
    Save,
    X,
    Share2,
    CreditCard,
    Globe,
    Loader2,
    Camera,
    MessageSquare,
    Users,
    PlayCircle,
    Music
} from "lucide-react";

import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const MySwal = withReactContent(Swal);

interface RedSocial {
    id: string;
    nombre: string;
    urlBase: string;
    icono?: string;
}

interface MetodoDonacion {
    id: string;
    nombre: string;
    icono?: string;
}

interface FormData {
    nombre: string;
    urlBase?: string;
    icono: string;
}

export default function PaginaConfiguracionAdmin() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get("tab") || "social";

    const [activeTab, setActiveTab] = useState(initialTab);
    const [redes, setRedes] = useState<RedSocial[]>([]);
    const [metodos, setMetodos] = useState<MetodoDonacion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);

    // Modal State
    const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RedSocial | MetodoDonacion | null>(null);
    const [formData, setFormData] = useState<FormData>({ nombre: "", urlBase: "", icono: "" });

    useEffect(() => {
        if (session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN') {
            cargarDatos();
        }

    }, [session?.user?.rol]);

    const cargarDatos = async () => {
        setCargando(true);
        try {
            const [resRedes, resMetodos] = await Promise.all([
                fetch(`${BACKEND_URL}/api/config/redes-sociales`),
                fetch(`${BACKEND_URL}/api/config/metodos-donacion`)
            ]);

            if (resRedes.ok && resMetodos.ok) {
                setRedes(await resRedes.json());
                setMetodos(await resMetodos.json());
            } else {
                toast.error("Error al cargar los datos de configuración");
            }
        } catch (error) {
            console.error("Error cargando configuración:", error);
            toast.error("Error al cargar los datos de configuración");
        } finally {
            setCargando(false);
        }
    };

    const handleOpenSocialModal = (item: RedSocial | null = null) => {
        setEditingItem(item);
        setFormData(item ? { nombre: item.nombre, urlBase: item.urlBase, icono: item.icono || "" } : { nombre: "", urlBase: "", icono: "" });
        setIsSocialModalOpen(true);
    };

    const handleOpenDonationModal = (item: MetodoDonacion | null = null) => {
        setEditingItem(item);
        setFormData(item ? { nombre: item.nombre, icono: item.icono || "" } : { nombre: "", icono: "" });
        setIsDonationModalOpen(true);
    };

    const handleSaveSocial = async () => {
        if (!formData.nombre || !formData.urlBase) {
            toast.error("Nombre y URL Base son requeridos");
            return;
        }

        setProcesando(true);
        try {
            const url = editingItem
                ? `${BACKEND_URL}/api/admin/config/redes-sociales/${editingItem.id}`
                : `${BACKEND_URL}/api/admin/config/redes-sociales`;

            const res = await fetch(url, {
                method: editingItem ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(editingItem ? "Red social actualizada" : "Red social creada");
                setIsSocialModalOpen(false);
                cargarDatos();
            } else {
                toast.error("Error al guardar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
        } finally {
            setProcesando(false);
        }
    };

    const handleSaveDonation = async () => {
        if (!formData.nombre) {
            toast.error("El nombre es requerido");
            return;
        }

        setProcesando(true);
        try {
            const url = editingItem
                ? `${BACKEND_URL}/api/admin/config/metodos-donacion/${editingItem.id}`
                : `${BACKEND_URL}/api/admin/config/metodos-donacion`;

            const res = await fetch(url, {
                method: editingItem ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: formData.nombre, icono: formData.icono })
            });

            if (res.ok) {
                toast.success(editingItem ? "Método actualizado" : "Método creado");
                setIsDonationModalOpen(false);
                cargarDatos();
            } else {
                const error = await res.json();
                toast.error(error.message || "Error al guardar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
        } finally {
            setProcesando(false);
        }
    };

    const handleDelete = async (type: 'social' | 'donation', id: string) => {
        const result = await MySwal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5', // indigo-600
            cancelButtonColor: '#27272a', // zinc-800
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            background: '#18181b', // zinc-900
            color: '#ffffff',
            customClass: {
                popup: 'rounded-3xl border border-white/10 shadow-2xl'
            }
        });

        if (result.isConfirmed) {
            try {
                const endpoint = type === 'social' ? 'redes-sociales' : 'metodos-donacion';
                const res = await fetch(`${BACKEND_URL}/api/admin/config/${endpoint}/${id}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    toast.success("Eliminado correctamente");
                    cargarDatos();
                } else {
                    toast.error("Error al eliminar");
                }
            } catch (error) {
                console.error(error);
                toast.error("Error de conexión");
            }
        }
    };

    const getSocialIcon = (item: RedSocial | MetodoDonacion) => {
        if (item.icono?.startsWith('http')) {
            return <div className="relative h-5 w-5"><Image src={item.icono} alt={item.nombre} fill sizes="20px" className="object-contain filter brightness-110" unoptimized /></div>;
        }

        const type = (item.icono || item.nombre || "").toLowerCase();
        if (type.includes('instagram')) return <Camera className="h-5 w-5" />;
        if (type.includes('twitter') || type.includes('x')) return <MessageSquare className="h-5 w-5" />;
        if (type.includes('facebook')) return <Users className="h-5 w-5" />;
        if (type.includes('youtube')) return <PlayCircle className="h-5 w-5" />;
        if (type.includes('tiktok')) return <Music className="h-5 w-5" />;
        if (type.includes('whatsapp')) return <MessageSquare className="h-5 w-5" />;
        if (type.includes('soundcloud')) return <Music className="h-5 w-5" />;
        return <Globe className="h-5 w-5" />;
    };

    if (status === "loading") {
        return <LoadingScreen />;
    }

    if (!session || (session.user?.rol !== 'SUPER_ADMIN' && session.user?.rol !== 'ADMIN')) {
        router.push("/home");
        return null;
    }

    if (cargando) {
        return <LoadingScreen />;
    }

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 pb-20 overflow-x-hidden">
            <AnimatedBackground />

            <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <BackButton href="/admin" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Configuración Global</h1>
                        <p className="text-zinc-400 text-sm">Personaliza los parámetros disponibles para los usuarios.</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-zinc-900/50 border border-white/10 p-1 mb-8">
                        <TabsTrigger value="social" className="px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <Share2 className="h-4 w-4 mr-2" />
                            Redes Sociales
                        </TabsTrigger>
                        <TabsTrigger value="donations" className="px-8 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Donaciones
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="social">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-white">Catálogo de Redes</h3>
                                <Button onClick={() => handleOpenSocialModal()} className="bg-white text-black hover:bg-zinc-200 rounded-xl">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nueva Red
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {redes.map((red) => (
                                    <Card key={red.id} className="bg-white/5 border-white/10 backdrop-blur-sm group hover:border-indigo-500/50 transition-all overflow-hidden">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-indigo-400 border border-white/5">
                                                    {getSocialIcon(red)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{red.nombre}</p>
                                                    <p className="text-xs text-zinc-500 truncate w-32">{red.urlBase}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" onClick={() => handleOpenSocialModal(red)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete('social', red.id)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="donations">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold text-white">Opciones de Apoyo</h3>
                                <Button onClick={() => handleOpenDonationModal()} className="bg-white text-black hover:bg-zinc-200 rounded-xl">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nuevo Método
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {metodos.map((metodo) => (
                                    <Card key={metodo.id} className="bg-white/5 border-white/10 backdrop-blur-sm group hover:border-indigo-500/50 transition-all overflow-hidden">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 flex items-center justify-center">
                                                    {getSocialIcon(metodo)}
                                                </div>
                                                <p className="font-medium text-white">{metodo.nombre}</p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" onClick={() => handleOpenDonationModal(metodo)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete('donation', metodo.id)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Social Media Modal */}
            <Dialog open={isSocialModalOpen} onOpenChange={setIsSocialModalOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Editar Red Social" : "Nueva Red Social"}</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Define el nombre y la estructura de la URL para esta red.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="social-name">Nombre</Label>
                            <Input
                                id="social-name"
                                placeholder="Ej: Instagram"
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-10 rounded-xl"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="social-url">URL Base (Sin el @/usuario)</Label>
                            <Input
                                id="social-url"
                                placeholder="Ej: https://instagram.com/"
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-10 rounded-xl"
                                value={formData.urlBase}
                                onChange={(e) => setFormData({ ...formData, urlBase: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="social-icon">Icono (Opcional - Clase Lucide)</Label>
                            <Input
                                id="social-icon"
                                placeholder="Ej: Instagram"
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-10 rounded-xl"
                                value={formData.icono}
                                onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsSocialModalOpen(false)}
                            className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/10"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveSocial}
                            disabled={procesando}
                            className="bg-white text-black hover:bg-zinc-200 rounded-xl shadow-lg shadow-white/10"
                        >
                            {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Donation Method Modal */}
            <Dialog open={isDonationModalOpen} onOpenChange={setIsDonationModalOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Editar Método" : "Nuevo Método de Donación"}</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Introduce el nombre del método de pago o donación.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="donation-name">Nombre del Método</Label>
                            <Input
                                id="donation-name"
                                placeholder="Ej: PayPal, Zelle, Transferencia..."
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-10 rounded-xl"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="donation-icon">URL del Icono (Opcional)</Label>
                            <Input
                                id="donation-icon"
                                placeholder="Ej: https://cdn.simpleicons.org/paypal/00457C"
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-10 rounded-xl"
                                value={formData.icono}
                                onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsDonationModalOpen(false)}
                            className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/10"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveDonation}
                            disabled={procesando}
                            className="bg-white text-black hover:bg-zinc-200 rounded-xl shadow-lg shadow-white/10"
                        >
                            {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
