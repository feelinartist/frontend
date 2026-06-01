"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export interface SongItem {
    readonly titulo: string;
    readonly artista: string;
    readonly total: number;
    readonly aceptados?: number;
    readonly rechazados?: number;
}

interface SongsAnalysisCardProps {
    readonly topCanciones: SongItem[];
    readonly topAceptadas: SongItem[];
    readonly topRechazadas: SongItem[];
    readonly onViewReport: () => void;
}

export function SongsAnalysisCard({
    topCanciones,
    topAceptadas,
    topRechazadas,
    onViewReport
}: SongsAnalysisCardProps) {
    return (
        <Card className="bg-zinc-900/40 border-white/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-white">Análisis de Canciones</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pedidas" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
                        <TabsTrigger value="pedidas">🎵 Más Pedidas</TabsTrigger>
                        <TabsTrigger value="aceptadas">✅ Aceptadas</TabsTrigger>
                        <TabsTrigger value="rechazadas">❌ Rechazadas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pedidas" className="mt-4">
                        <div className="space-y-2">
                            {topCanciones?.slice(0, 10).map((cancion, i) => (
                                <div key={`${cancion.titulo}-${cancion.artista}-${i}`} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-zinc-500 font-mono w-6 text-center">{i + 1}</span>
                                        <div>
                                            <p className="font-medium text-white">{cancion.titulo}</p>
                                            <p className="text-xs text-zinc-400">{cancion.artista}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-indigo-400 font-bold">{cancion.total}</span>
                                        <div className="flex gap-2 text-[10px] text-zinc-500 mt-1">
                                            <span className="text-green-500/70">✔ {cancion.aceptados ?? 0}</span>
                                            <span className="text-red-500/70">✖ {cancion.rechazados ?? 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!topCanciones || topCanciones.length === 0) && (
                                <div className="text-center py-8 text-zinc-500">No hay datos disponibles</div>
                            )}

                            <div className="pt-4 flex justify-center">
                                <Button
                                    variant="outline"
                                    className="w-full border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                    onClick={onViewReport}
                                >
                                    Ver reporte completo →
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="aceptadas" className="mt-4">
                        <div className="space-y-2">
                            {topAceptadas?.slice(0, 10).map((cancion, i) => (
                                <div key={`${cancion.titulo}-${cancion.artista}-${i}`} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-zinc-500 font-mono w-6 text-center">{i + 1}</span>
                                        <div>
                                            <p className="font-medium text-white">{cancion.titulo}</p>
                                            <p className="text-xs text-zinc-400">{cancion.artista}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-green-500 font-bold">{cancion.total}</span>
                                        <p className="text-[10px] text-zinc-500">Aceptados</p>
                                    </div>
                                </div>
                            ))}
                            {(!topAceptadas || topAceptadas.length === 0) && (
                                <div className="text-center py-8 text-zinc-500">No hay datos disponibles</div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="rechazadas" className="mt-4">
                        <div className="space-y-2">
                            {topRechazadas?.slice(0, 10).map((cancion, i) => (
                                <div key={`${cancion.titulo}-${cancion.artista}-${i}`} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-zinc-500 font-mono w-6 text-center">{i + 1}</span>
                                        <div>
                                            <p className="font-medium text-white">{cancion.titulo}</p>
                                            <p className="text-xs text-zinc-400">{cancion.artista}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-red-500 font-bold">{cancion.total}</span>
                                        <p className="text-[10px] text-zinc-500">Rechazados</p>
                                    </div>
                                </div>
                            ))}
                            {(!topRechazadas || topRechazadas.length === 0) && (
                                <div className="text-center py-8 text-zinc-500">No hay datos disponibles</div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
