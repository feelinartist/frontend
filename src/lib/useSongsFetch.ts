import { useState, useCallback } from "react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { useDebounce } from "@/lib/useDebounce";

export interface SongStats {
    titulo: string;
    artista: string;
    genero: string;
    total: number;
    aceptados: number;
    rechazados: number;
    ultimoPedido: string;
    [key: string]: unknown;
}

interface UseSongsFetchOptions {
    apiEndpoint: (params: URLSearchParams) => string;
    enabled?: boolean;
}

export function useSongsFetch(options: UseSongsFetchOptions) {
    const { apiEndpoint, enabled = true } = options;
    
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<SongStats[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Filters
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("pedidas");

    // Debounce search
    const debouncedSearch = useDebounce(search, 500);

    const fetchSongs = useCallback(async () => {
        if (!enabled) return;
        
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                search: debouncedSearch,
                ordenarPor: sort
            });

            const endpoint = apiEndpoint(params);
            const res = await fetchApi(endpoint);
            if (!res.ok) throw new Error("Error al cargar canciones");

            const result = await res.json();
            setData(result.canciones);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar el reporte de canciones");
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch, sort, enabled, apiEndpoint]);

    return {
        isLoading,
        data,
        total,
        totalPages,
        page,
        setPage,
        search,
        setSearch,
        sort,
        setSort,
        fetchSongs,
        debouncedSearch,
    };
}
