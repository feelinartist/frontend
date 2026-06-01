"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BackButton } from "@/components/ui/back-button";
import {
    Search,
    UserCog,
    Mail,
    User,
    Image as ImageIcon,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCircle2,
    Ban,
    Trash2,
    Download,
    QrCode,
    ExternalLink,
    Users,
} from "lucide-react";

import Image from "next/image";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,

} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);



interface Role {
    id: string;
    nombre: string;
}

interface GalleryImage {
    urlImagen: string;
}

interface PerfilArtista {
    urlPago?: string | null;
    pagoQR?: string | null;
    nombreQR?: string | null;
    musicQR?: string | null;
    galeria?: GalleryImage[];
}

interface User {
    id: string;
    nombre?: string | null;
    email?: string;
    correo?: string;
    imagen?: string | null;
    rol: Role;
    estadoCuenta: string;
    nombreUsuario?: string | null;
    creadoEn: string;
    actualizadoEn: string;
    perfilArtista?: PerfilArtista | null;
}

const itemsPerPage = 20;

export default function PaginaGestionUsuarios() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [usuarios, setUsuarios] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);


    // Form state for editing
    const [newRole, setNewRole] = useState("");
    const [newStatus, setNewStatus] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/home");
        } else if (session && (session.user?.rol === 'ADMIN' || session.user?.rol === 'SUPER_ADMIN')) {
            // Data will be loaded by the searchTerm useEffect on mount
        } else if (status === "authenticated") {
            router.push("/home");
        }
    }, [status, session?.user?.rol, router]);

    const cargarDatos = useCallback(async (page: number, term: string) => {
        setLoading(true);
        try {
            const [resUsers, resRoles] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/usuarios?page=${page}&limit=${itemsPerPage}&termino=${encodeURIComponent(term)}`),
                fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/config/roles`)
            ]);

            if (resUsers.ok && resRoles.ok) {
                const dataUsers = await resUsers.json();
                const dataRoles = await resRoles.json();
                setUsuarios(dataUsers.usuarios || []);
                setTotalUsers(dataUsers.total || 0);
                setRoles(dataRoles);
            } else {
                toast.error("Error al cargar los datos");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            cargarDatos(1, searchTerm);
        }, 500);

        return () => clearTimeout(timer);

    }, [searchTerm, cargarDatos]);

    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setNewRole(user.rol?.nombre || "");
        setNewStatus(user.estadoCuenta || "ACTIVO");
        setIsEditorOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        setUpdating(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/usuarios/perfil`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuarioId: editingUser.id,
                    rol: newRole,
                    estadoCuenta: newStatus
                })
            });

            if (res.ok) {
                toast.success("Usuario actualizado correctamente");
                setIsEditorOpen(false);
                cargarDatos(currentPage, searchTerm); // Refresh list
            } else {
                const err = await res.json();
                toast.error(err.message || "Error al actualizar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar usuario");
        } finally {
            setUpdating(false);
        }
    };

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            toast.error("Error al descargar la imagen");
            globalThis.open(url, '_blank');
        }
    };

    const confirmAction = async ({
        title,
        text,
        icon,
        confirmButtonText,
        confirmButtonColor,
    }: {
        title: string;
        text: string;
        icon: 'warning' | 'question' | 'error';
        confirmButtonText: string;
        confirmButtonColor: string;
    }) => {
        return MySwal.fire({
            title,
            text,
            icon,
            showCancelButton: true,
            confirmButtonColor,
            cancelButtonColor: '#27272a',
            confirmButtonText,
            cancelButtonText: 'Cancelar',
            background: '#09090b',
            color: '#ffffff',
            customClass: {
                container: 'z-[9999]'
            },
            didOpen: () => {
                const container = Swal.getContainer();
                if (container) container.style.pointerEvents = 'auto';
            }
        });
    };

    const handleBanUser = async () => {
        if (!editingUser) return;

        const result = await confirmAction({
            title: '¿Banear usuario?',
            text: "El usuario perderá acceso al sistema inmediatamente.",
            icon: 'warning',
            confirmButtonText: 'Sí, banear',
            confirmButtonColor: '#ef4444',
        });

        if (result.isConfirmed) {
            setUpdating(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/usuarios/banear`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuarioId: editingUser.id })
                });

                if (res.ok) {
                    toast.success("Usuario baneado correctamente");
                    setIsEditorOpen(false);
                    cargarDatos(currentPage, searchTerm);
                } else {
                    toast.error("Error al banear usuario");
                }
            } catch {
                toast.error("Error de red");
            } finally {
                setUpdating(false);
            }
        }
    };

    const handleUnbanUser = async () => {
        if (!editingUser) return;

        const result = await confirmAction({
            title: '¿Desbanear usuario?',
            text: "El usuario recuperará el acceso al sistema.",
            icon: 'question',
            confirmButtonText: 'Sí, desbanear',
            confirmButtonColor: '#22c55e',
        });

        if (result.isConfirmed) {
            setUpdating(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/usuarios/reactivar`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuarioId: editingUser.id })
                });

                if (res.ok) {
                    toast.success("Usuario desbaneado correctamente");
                    setIsEditorOpen(false);
                    cargarDatos(currentPage, searchTerm);
                } else {
                    toast.error("Error al desbanear usuario");
                }
            } catch {
                toast.error("Error de red");
            } finally {
                setUpdating(false);
            }
        }
    };

    const handleDeletePermanently = async () => {
        if (!editingUser) return;

        const result = await confirmAction({
            title: '¿ELIMINAR PERMANENTEMENTE?',
            text: "Esta acción es irreversible. Se borrarán todos los datos del usuario.",
            icon: 'error',
            confirmButtonText: 'ELIMINAR AHORA',
            confirmButtonColor: '#ef4444',
        });

        if (result.isConfirmed) {
            setUpdating(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/usuarios/eliminar-permanente`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuarioId: editingUser.id })
                });

                if (res.ok) {
                    toast.success("Usuario eliminado para siempre");
                    setIsEditorOpen(false);
                    cargarDatos(currentPage, searchTerm);
                } else {
                    toast.error("Error al eliminar usuario");
                }
            } catch {
                toast.error("Error de red");
            } finally {
                setUpdating(false);
            }
        }
    };

    // We use the usuarios state directly as it's now filtered on the server
    const displayUsers = usuarios;

    const getRoleBadge = (roleName?: string | null) => {
        switch (roleName) {
            case 'SUPER_ADMIN': return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Super Admin</Badge>;
            case 'ADMIN': return <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">Admin</Badge>;
            case 'ARTISTA': return <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">Artista</Badge>;
            case 'DISCOTECA': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Discoteca</Badge>;
            default: return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">Público</Badge>;
        }
    };

    const getStatusBadge = (status?: string | null) => {
        switch (status) {
            case 'ACTIVO': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-bold"><CheckCircle2 className="w-3 h-3 mr-1" />Activo</Badge>;
            case 'SUSPENDIDO': return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 font-bold"><AlertCircle className="w-3 h-3 mr-1" />Suspendido</Badge>;
            case 'BANEADO': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-bold"><Ban className="w-3 h-3 mr-1" />Baneado</Badge>;
            case 'ELIMINACION_PENDIENTE': return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30 font-bold"><Trash2 className="w-3 h-3 mr-1" />Por eliminar</Badge>;
            default: return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">Inactivo</Badge>;
        }
    };

    if (loading && status !== "loading") {
        return <LoadingScreen />;
    }

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />

            <div className="relative z-10 max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <BackButton href="/admin" />
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Gestión de Usuarios</h1>
                                <Badge variant="outline" className="text-zinc-500 border-zinc-800">
                                    {totalUsers} usuarios totales
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Buscar por nombre, correo o @usuario..."
                            className="pl-10 bg-zinc-900/50 border-zinc-800 text-white focus:border-indigo-500 h-11"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Users List */}
                <div className={`grid grid-cols-1 gap-4 transition-all duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {displayUsers.length > 0 ? (
                        displayUsers.map((user) => (
                            <div
                                key={user.id}
                                className="group flex flex-col md:flex-row items-center justify-between p-4 bg-zinc-900/30 border border-white/5 rounded-2xl hover:border-white/10 hover:bg-white/5 transition-all duration-300"
                            >
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border border-white/10">
                                        {user.imagen ? (
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={user.imagen}
                                                    alt={user.nombre || "Usuario"}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                <User className="h-6 w-6" />
                                            </div>
                                        )}
                                        {user.estadoCuenta === 'SUSPENDIDO' && (
                                            <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
                                                <AlertCircle className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                        {user.estadoCuenta === 'BANEADO' && (
                                            <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                                                <User className="h-10 w-10 text-zinc-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-white font-semibold">
                                                {user.nombre || "Sin nombre"}
                                            </span>
                                            {getRoleBadge(user.rol?.nombre)}
                                            {getStatusBadge(user.estadoCuenta)}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {user.correo}
                                            </span>
                                            {user.nombreUsuario && (
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    @{user.nombreUsuario ?? ""}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-end">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] text-zinc-600 uppercase tracking-tighter">Registrado el</p>
                                        <p className="text-xs text-zinc-400">
                                            {new Date(user.creadoEn).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleEditClick(user)}
                                        className="h-9 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all flex items-center gap-2 group/btn"
                                    >
                                        <UserCog className="h-4 w-4 text-indigo-400 group-hover/btn:scale-110 transition-transform" />
                                        <span>Gestionar</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl border-dashed">
                            <Users className="h-12 w-12 text-zinc-700 mb-4" />
                            <p className="text-zinc-500 font-medium">No se encontraron usuarios que coincidan con la búsqueda</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalUsers > itemsPerPage && (
                    <div className="flex items-center justify-between bg-zinc-900/40 border border-white/5 p-4 rounded-2xl">
                        <p className="text-xs text-zinc-500 italic">
                            Mostrando <span className="text-indigo-400 font-bold">{usuarios.length}</span> de <span className="text-white font-bold">{totalUsers}</span> usuarios
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const next = Math.max(1, currentPage - 1);
                                    setCurrentPage(next);
                                    cargarDatos(next, searchTerm);
                                }}
                                disabled={currentPage === 1}
                                className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white h-8"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Anterior
                            </Button>
                            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-3 h-8 rounded-md text-[10px] font-bold text-zinc-400">
                                PÁGINA <span className="text-white ml-2">{currentPage} DE {Math.ceil(totalUsers / itemsPerPage)}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const next = currentPage + 1;
                                    setCurrentPage(next);
                                    cargarDatos(next, searchTerm);
                                }}
                                disabled={currentPage * itemsPerPage >= totalUsers}
                                className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white h-8"
                            >
                                Siguiente
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Editor Dialog */}
                <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                    <DialogContent className="max-w-2xl bg-[#09090b] border-zinc-800 text-white p-0 overflow-hidden rounded-3xl">
                        <div className="p-6 pb-0">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                    <UserCog className="h-6 w-6 text-indigo-500" />
                                    Gestionar Usuario
                                </DialogTitle>
                                <DialogDescription className="text-zinc-500">
                                    Ver detalles y modificar privilegios de {editingUser?.nombre || editingUser?.correo}.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {/* Summary Card */}
                            <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 relative group/avatar">
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={editingUser?.imagen || "https://avatar.vercel.sh/user"}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                                            alt="User"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex items-center justify-center gap-1">
                                        <button
                                            onClick={() => globalThis.open(editingUser?.imagen || "https://avatar.vercel.sh/user", '_blank')}
                                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white shadow-lg"
                                            title="Ver original"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDownload(editingUser?.imagen || "https://avatar.vercel.sh/user", `perfil_${editingUser?.nombreUsuario || 'usuario'}.jpg`)}
                                            className="p-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-full text-white shadow-lg"
                                            title="Descargar"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    {editingUser?.estadoCuenta === 'BANEADO' && (
                                        <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center pointer-events-none">
                                            <Ban className="h-6 w-6 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{editingUser?.nombre}</h3>
                                    <p className="text-sm text-zinc-500">{editingUser?.correo}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        {getRoleBadge(editingUser?.rol?.nombre)}
                                        {getStatusBadge(editingUser?.estadoCuenta)}
                                    </div>
                                </div>
                            </div>

                            {/* Unified Controls Row */}
                            <div className="flex flex-col md:flex-row gap-3 items-end md:items-center p-3 bg-zinc-900/30 border border-white/5 rounded-2xl">
                                <div className="w-full md:flex-1 space-y-1.5">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Rol</span>
                                    <Select value={newRole} onValueChange={setNewRole}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-9 rounded-xl text-xs">
                                            <SelectValue placeholder="Rol" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                            {roles.map(r => (
                                                <SelectItem key={r.id} value={r.nombre}>{r.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full md:flex-1 space-y-1.5">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Estado</span>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-9 rounded-xl text-xs">
                                            <SelectValue placeholder="Estado" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                            <SelectItem value="ACTIVO">Activo</SelectItem>
                                            <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
                                            <SelectItem value="BANEADO">Baneado</SelectItem>
                                            <SelectItem value="ELIMINACION_PROGRAMADA">Eliminación Programada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full md:flex-[2] space-y-1.5">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Link de Pago</span>
                                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 px-2 rounded-xl h-9">
                                        <p className="text-[10px] text-indigo-400 font-mono truncate flex-1">
                                            {editingUser?.perfilArtista?.urlPago || "Sin enlace"}
                                        </p>
                                        {editingUser?.perfilArtista?.urlPago && (
                                            <button
                                                onClick={() => editingUser?.perfilArtista?.urlPago && globalThis.open(editingUser.perfilArtista.urlPago, '_blank')}
                                                className="p-1 hover:bg-white/10 rounded text-zinc-400 transition-colors"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* QR Codes Section */}
                            {((editingUser?.perfilArtista?.pagoQR && editingUser?.perfilArtista?.nombreQR) || editingUser?.perfilArtista?.musicQR) && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 italic">
                                        <QrCode className="h-3.5 w-3.5 text-indigo-400" />
                                        Donaciones y QR
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {/* Music QR (previously Código QR) */}
                                        {editingUser.perfilArtista?.musicQR && (
                                            <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-white p-1.5 group/qr-leg">
                                                <Image
                                                    src={editingUser.perfilArtista?.musicQR}
                                                    fill
                                                    className="object-contain transition-transform duration-500 group-hover/qr-leg:scale-110"
                                                    alt="Legacy QR"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/qr-leg:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => globalThis.open(editingUser.perfilArtista?.musicQR || undefined, '_blank')}
                                                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white shadow-lg"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(editingUser.perfilArtista?.musicQR || '', `qr_music_${editingUser.nombreUsuario}.png`)}
                                                        className="p-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-full text-white shadow-lg"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <div className="absolute top-1 left-1">
                                                    <Badge className="bg-zinc-800/80 text-[7px] h-3 px-1 border-none font-bold uppercase tracking-tighter">MUSIC QR</Badge>
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment QR (previously Imagen QR) */}
                                        {editingUser.perfilArtista?.pagoQR && editingUser.perfilArtista?.nombreQR && (
                                            <div className="relative aspect-square rounded-xl overflow-hidden border border-indigo-500/30 bg-white p-1.5 group/qr-img">
                                                <Image
                                                    src={editingUser.perfilArtista?.pagoQR}
                                                    fill
                                                    className="object-contain transition-transform duration-500 group-hover/qr-img:scale-110"
                                                    alt="Image QR"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/qr-img:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => globalThis.open(editingUser.perfilArtista?.pagoQR || undefined, '_blank')}
                                                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white shadow-lg"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(editingUser.perfilArtista?.pagoQR || '', `qr_payment_${editingUser.nombreUsuario}.png`)}
                                                        className="p-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-full text-white shadow-lg"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                                                    <Badge className="bg-indigo-600 text-[7px] h-3 px-1 border-none font-bold uppercase tracking-tighter w-fit">PAGO QR</Badge>
                                                    <Badge className="bg-black/80 text-[6px] h-2.5 px-1 border-none font-medium truncate max-w-[50px]">{editingUser.perfilArtista?.nombreQR}</Badge>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Gallery Section */}
                            {(editingUser?.perfilArtista?.galeria?.length ?? 0) > 0 && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 italic">
                                        <ImageIcon className="h-3.5 w-3.5 text-pink-400" />
                                        Galería Artística ({Math.min(editingUser?.perfilArtista?.galeria?.length ?? 0, 6)})
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {editingUser?.perfilArtista?.galeria?.slice(0, 6).map((img, idx: number) => (
                                            <div key={img.urlImagen ?? idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-zinc-900 group/img-box">
                                                <Image
                                                    src={img.urlImagen}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover/img-box:scale-110"
                                                    alt={`Gallery ${idx}`}
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img-box:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => globalThis.open(img.urlImagen, '_blank')}
                                                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white shadow-lg"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(img.urlImagen, `galeria_${editingUser.nombreUsuario}_${idx}.jpg`)}
                                                        className="p-1.5 bg-pink-500 hover:bg-pink-600 rounded-full text-white shadow-lg"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Extra Context (Audit) */}
                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                <h4 className="flex items-center gap-2 text-indigo-400 font-semibold mb-2 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    Auditoría de Sistema
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-[11px]">
                                    <div>
                                        <p className="text-zinc-500 uppercase tracking-widest font-bold">Registrado el</p>
                                        <p className="text-white bg-white/5 p-1 px-2 rounded mt-1 inline-block">{editingUser?.creadoEn ? new Date(editingUser.creadoEn).toLocaleString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-500 uppercase tracking-widest font-bold">Actualizado el</p>
                                        <p className="text-white bg-white/5 p-1 px-2 rounded mt-1 inline-block">{editingUser?.actualizadoEn ? new Date(editingUser.actualizadoEn).toLocaleString() : 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-zinc-500 uppercase tracking-widest font-bold">ID Unico de Usuario</p>
                                        <p className="text-zinc-400 font-mono text-[10px] break-all bg-black/40 p-1 px-2 rounded mt-1">{editingUser?.id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-zinc-900/40 border-t border-zinc-800/50 flex flex-wrap items-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setIsEditorOpen(false)}
                                className="hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl h-11"
                            >
                                Cerrar
                            </Button>

                            <div className="flex-1 min-w-[20px]" />

                            <div className="flex gap-2 w-full sm:w-auto">
                                {editingUser?.estadoCuenta === 'BANEADO' ? (
                                    <Button
                                        variant="ghost"
                                        onClick={handleUnbanUser}
                                        disabled={updating}
                                        className="flex-1 sm:flex-none text-green-400 hover:bg-green-500/10 hover:text-green-300 rounded-xl h-11"
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Desbanear
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        onClick={handleBanUser}
                                        disabled={updating}
                                        className="flex-1 sm:flex-none text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 rounded-xl h-11"
                                    >
                                        <Ban className="h-4 w-4 mr-2" />
                                        Banear
                                    </Button>
                                )}

                                <Button
                                    variant="ghost"
                                    onClick={handleDeletePermanently}
                                    disabled={updating}
                                    className="flex-1 sm:flex-none text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl h-11 font-medium"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Borrar
                                </Button>
                            </div>

                            <Button
                                onClick={handleUpdateUser}
                                disabled={updating}
                                className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black rounded-xl h-11 px-8 font-bold shadow-lg shadow-white/10 flex items-center gap-2"
                            >
                                {updating ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
