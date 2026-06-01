import { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string
            rol?: string | null
            nombreArtistico?: string | null
            nombreUsuario?: string | null
            ultimoCambioNombreUsuario?: Date | string | null
            ultimoCambioNombre?: Date | string | null
            perfilCompletadoReconocido?: boolean
            perfilArtista?: {
                id?: string;
                nombreArtistico?: string | null;
                categoria?: string | null;
                pais?: string | null;
                ciudad?: string | null;
                fechaInicio?: string | Date | null;
                lugaresConocidos?: string[];
                codigoTelefono?: string | null;
                numeroTelefono?: string | null;
                tarifaPorHora?: number | null;
                moneda?: string | null;
                biografia?: string | null;
                [key: string]: unknown;
            } | null
            perfilDiscoteca?: {
                id?: string;
                nombre?: string | null;
                direccion?: string | null;
                capacidad?: number | null;
                fechaFundacion?: string | Date | null;
                [key: string]: unknown;
            } | null
            perfilPublico?: {
                id?: string;
                preferencias?: unknown;
                [key: string]: unknown;
            } | null
            email: string
            name?: string | null
            image?: string | null
        } & DefaultSession["user"]
        /** Backend JWT for authenticated API calls */
        accessToken: string
    }

    interface User {
        id: string
        rol?: string | null
        nombreArtistico?: string | null
        nombreUsuario?: string | null
        ultimoCambioNombreUsuario?: Date | string | null
        ultimoCambioNombre?: Date | string | null
        perfilCompletadoReconocido?: boolean
        perfilArtista?: {
            id?: string;
            nombreArtistico?: string | null;
            [key: string]: unknown;
        } | null
        perfilDiscoteca?: {
            id?: string;
            nombre?: string | null;
            [key: string]: unknown;
        } | null
        perfilPublico?: {
            id?: string;
            [key: string]: unknown;
        } | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        rol: string
        nombreArtistico?: string | null
        nombreUsuario?: string | null
        ultimoCambioNombreUsuario?: Date | string | null
        ultimoCambioNombre?: Date | string | null
        perfilCompletadoReconocido?: boolean
        /** Backend JWT for authenticated API calls */
        accessToken?: string
    }
}
