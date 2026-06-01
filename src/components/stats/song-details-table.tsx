"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SongDetail {
    titulo: string;
    artista: string;
    genero: string;
    total: number;
    aceptados: number;
    rechazados: number;
    ultimoPedido: string; // ISO Date string
}

interface SongDetailsTableProps {
    readonly data: SongDetail[];
    readonly totalPoints: number;
    readonly page: number;
    readonly totalPages: number;
    readonly isLoading: boolean;
    readonly onPageChange: (newPage: number) => void;
    readonly onSearchChange: (search: string) => void;
    readonly onSortChange: (sort: string) => void;
    readonly currentSort: string;
    readonly currentSearch: string;
}

export function SongDetailsTable({
    data,
    totalPoints,
    page,
    totalPages,
    isLoading,
    onPageChange,
    onSearchChange,
    onSortChange,
    currentSort,
    currentSearch
}: SongDetailsTableProps) {
    // Debounce search handled by parent or useEffect here if needed
    // For simplicity, assuming parent handles debounce or direct update

    const renderTableBody = () => {
        if (isLoading) {
            const skeletons = [1, 2, 3, 4, 5];
            return skeletons.map((id) => (
                <TableRow key={`skeleton-${id}`} className="border-white/5">
                    <TableCell><div className="h-4 bg-white/10 rounded w-32 animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-white/10 rounded w-24 animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-white/10 rounded w-16 animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 bg-white/10 rounded w-8 animate-pulse ml-auto" /></TableCell>
                    <TableCell><div className="h-4 bg-white/10 rounded w-8 animate-pulse ml-auto" /></TableCell>
                    <TableCell><div className="h-4 bg-white/10 rounded w-8 animate-pulse ml-auto" /></TableCell>
                    <TableCell><div className="h-4 bg-white/10 rounded w-20 animate-pulse ml-auto" /></TableCell>
                </TableRow>
            ));
        }

        if (data.length === 0) {
            return (
                <TableRow className="border-white/5 hover:bg-transparent">
                    <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                        No se encontraron canciones
                    </TableCell>
                </TableRow>
            );
        }

        return data.map((song, i) => (
            <TableRow key={`${song.titulo}-${song.artista}-${i}`} className="border-white/5 hover:bg-white/5">
                <TableCell className="font-medium text-white">{song.titulo}</TableCell>
                <TableCell className="text-zinc-400">{song.artista}</TableCell>
                <TableCell className="text-zinc-500 text-sm">{song.genero || '-'}</TableCell>
                <TableCell className="text-right font-bold text-indigo-400">{song.total}</TableCell>
                <TableCell className="text-right text-green-500 font-medium">
                    {song.aceptados}
                    <span className="text-[10px] text-zinc-600 block">
                        {song.total > 0 ? Math.round((song.aceptados / song.total) * 100) : 0}%
                    </span>
                </TableCell>
                <TableCell className="text-right text-red-500 font-medium">
                    {song.rechazados}
                    <span className="text-[10px] text-zinc-600 block">
                        {song.total > 0 ? Math.round((song.rechazados / song.total) * 100) : 0}%
                    </span>
                </TableCell>
                <TableCell className="text-right text-zinc-400 text-sm">
                    {song.ultimoPedido
                        ? format(new Date(song.ultimoPedido), "d MMM, yy", { locale: es })
                        : '-'
                    }
                </TableCell>
            </TableRow>
        ));
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Buscar canción o artista..."
                        value={currentSearch}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-zinc-900/40 border-white/10 text-white placeholder:text-zinc-500"
                    />
                </div>
                <Select value={currentSort} onValueChange={onSortChange}>
                    <SelectTrigger className="w-[180px] bg-zinc-900/40 border-white/10 text-white">
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pedidas">Más Pedidas</SelectItem>
                        <SelectItem value="aceptadas">Más Aceptadas</SelectItem>
                        <SelectItem value="rechazadas">Más Rechazadas</SelectItem>
                        <SelectItem value="recientes">Más Recientes</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border border-white/10 bg-zinc-900/40 overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-zinc-400 font-medium">Canción</TableHead>
                            <TableHead className="text-zinc-400 font-medium">Artista</TableHead>
                            <TableHead className="text-zinc-400 font-medium">Género</TableHead>
                            <TableHead className="text-right text-zinc-400 font-medium">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onSortChange('pedidas')}
                                    className={`hover:bg-transparent hover:text-white p-0 h-auto font-medium ${currentSort === 'pedidas' ? 'text-indigo-400' : ''}`}
                                >
                                    Total
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right text-zinc-400 font-medium text-green-500">Aceptadas</TableHead>
                            <TableHead className="text-right text-zinc-400 font-medium text-red-500">Rechazadas</TableHead>
                            <TableHead className="text-right text-zinc-400 font-medium">Última Vez</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableBody()}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="text-sm text-zinc-500">
                    Mostrando {data.length} de {totalPoints} canciones
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1 || isLoading}
                        className="border-white/10 bg-transparent text-white hover:bg-white/10"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-white px-2">
                        Página {page} de {totalPages || 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages || isLoading}
                        className="border-white/10 bg-transparent text-white hover:bg-white/10"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
