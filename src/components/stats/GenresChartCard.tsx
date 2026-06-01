"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend } from "recharts";
import { Award } from "lucide-react";

interface GeneroConteo {
    genero: string;
    conteo: number;
    porcentaje: number;
}

interface GenresChartCardProps {
    readonly generosPorConteo: GeneroConteo[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

export function GenresChartCard({ generosPorConteo }: GenresChartCardProps) {
    const dataWithColors = generosPorConteo?.map((item, index) => ({
        ...item,
        fill: COLORS[index % COLORS.length]
    })) || [];

    return (
        <Card className="bg-zinc-900/40 border-white/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <Award className="w-5 h-5 text-pink-500" />
                    Géneros Más Pedidos
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                {generosPorConteo && generosPorConteo.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dataWithColors}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="conteo"
                                nameKey="genero"
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-zinc-500">
                        No hay datos de géneros disponibles
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
