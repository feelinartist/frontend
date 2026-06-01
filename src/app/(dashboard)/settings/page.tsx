"use client";

import { fetchApi } from "@/lib/api";
import { useSettingsData } from "@/lib/useSettingsData";
import type { BlockedUser } from "@/lib/useSettingsData";

import { useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { AnimatedBackground } from "@/components/animated-background";
import { PanelCard } from "@/components/ui/PanelCard";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BackButton } from "@/components/ui/back-button";
import { Loader2, Shield, UserX, Trash2, RefreshCw } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/ui/ConfirmActionDialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { countries } from "@/lib/countries";

interface MigrationData {
    pais?: string;
    ciudad?: string;
    nombreArtistico?: string;
    categoria?: string;
    nombre?: string;
    [key: string]: unknown;
}

interface AdminProfileCardProps {
    readonly title: string;
    readonly description: string;
    readonly active: boolean;
    readonly createHref: string;
    readonly deleteTitle: string;
    readonly deleteDescription: string;
    readonly onDelete: () => Promise<void>;
}

function AdminProfileCard({
    title,
    description,
    active,
    createHref,
    deleteTitle,
    deleteDescription,
    onDelete,
}: AdminProfileCardProps) {
    return (
        <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
            <div>
                <h4 className="text-white font-medium">{title}</h4>
                <p className="text-zinc-500 text-sm mt-1">{description}</p>
            </div>

            {active ? (
                <ConfirmActionDialog
                    trigger={
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                            Eliminar Perfil
                        </Button>
                    }
                    title={deleteTitle}
                    description={deleteDescription}
                    confirmText="Sí, eliminar"
                    onConfirm={onDelete}
                    triggerAsChild={true}
                />
            ) : (
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => globalThis.location.href = createHref}
                >
                    Crear Perfil
                </Button>
            )}
        </div>
    );
}

export default function PaginaConfiguracion() {
    const { data: session } = useSession();
    const [cargando, setCargando] = useState(false);
    const [migrando, setMigrando] = useState(false);
    const [dialogoMigracionAbierto, setDialogoMigracionAbierto] = useState(false);
    const [nuevoRol, setNuevoRol] = useState<string>("");
    const [datosMigracion, setDatosMigracion] = useState<MigrationData>({});

    const {
        bloqueados,
        cargandoBloqueados,
        perfilesExistentes,
        desbloquearUsuario: desbloquearUsuarioRemoto,
    } = useSettingsData(session?.user?.id);

    const setDatoMigracion = useCallback((field: keyof MigrationData, value: string) => {
        setDatosMigracion((prev) => ({ ...prev, [field]: value }));
    }, []);


    // Initial load handled by effect below

    // Static lists for now
    // countries list imported from @/lib/country-codes

    const handlePaisChange = (pais: string) => {
        setDatosMigracion((prev: MigrationData) => ({ ...prev, pais, ciudad: '' }));
    };

    const migrarRol = async () => {
        if (!nuevoRol) return;
        setMigrando(true);
        try {
            const res = await fetchApi('/api/usuarios/migrar-rol', {
                method: 'POST',
                body: JSON.stringify({
                    usuarioId: session?.user?.id,
                    nuevoRol,
                    datosPerfil: datosMigracion
                })
            });

            if (res.ok) {
                toast.success("Rol migrado exitosamente. Reiniciando sesión...");
                setTimeout(() => signOut({ callbackUrl: '/home' }), 2000);
            } else {
                const error = await res.json();
                toast.error(error.message || "Error al migrar rol");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al migrar rol");
        } finally {
            setMigrando(false);
        }
    };


    const desbloquearUsuario = async (bloqueadoId: string) => {
        try {
            await desbloquearUsuarioRemoto(bloqueadoId);
            toast.success("Usuario desbloqueado");
        } catch (error) {
            console.error(error);
            toast.error("Error al desbloquear");
        }
    };

    const deshabilitarCuenta = async () => {
        setCargando(true);
        try {
            const res = await fetchApi('/api/usuarios/deshabilitar', {
                method: 'PATCH',
                body: JSON.stringify({ usuarioId: session?.user?.id })
            });

            if (res.ok) {
                toast.success("Cuenta deshabilitada. Cerrando sesión...");
                setTimeout(() => signOut({ callbackUrl: '/' }), 2000);
            } else {
                toast.error("Error al deshabilitar cuenta");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al deshabilitar cuenta");
        } finally {
            setCargando(false);
        }
    };

    const eliminarCuenta = async () => {
        setCargando(true);
        try {
            const res = await fetchApi('/api/usuarios/eliminar', {
                method: 'DELETE',
                body: JSON.stringify({ usuarioId: session?.user?.id })
            });

            if (res.ok) {
                toast.success("Cuenta programada para eliminación. Cerrando sesión...");
                setTimeout(() => signOut({ callbackUrl: '/' }), 2000);
            } else {
                toast.error("Error al eliminar cuenta");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar cuenta");
        } finally {
            setCargando(false);
        }
    };

    const eliminarPerfilAdmin = async (tipo: string) => {
        setCargando(true);
        try {
            const res = await fetchApi(`/api/admin/usuarios/perfil/${tipo}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success(`Perfil de ${tipo} eliminado. Reiniciando sesión...`);
                setTimeout(() => signOut({ callbackUrl: '/home' }), 2000);
            } else {
                toast.error(`Error al eliminar perfil de ${tipo}`);
            }
        } catch (error) {
            console.error(error);
            toast.error(`Error al eliminar perfil de ${tipo}`);
        } finally {
            setCargando(false);
        }
    };

    const renderBloqueados = () => {
        if (cargandoBloqueados) {
            return (
                <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
            );
        }
        
        if (bloqueados.length > 0) {
            return (
                <div className="space-y-3">
                    {bloqueados.map((usuario: BlockedUser) => (
                        <div key={usuario.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden">
                                    {usuario.imagen ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={usuario.imagen}
                                                alt={usuario.nombre || "Usuario"}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                            {usuario.nombre?.[0] || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">{usuario.nombre || usuario.nombreUsuario}</p>
                                    <p className="text-zinc-500 text-xs">{usuario.correo}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => desbloquearUsuario(usuario.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                                Desbloquear
                            </Button>
                        </div>
                    ))}
                </div>
            );
        }

        return <p className="text-zinc-500 text-sm italic text-center">No has bloqueado a ningún usuario.</p>;
    };

    if (cargando || migrando) {
        return <LoadingScreen />;
    }

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <BackButton href="/home" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Configuración</h1>
                        <p className="text-zinc-400 text-sm">Administra tu cuenta y privacidad</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Privacy Section */}
                    <PanelCard
                        title={
                            <>
                                <Shield className="h-5 w-5 text-indigo-400" />
                                <span>Privacidad</span>
                            </>
                        }
                        description={"Gestiona los usuarios bloqueados."}
                    >
                        <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                            <div>
                                <h4 className="text-white font-medium">Usuarios Bloqueados</h4>
                                <p className="text-zinc-500 text-sm mt-1">
                                    Ver y gestionar la lista de usuarios que has bloqueado.
                                </p>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-black border border-white/20 text-white hover:bg-[#8F00FF] hover:border-[#8F00FF] transition-colors">
                                        Ver Lista
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Usuarios Bloqueados</DialogTitle>
                                        <DialogDescription className="text-zinc-400">
                                            Lista de usuarios que no pueden ver tu perfil ni interactuar contigo.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        {renderBloqueados()}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </PanelCard>

                    {/* Role Migration Section - Hidden for SuperAdmin */}
                    {session?.user?.rol !== 'SUPER_ADMIN' && session?.user?.rol !== 'ADMIN' && (
                        <PanelCard
                            title={
                                <>
                                    <RefreshCw className="h-5 w-5 text-green-400" />
                                    <span>Migración de Rol</span>
                                </>
                            }
                            description="Cambia tu rol actual (Artista, Público, Discoteca)."
                        >
                            <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                                <div>
                                    <h4 className="text-white font-medium">Cambiar Rol</h4>
                                    <p className="text-zinc-500 text-sm mt-1">
                                        Migra tu cuenta a otro tipo de perfil. Se te pedirán datos adicionales si es necesario.
                                    </p>
                                </div>
                                <Dialog open={dialogoMigracionAbierto} onOpenChange={setDialogoMigracionAbierto}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-black border border-white/20 text-white hover:bg-[#8F00FF] hover:border-[#8F00FF] transition-colors">
                                            Migrar
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Migrar Rol</DialogTitle>
                                            <DialogDescription className="text-zinc-400">
                                                Selecciona el nuevo rol y completa la información requerida.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Nuevo Rol</Label>
                                                <Select onValueChange={(val) => setNuevoRol(val)}>
                                                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                                        <SelectValue placeholder="Selecciona un rol" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                                        {session?.user?.rol !== 'ARTISTA' && <SelectItem value="ARTISTA">Artista</SelectItem>}
                                                        {session?.user?.rol !== 'PUBLICO' && <SelectItem value="PUBLICO">Público</SelectItem>}
                                                        {session?.user?.rol !== 'DISCOTECA' && <SelectItem value="DISCOTECA">Discoteca</SelectItem>}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {nuevoRol === 'ARTISTA' && (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label>Nombre Artístico</Label>
                                                        <Input
                                                            className="bg-zinc-800 border-zinc-700 text-white"
                                                            onChange={(e) => setDatoMigracion('nombreArtistico', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Categoría</Label>
                                                        <Select onValueChange={(val) => setDatoMigracion('categoria', val)}>
                                                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                                                <SelectValue placeholder="Selecciona categoría" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                                                <SelectItem value="DJ">DJ</SelectItem>
                                                                <SelectItem value="BANDA">Banda</SelectItem>
                                                                <SelectItem value="SOLISTA">Solista</SelectItem>
                                                                <SelectItem value="ORQUESTA">Orquesta</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </>
                                            )}

                                            {nuevoRol === 'DISCOTECA' && (
                                                <div className="space-y-2">
                                                    <Label>Nombre de la Discoteca</Label>
                                                    <Input
                                                        className="bg-zinc-800 border-zinc-700 text-white"
                                                        onChange={(e) => setDatoMigracion('nombre', e.target.value)}
                                                    />
                                                </div>
                                            )}

                                            {(nuevoRol === 'ARTISTA' || nuevoRol === 'DISCOTECA' || nuevoRol === 'PUBLICO') && (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label>País</Label>
                                                        <Select onValueChange={handlePaisChange}>
                                                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                                                <SelectValue placeholder="Selecciona país" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                                                {countries.map(p => (
                                                                    <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Ciudad</Label>
                                                        <Input
                                                            placeholder="Ingresa tu ciudad"
                                                            className="bg-zinc-800 border-zinc-700 text-white"
                                                            onChange={(e) => setDatoMigracion('ciudad', e.target.value)}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <DialogFooter>
                                            <Button variant="ghost" onClick={() => setDialogoMigracionAbierto(false)} className="text-zinc-400 hover:text-white">Cancelar</Button>
                                            <Button onClick={migrarRol} disabled={migrando || !nuevoRol} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                {migrando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Migración"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </PanelCard>
                    )}

                    {/* Admin Profile Management */}
                    {(session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN') && (
                        <PanelCard
                            title={
                                <>
                                    <Shield className="h-5 w-5 text-indigo-400" />
                                    <span>Gestión de Perfil de Prueba (Admin)</span>
                                </>
                            }
                            description="Crea o elimina perfiles sin perder tus privilegios de administrador."
                        >
                            <div className="space-y-4">
                                {[
                                    {
                                        role: 'artista',
                                        title: 'Perfil de Artista',
                                        active: perfilesExistentes.artista,
                                        createHref: '/artist-registration',
                                        deleteTitle: '¿Eliminar Perfil de Artista?',
                                        deleteDescription:
                                            'Esto eliminará todos los datos asociados al perfil de artista (eventos, redes, donaciones) pero mantendrá tu cuenta de Administrador intacta.',
                                    },
                                    {
                                        role: 'discoteca',
                                        title: 'Perfil de Discoteca',
                                        active: perfilesExistentes.discoteca,
                                        createHref: '/venue-registration',
                                        deleteTitle: '¿Eliminar Perfil de Discoteca?',
                                        deleteDescription:
                                            'Esto eliminará todos los datos asociados al perfil de discoteca pero mantendrá tu cuenta de Administrador intacta.',
                                    },
                                    {
                                        role: 'publico',
                                        title: 'Perfil de Público',
                                        active: perfilesExistentes.publico,
                                        createHref: '/public-registration',
                                        deleteTitle: '¿Eliminar Perfil de Público?',
                                        deleteDescription:
                                            'Esto eliminará todos los datos asociados al perfil de público pero mantendrá tu cuenta de Administrador intacta.',
                                    },
                                ].map((profile) => (
                                    <AdminProfileCard
                                        key={profile.role}
                                        title={profile.title}
                                        description={
                                            profile.active
                                                ? `Ya tienes un perfil de ${profile.role} activo.`
                                                : `Crea un perfil de ${profile.role} para probar la plataforma.`
                                        }
                                        active={profile.active}
                                        createHref={profile.createHref}
                                        deleteTitle={profile.deleteTitle}
                                        deleteDescription={profile.deleteDescription}
                                        onDelete={() => eliminarPerfilAdmin(profile.role)}
                                    />
                                ))}
                            </div>
                        </PanelCard>
                    )}

                    {/* Account Management Section */}
                    <PanelCard
                        title={
                            <>
                                <UserX className="h-5 w-5 text-red-400" />
                                <span>Gestión de Cuenta</span>
                            </>
                        }
                        description="Acciones peligrosas para tu cuenta."
                        className="border-t-red-900/50"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                                <div>
                                    <h4 className="text-white font-medium">Deshabilitar Cuenta</h4>
                                    <p className="text-zinc-500 text-sm mt-1">
                                        Tu perfil será ocultado pero podrás reactivarlo iniciando sesión.
                                    </p>
                                </div>
                                <ConfirmActionDialog
                                    trigger={
                                        <Button className="bg-black border border-white/20 text-white hover:bg-[#8F00FF] hover:border-[#8F00FF] transition-colors">
                                            Deshabilitar
                                        </Button>
                                    }
                                    title="¿Estás seguro?"
                                    description="Tu cuenta será deshabilitada y tu perfil no será visible para nadie. Podrás reactivarla en cualquier momento iniciando sesión."
                                    confirmText="Sí, deshabilitar"
                                    onConfirm={deshabilitarCuenta}
                                    confirmButtonClassName="bg-yellow-600 hover:bg-yellow-700 text-white"
                                    triggerAsChild={true}
                                />
                            </div>

                            {/* Delete Account - Hidden for SuperAdmin */}
                            {session?.user?.rol !== 'SUPER_ADMIN' && (
                                <div className="flex items-center justify-between p-4 border border-red-900/30 rounded-lg bg-red-900/10">
                                    <div>
                                        <h4 className="text-white font-medium">Eliminar Cuenta</h4>
                                        <p className="text-zinc-500 text-sm mt-1">
                                            Se programará para eliminación en 30 días.
                                        </p>
                                    </div>
                                    <ConfirmActionDialog
                                        trigger={
                                            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Eliminar
                                            </Button>
                                        }
                                        title="¿Eliminar cuenta permanentemente?"
                                        description="Tu cuenta será deshabilitada inmediatamente y eliminada permanentemente en 30 días. Si inicias sesión antes de los 30 días, la eliminación se cancelará."
                                        confirmText="Sí, eliminar"
                                        onConfirm={eliminarCuenta}
                                        triggerAsChild={true}
                                    />
                                </div>
                            )}
                        </div>
                    </PanelCard>
                </div>
            </div>
        </div>
    );
}
