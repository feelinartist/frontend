export interface ArtistProfile {
    id: string;
    biografia?: string;
    categoria?: string;
    galeria?: { urlImagen: string }[];
    redesSociales?: { plataforma: string, url: string }[];
    metodosDonacion?: unknown[];
    [key: string]: unknown;
}
