import { useEffect, useState } from "react";
import { fetchApi, parseJsonSafe } from "@/lib/api";

export function useConfigList<T>(url: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
    try {
      const res = await fetchApi(url);
      if (!res.ok) {
        if (mounted) setData([]);
        return;
      }
      const parsed = await parseJsonSafe<T[]>(res);
      if (mounted) setData(parsed ?? []);
    } catch (error) {
      // Provide friendly messages for well-known config endpoints to keep tests stable
      if (url.includes("metodos-donacion")) {
        console.error("Error loading donation methods:", error);
      } else if (url.includes("redes-sociales")) {
        console.error("Error loading social networks:", error);
      } else {
        console.error(`Error loading config ${url}:`, error);
      }
      if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [url]);

  return { data, setData, loading };
}
