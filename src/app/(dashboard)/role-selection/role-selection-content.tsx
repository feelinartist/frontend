"use client";

import { fetchApi } from "@/lib/api";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/animated-background";
import { LoadingScreen } from "@/components/ui/loading-screen";

export const roles = [
    {
        id: "ARTISTA",
        title: "Soy Artista",
        description: "DJ, Banda, Solista, Productor. Crea tu perfil y recibe pedidos.",
    },
    {
        id: "PUBLICO",
        title: "Soy Público",
        description: "Pide canciones, sigue a tus artistas favoritos y vive la fiesta.",
    },
    {
        id: "DISCOTECA",
        title: "Soy Discoteca",
        description: "Gestiona eventos y contrata artistas para tu local.",
    },
];

export default function ContenidoSeleccionRol() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const manejarSeleccionRol = async (rol: string) => {
        setIsLoading(true);
        if (rol === 'ARTISTA') {
            router.push('/artist-registration');
            return;
        }

        if (rol === 'PUBLICO') {
            router.push('/public-registration');
            return;
        }

        if (rol === 'DISCOTECA') {
            router.push('/venue-registration');
            return;
        }

        try {
            // Call backend to update role
            const response = await fetchApi('/api/usuarios/rol', {
                method: 'PATCH',
                body: JSON.stringify({ correo: session?.user?.email, rol })
            });

            if (response.ok) {
                globalThis.location.replace('/home');
            } else {
                console.error('Error al actualizar rol');
            }
        } catch (error) {
            console.error('Error actualizando rol:', error);
        }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-y-auto overflow-x-hidden bg-black px-4 pt-32 pb-10">
            <AnimatedBackground />
            <div className="z-10 w-full max-w-5xl space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Elige tu rol en Feelin</h1>
                    <p className="text-lg text-zinc-400">
                        ¿Cómo quieres participar en la comunidad?
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {roles.map((rol) => (
                        <Card
                            key={rol.id}
                            className="group relative cursor-pointer border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/5 hover:shadow-2xl hover:shadow-[#0055FF]/20"
                            onClick={() => manejarSeleccionRol(rol.id)}
                        >
                            <CardHeader className="space-y-4 text-center pb-2">
                                <CardTitle className="text-2xl font-bold text-white group-hover:text-[#0055FF] transition-colors">{rol.title}</CardTitle>
                                <CardDescription className="text-zinc-400 group-hover:text-zinc-300 transition-colors text-base leading-relaxed">
                                    {rol.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <Button className="w-full bg-white/10 text-white hover:text-[#BF00FF] hover:bg-white/20 border-0 transition-colors" variant="outline">
                                    Seleccionar
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
