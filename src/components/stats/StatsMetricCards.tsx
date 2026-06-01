"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Music, CheckCircle, XCircle, TrendingUp } from "lucide-react";

interface StatsMetricCardsProps {
    readonly totalPedidos: number;
    readonly totalAceptados: number;
    readonly totalRechazados: number;
    readonly tasaAceptacion: number;
}

export function StatsMetricCards({
    totalPedidos,
    totalAceptados,
    totalRechazados,
    tasaAceptacion
}: StatsMetricCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <Card className="bg-zinc-900/40 border-white/10">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-400 text-sm">Total Pedidos</p>
                            <p className="text-3xl font-bold mt-1">{totalPedidos}</p>
                        </div>
                        <Music className="h-10 w-10 text-indigo-500" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/40 border-white/10">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-400 text-sm">Aceptados</p>
                            <p className="text-3xl font-bold mt-1 text-green-500">{totalAceptados}</p>
                        </div>
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/40 border-white/10">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-400 text-sm">Rechazados</p>
                            <p className="text-3xl font-bold mt-1 text-red-500">{totalRechazados}</p>
                        </div>
                        <XCircle className="h-10 w-10 text-red-500" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/40 border-white/10">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-400 text-sm">Tasa Aceptación</p>
                            <p className="text-3xl font-bold mt-1 text-indigo-500">{tasaAceptacion}%</p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-indigo-500" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
