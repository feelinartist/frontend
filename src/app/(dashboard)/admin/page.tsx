"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
    Share2,
    CreditCard,
    ArrowRight,
    ShieldCheck,
    Users,
    BarChart3,
    Settings
} from "lucide-react";
import Link from "next/link";

export default function PaginaAdmin() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") {
        return <LoadingScreen />;
    }

    // Protection: Only ADMIN or SUPER_ADMIN can access this page
    if (!session || (session.user?.rol !== 'SUPER_ADMIN' && session.user?.rol !== 'ADMIN')) {
        router.push("/home");
        return null;
    }

    const adminSections = [
        {
            title: "Configuración del Sistema",
            description: "Gestiona las variables de entorno y credenciales de servicios.",
            icon: <Settings className="h-6 w-6 text-purple-500" />,
            href: "/admin/config-sistema",
            color: "from-purple-500/20 to-violet-500/20"
        },
        {
            title: "Configuración de Redes",
            description: "Gestiona las redes sociales disponibles para los perfiles de artistas.",
            icon: <Share2 className="h-6 w-6 text-pink-500" />,
            href: "/admin/config?tab=social",
            color: "from-pink-500/20 to-rose-500/20"
        },
        {
            title: "Métodos de Donación",
            description: "Administra las opciones de apoyo y propinas para los artistas.",
            icon: <CreditCard className="h-6 w-6 text-emerald-500" />,
            href: "/admin/config?tab=donations",
            color: "from-emerald-500/20 to-teal-500/20"
        },
        {
            title: "Gestión de Usuarios",
            description: "Ver y administrar todos los usuarios registrados en la plataforma.",
            icon: <Users className="h-6 w-6 text-blue-500" />,
            href: "/admin/usuarios",
            color: "from-blue-500/20 to-indigo-500/20"
        },
        {
            title: "Estadísticas Globales",
            description: "Analítica detallada sobre el crecimiento y uso de Feelin.",
            icon: <BarChart3 className="h-6 w-6 text-amber-500" />,
            href: "#", // Pending implementation
            disabled: true,
            color: "from-amber-500/20 to-orange-500/20"
        }
    ];

    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />

            <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="h-5 w-5 text-indigo-500" />
                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Panel de Administración</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Consola de Control</h1>
                        <p className="text-zinc-400 mt-2 text-sm">Gestiona los parámetros globales y configuraciones de Feelin.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {adminSections.map((section) => (
                        <Card
                            key={section.title}
                            className={`border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden group transition-all duration-300 ${section.disabled ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:border-white/20 hover:bg-white/5'}`}
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${section.color} blur-3xl -mr-16 -mt-16 group-hover:opacity-100 opacity-50 transition-opacity`} />

                            <CardHeader className="pb-2">
                                <div className="mb-4 p-3 bg-white/5 w-fit rounded-2xl border border-white/10">
                                    {section.icon}
                                </div>
                                <CardTitle className="text-2xl text-white">{section.title}</CardTitle>
                                <CardDescription className="text-zinc-400 text-base leading-relaxed">
                                    {section.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    asChild={!section.disabled}
                                    variant="ghost"
                                    className={`w-full justify-between mt-4 border border-white/10 rounded-xl group/btn ${section.disabled ? 'cursor-not-allowed' : 'hover:bg-indigo-600 hover:text-white hover:border-indigo-600'}`}
                                    disabled={section.disabled}
                                >
                                    {section.disabled ? (
                                        <span className="flex items-center justify-between w-full">
                                            Próximamente
                                            <ShieldCheck className="ml-2 h-4 w-4 opacity-50" />
                                        </span>
                                    ) : (
                                        <Link href={section.href} className="flex items-center justify-between w-full">
                                            Entrar a gestión
                                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <footer className="pt-8 border-t border-white/5 text-center">
                    <p className="text-zinc-600 text-sm">
                        Sistema exclusivo para personal autorizado de Feelin. Todas las acciones son registradas.
                    </p>
                </footer>
            </div>
        </div>
    );
}
