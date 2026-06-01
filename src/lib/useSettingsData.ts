import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

export interface BlockedUser {
  id: string;
  nombre?: string;
  nombreUsuario?: string;
  correo?: string;
  imagen?: string;
  [key: string]: unknown;
}

export interface ExistingProfiles {
  artista: boolean;
  discoteca: boolean;
  publico: boolean;
}

export function useSettingsData(userId: string | undefined) {
  const [bloqueados, setBloqueados] = useState<BlockedUser[]>([]);
  const [cargandoBloqueados, setCargandoBloqueados] = useState(false);
  const [perfilesExistentes, setPerfilesExistentes] = useState<ExistingProfiles>({
    artista: false,
    publico: false,
    discoteca: false,
  });

  const cargarBloqueados = useCallback(async () => {
    if (!userId) {
      return;
    }

    setCargandoBloqueados(true);
    try {
      const res = await fetchApi(`/api/usuarios/bloqueados/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setBloqueados(data);
      }
    } catch (error) {
      console.error("Error cargando bloqueados:", error);
    } finally {
      setCargandoBloqueados(false);
    }
  }, [userId]);

  const cargarPerfil = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const res = await fetchApi(`/api/usuarios/perfil/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPerfilesExistentes({
          artista: !!data.perfilArtista,
          publico: !!data.perfilPublico,
          discoteca: !!data.perfilDiscoteca,
        });
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    }
  }, [userId]);

  const desbloquearUsuario = useCallback(
    async (bloqueadoId: string) => {
      if (!userId) {
        throw new Error("Usuario no autenticado");
      }

      const res = await fetchApi('/api/usuarios/desbloquear', {
        method: 'POST',
        body: JSON.stringify({
          bloqueadorId: userId,
          bloqueadoId,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al desbloquear usuario");
      }

      await cargarBloqueados();
    },
    [userId, cargarBloqueados]
  );

  useEffect(() => {
    if (!userId) {
      return;
    }

    cargarBloqueados();
    cargarPerfil();
  }, [userId, cargarBloqueados, cargarPerfil]);

  return {
    bloqueados,
    cargandoBloqueados,
    perfilesExistentes,
    cargarBloqueados,
    cargarPerfil,
    desbloquearUsuario,
  };
}
