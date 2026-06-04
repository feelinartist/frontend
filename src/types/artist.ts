export interface RedSocial {
    nombreUsuario: string;
    id?: string;
    redSocial?: {
        nombre: string;
        urlBase: string;
        icono?: string;
    };
    [key: string]: unknown;
}

export interface Evento {
    titulo: string;
    descripcion: string;
    estado: string;
    [key: string]: unknown;
}

export interface PublicUser {
    id: string;
    nombre?: string;
    nombreUsuario?: string;
    imagen?: string;
    perfilArtista?: {
        nombreArtistico?: string;
        biografia?: string;
        generoMusical?: string;
        pais?: string;
        paisId?: string;
        ciudad?: string;
        ciudadId?: string;
        fechaInicio?: string;
        tarifaPorHora?: string;
        moneda?: string;
        categoria?: string;
        lugaresConocidos?: string[];
        urlPago?: string | null;
        pagoQR?: string | null;
        musicQR?: string | null;
        nombreQR?: string | null;
        urlYoutubeFavorito?: string;
        urlSoundCloudFavorito?: string;
        redesSociales?: RedSocial[];
        eventos?: Evento[];
        galeria?: { id: string; urlImagen?: string; url?: string }[];
    };
    [key: string]: unknown;
}
