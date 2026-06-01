"use client";

import { useEffect, useMemo } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Image as ImageIcon, Share2, DollarSign, User, X, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    completed: boolean;
    icon: React.ReactNode;
    action?: () => void;
}

interface ProfileCompletionChecklistProps {
    readonly perfilArtista: {
        readonly biografia?: string;
        readonly categoria?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        readonly galeria?: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        readonly redesSociales?: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        readonly metodosDonacion?: any[];
    };
    readonly onDismiss?: () => void;
}

export function ProfileCompletionChecklist({ perfilArtista, onDismiss }: ProfileCompletionChecklistProps) {

    const resetCompletionAcknowledgment = async () => {
        try {
            const session = await fetch('/api/auth/session').then(res => res.json());
            if (!session?.user?.id) return;

            await fetchApi('/api/usuarios/marcar-perfil-completado', {
                method: 'POST',
                body: JSON.stringify({
                    usuarioId: session.user.id,
                    perfilCompletadoReconocido: false
                })
            });
        } catch (error) {
            console.error('Error resetting completion acknowledgment:', error);
        }
    };

    const checklistItems: ChecklistItem[] = useMemo(() => [
        {
            id: "basic-info",
            label: "Información básica",
            description: "Completa tu biografía y categoría",
            completed: !!(perfilArtista?.biografia && perfilArtista?.categoria),
            icon: <User className="h-5 w-5" />,
            action: () => globalThis.location.href = '/profile?tab=personal'
        },
        {
            id: "gallery",
            label: "Galería de imágenes",
            description: "Agrega al menos 1 imagen",
            completed: !!(perfilArtista?.galeria && perfilArtista.galeria.length > 0),
            icon: <ImageIcon className="h-5 w-5" />,
            action: () => globalThis.location.href = '/profile?tab=gallery'
        },
        {
            id: "social-media",
            label: "Redes sociales",
            description: "Conecta al menos 1 red social",
            completed: !!(perfilArtista?.redesSociales && perfilArtista.redesSociales.length > 0),
            icon: <Share2 className="h-5 w-5" />,
            action: () => globalThis.location.href = '/profile?tab=social'
        },
        {
            id: "donation",
            label: "Métodos de donación",
            description: "Configura al menos 1 método",
            completed: !!(perfilArtista?.metodosDonacion && perfilArtista.metodosDonacion.length > 0),
            icon: <DollarSign className="h-5 w-5" />,
            action: () => globalThis.location.href = '/profile?tab=donation'
        },
    ], [perfilArtista]);

    const completedCount = checklistItems.filter(item => item.completed).length;
    const totalCount = checklistItems.length;
    const progress = (completedCount / checklistItems.length) * 100;
    const isComplete = progress === 100;

    useEffect(() => {
        // If profile becomes incomplete, reset the acknowledgment flag in backend
        if (progress < 100) {
            resetCompletionAcknowledgment();
        }
    }, [progress]);





    const handleComplete = async () => {
        try {
            const session = await fetch('/api/auth/session').then(res => res.json());
            if (!session?.user?.id) {
                console.error('No session or user ID found');
                return;
            }

            console.log('Marking profile as complete for user:', session.user.id);

            // Mark as acknowledged in backend
            const response = await fetchApi('/api/usuarios/marcar-perfil-completado', {
                method: 'POST',
                body: JSON.stringify({ usuarioId: session.user.id })
            });

            if (!response.ok) {
                console.error('Failed to mark profile as complete:', response.status, await response.text());
                onDismiss?.();
                return;
            }

            const result = await response.json();
            console.log('Profile marked as complete successfully:', result);

            // Reload the page to get fresh session data
            globalThis.location.reload();
        } catch (error) {
            console.error('Error marking profile as complete:', error);
            onDismiss?.(); // Dismiss anyway on error
        }
    };

    return (
        <Card className="border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden relative">
            {/* Close button - always just dismisses */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 z-10 h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
                onClick={onDismiss}
            >
                <X className="h-4 w-4" />
            </Button>

            <CardHeader className="text-center pb-4 pr-12">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <svg className="w-20 h-20 transform -rotate-90">
                            {/* Background circle */}
                            <circle
                                cx="40"
                                cy="40"
                                r="35"
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="none"
                                className="text-zinc-800"
                            />
                            {/* Progress circle */}
                            <motion.circle
                                cx="40"
                                cy="40"
                                r="35"
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="none"
                                className={isComplete ? "text-emerald-500" : "text-indigo-500"}
                                strokeLinecap="round"
                                initial={{ strokeDasharray: "0 219.91" }}
                                animate={{
                                    strokeDasharray: `${(progress / 100) * 219.91} 219.91`,
                                }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-white">{Math.round(progress)}%</span>
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-xl text-white">Completa tu perfil</CardTitle>
                        <p className="text-sm text-zinc-400 mt-1">
                            {completedCount === totalCount
                                ? "¡Perfil completo! 🎉"
                                : `${completedCount} de ${totalCount} completados`}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {checklistItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex flex-col items-center gap-3 p-4 rounded-lg transition-all cursor-pointer ${item.completed
                                ? "bg-emerald-500/10 hover:bg-emerald-500/20"
                                : "bg-zinc-900/50 hover:bg-zinc-800/50"
                                }`}
                            onClick={item.action}
                        >
                            <div className="flex-shrink-0">
                                {item.completed ? (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                    >
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                    </motion.div>
                                ) : (
                                    <Circle className="h-8 w-8 text-zinc-600" />
                                )}
                            </div>
                            <div className="text-center space-y-1">
                                <div className={`flex justify-center ${item.completed ? "text-emerald-400" : "text-zinc-500"}`}>
                                    {item.icon}
                                </div>
                                <p className={`text-sm font-medium ${item.completed ? "text-white" : "text-zinc-300"}`}>
                                    {item.label}
                                </p>
                                <p className="text-xs text-zinc-500 hidden lg:block">{item.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Completion button - only show when 100% complete */}
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-4"
                    >
                        <Button
                            onClick={handleComplete}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 rounded-xl shadow-lg transition-all transform active:scale-[0.98]"
                        >
                            <Check className="mr-2 h-5 w-5" />
                            ¡Entendido!
                        </Button>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
