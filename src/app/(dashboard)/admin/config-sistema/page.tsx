"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { BackButton } from "@/components/ui/back-button";

import { Loader2, Plus, Trash2, Eye, EyeOff, Save, Settings, Key, Pencil } from "lucide-react";
import { toast } from "sonner";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type CategoriaConfig = "GENERAL" | "EMAIL" | "PAYMENT";

interface ConfigSistema {
    id: string;
    clave: string;
    valor: string;
    descripcion?: string;
    categoria: CategoriaConfig;
    esSecreta: boolean;
    creadoEn: string;
    actualizadoEn: string;
}



export default function ConfigSistemaPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [configs, setConfigs] = useState<ConfigSistema[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<ConfigSistema | null>(null);
    const [showValues, setShowValues] = useState<{ [key: string]: boolean }>({});

    // Form state
    const [formData, setFormData] = useState({
        clave: "",
        valor: "",
        descripcion: "",
        categoria: "GENERAL" as CategoriaConfig,
        esSecreta: false,
    });


    const cargarConfiguraciones = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/admin/config-sistema`);
            if (res.ok) {
                const data = await res.json();
                // Map data to include inferred category
                const mappedData = data.map((item: ConfigSistema) => ({
                    ...item,
                    categoria: inferCategory(item.clave)
                }));
                setConfigs(mappedData);
                // Initialize showValues
                const visibility = data.reduce((acc: Record<string, boolean>, c: ConfigSistema) => {
                    acc[c.id] = false;
                    return acc;
                }, {});
                setShowValues(visibility);
            } else {
                toast.error("Error al cargar configuraciones");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al cargar configuraciones");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            const rol = session?.user?.rol;
            if (rol !== "SUPER_ADMIN" && rol !== "ADMIN") {
                toast.error("Acceso denegado");
                router.push("/home");
            } else {
                cargarConfiguraciones();
            }
        }
    }, [status, session?.user?.rol, router, cargarConfiguraciones]);

    const inferCategory = (clave: string): CategoriaConfig => {
        const key = clave.toUpperCase();

        if (key.startsWith("STRIPE_") || key.startsWith("MERCADOPAGO_") || key.startsWith("PAYPAL_")) return "PAYMENT";
        if (key.startsWith("SMTP_") || key.startsWith("EMAIL_") || key.startsWith("RESEND_")) return "EMAIL";
        return "GENERAL";
    };



    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = editingConfig
                ? `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/admin/config-sistema/${editingConfig.id}`
                : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/admin/config-sistema`;

            const method = editingConfig ? 'PATCH' : 'POST';
            const body = editingConfig
                ? { valor: formData.valor }
                : formData;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success(editingConfig ? "Configuración actualizada" : "Configuración creada");
                setDialogOpen(false);
                resetForm();
                cargarConfiguraciones();
            } else {
                const error = await res.json();
                toast.error(error.error || "Error al guardar");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al guardar configuración");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/admin/config-sistema/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success("Configuración eliminada");
                cargarConfiguraciones();
            } else {
                toast.error("Error al eliminar");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al eliminar configuración");
        }
    };

    const openEditDialog = (config: ConfigSistema) => {
        setEditingConfig(config);
        setFormData({
            clave: config.clave,
            valor: config.valor,
            descripcion: config.descripcion || "",
            categoria: config.categoria,
            esSecreta: config.esSecreta,
        });
        setDialogOpen(true);
    };

    const resetForm = () => {
        setEditingConfig(null);
        setFormData({
            clave: "",
            valor: "",
            descripcion: "",
            categoria: "GENERAL",
            esSecreta: false,
        });
    };

    const toggleShowValue = (id: string) => {
        setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
    };



    if (status === "loading" || loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <BackButton href="/admin" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Configuración del Sistema</h1>
                        <p className="text-zinc-400 text-sm">Gestiona las variables de entorno y credenciales</p>
                    </div>
                </div>

                <div className="mb-4">
                    <Dialog open={dialogOpen} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-white text-black hover:bg-zinc-200">
                                <Plus className="h-4 w-4 mr-2" />
                                Nueva Configuración
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>{editingConfig ? "Editar Configuración" : "Nueva Configuración"}</DialogTitle>
                                    <DialogDescription className="text-zinc-400">
                                        {editingConfig ? "Actualiza el valor de la configuración" : "Agrega una nueva variable de configuración"}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    {!editingConfig && (
                                        <div className="space-y-2">
                                            <Label>Clave</Label>
                                            <Input
                                                value={formData.clave}
                                                onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                                                placeholder="CLIENT_ID"
                                                className="bg-zinc-800 border-zinc-700 text-white"
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Valor</Label>
                                        <Input
                                            type={formData.esSecreta ? "password" : "text"}
                                            value={formData.valor}
                                            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                            placeholder="Ingresa el valor"
                                            className="bg-zinc-800 border-zinc-700 text-white"
                                            required
                                        />
                                    </div>

                                    {!editingConfig && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Descripción (Opcional)</Label>
                                                <Textarea
                                                    value={formData.descripcion}
                                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                                    placeholder="Descripción de la configuración"
                                                    className="bg-zinc-800 border-zinc-700 text-white"
                                                    rows={2}
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="esSecreta"
                                                    checked={formData.esSecreta}
                                                    onChange={(e) => setFormData({ ...formData, esSecreta: e.target.checked })}
                                                    className="w-4 h-4"
                                                />
                                                <Label htmlFor="esSecreta" className="cursor-pointer">
                                                    Valor secreto (se encriptará)
                                                </Label>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            resetForm();
                                            setDialogOpen(false);
                                        }}
                                        className="text-zinc-400"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={saving} className="bg-white text-black hover:bg-zinc-200">
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        {editingConfig ? "Actualizar" : "Crear"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Settings className="h-5 w-5 text-indigo-400" />
                            Variables de Entorno
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Gestiona todas las variables de configuración del sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {configs.length > 0 ? (
                            <div className="space-y-3">
                                {configs.map(config => (
                                    <div key={config.id} className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm font-mono text-indigo-400">{config.clave}</code>
                                                    {config.esSecreta && (
                                                        <span className="px-2 py-0.5 bg-amber-900/30 text-amber-400 text-xs rounded border border-amber-700">
                                                            <Key className="h-3 w-3 inline mr-1" />
                                                            Secreto
                                                        </span>
                                                    )}
                                                </div>
                                                {config.descripcion && (
                                                    <p className="text-xs text-zinc-500">{config.descripcion}</p>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm text-zinc-300 bg-zinc-800 px-2 py-1 rounded font-mono">
                                                        {config.esSecreta && !showValues[config.id]
                                                            ? "••••••••••••"
                                                            : config.valor}
                                                    </code>
                                                    {config.esSecreta && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleShowValue(config.id)}
                                                            className="text-zinc-400 hover:text-white"
                                                        >
                                                            {showValues[config.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(config)}
                                                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Eliminar configuración?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-zinc-400">
                                                                Esta acción no se puede deshacer. Se eliminará permanentemente la configuración <code className="text-indigo-400">{config.clave}</code>.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800">
                                                                Cancelar
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(config.id)}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                Eliminar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-lg">
                                <Settings className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                                <p className="text-zinc-400 text-sm">No hay configuraciones registradas</p>
                                <p className="text-zinc-500 text-xs mt-1">Haz click en &quot;Nueva Configuración&quot; para agregar una</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
