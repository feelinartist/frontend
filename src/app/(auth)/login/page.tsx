"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import Image from "next/image";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4">
            {/* Animated Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -left-20 -top-20 h-[500px] w-[500px] animate-pulse rounded-full bg-indigo-500/20 blur-[120px] duration-10000" />
                <div className="absolute -bottom-20 -right-20 h-[500px] w-[500px] animate-pulse rounded-full bg-purple-500/20 blur-[120px] duration-7000" />
                <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-blue-500/10 blur-[100px] duration-5000" />
            </div>

            <Card className="z-10 w-full max-w-sm border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:border-white/20 hover:bg-black/50">
                <CardHeader className="space-y-6 text-center pb-2">
                    <div className="flex justify-center">
                        <div className="relative h-28 w-28 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10 transition-transform duration-500 hover:scale-105 hover:ring-white/20 hover:shadow-indigo-500/20">
                            <Image
                                src="/images/placeholders/Feelin_sin_fondo.png"
                                alt="Feelin Logo"
                                    fill
                                    sizes="112px"
                                className="object-cover p-2"
                                priority
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <CardDescription className="text-lg font-medium text-zinc-400">
                            Siente la música en vivo
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6 px-8">
                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest">
                            <span className="bg-black/0 px-4 text-zinc-500 font-semibold">
                                Ingresar
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        type="button"
                        className="group relative h-12 w-full border-white/10 bg-white/5 text-base font-medium text-white transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] flex items-center justify-center gap-3 hover:text-[#0033CC]"
                        onClick={() => {
                            setIsLoading(true);
                            signIn("google", { callbackUrl: "/home" });
                        }}
                    >
                        <Icons className="h-5 w-5" />
                        <span>Continuar con Google</span>
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 text-center text-xs text-zinc-500 pb-8">
                    <p>
                        Al continuar, aceptas nuestros{" "}
                        <a href="/terms" className="underline decoration-zinc-700 underline-offset-4 hover:text-white hover:decoration-white transition-colors">Términos</a>{" "}
                        y{" "}
                        <a href="/privacy" className="underline decoration-zinc-700 underline-offset-4 hover:text-white hover:decoration-white transition-colors">Privacidad</a>.
                    </p>
                </CardFooter>
            </Card>

            <div className="absolute bottom-6 text-xs text-zinc-600 font-mono">
                © {new Date().getFullYear()} Feelin App
            </div>
        </div>
    );
}
