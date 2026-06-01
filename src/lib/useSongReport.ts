import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/lib/useDebounce";

export type SongReportResponse<T> = {
    canciones: T[];
    total: number;
    totalPages: number;
};

export function useSongReport<T>(
    fetchSongs: (args: { page: number; search: string; sort: string }) => Promise<SongReportResponse<T>>,
    deps: unknown[] = []
) {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("pedidas");

    const debouncedSearch = useDebounce(search, 500);

    // Run load logic inside effect because deps is dynamic (spread).
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setIsLoading(true);
                const result = await fetchSongs({ page, search: debouncedSearch, sort });
                if (!mounted) return;
                setData(result.canciones);
                setTotal(result.total);
                setTotalPages(result.totalPages);
            } catch (error) {
                console.error(error);
                toast.error("Error al cargar el reporte de canciones");
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [fetchSongs, page, debouncedSearch, sort, ...deps]);

    return {
        isLoading,
        data,
        total,
        totalPages,
        page,
        search,
        sort,
        setPage,
        setSearch,
        setSort,
    };
}
