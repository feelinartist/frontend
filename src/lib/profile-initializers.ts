import { findCountryCode } from './profile-utils';

interface ArtistProfileData {
  nombre?: string;
  nombreUsuario?: string;
  perfilArtista?: {
    nombreArtistico?: string | null;
    categoria?: string | null;
    biografia?: string | null;
    ciudad?: string | null;
    pais?: string | null;
    codigoTelefono?: string | null;
    numeroTelefono?: string | null;
    tarifaPorHora?: string | number | null;
    moneda?: string | null;
    zonaHoraria?: string | null;
    urlYoutubeFavorito?: string | null;
    urlSoundCloudFavorito?: string | null;
  } | null;
}

interface VenueProfileData {
  nombre?: string;
  nombreUsuario?: string;
  perfilDiscoteca?: {
    ciudad?: string | null;
    pais?: string | null;
    codigoTelefono?: string | null;
    numeroTelefono?: string | null;
    zonaHoraria?: string | null;
  } | null;
}

export function getArtistInitialFormData(userData: ArtistProfileData, countries: { name: string; code: string; phoneCode: string }[]) {
  return {
    nombreArtistico: userData.perfilArtista?.nombreArtistico || userData.nombre || "",
    nombreUsuario: userData.nombreUsuario || "",
    categoria: userData.perfilArtista?.categoria || "",
    biografia: userData.perfilArtista?.biografia || "",
    ciudad: userData.perfilArtista?.ciudad || "",
    pais: findCountryCode(countries, userData.perfilArtista?.pais ?? undefined, 'PE'),
    codigoTelefono: userData.perfilArtista?.codigoTelefono || "+51",
    numeroTelefono: userData.perfilArtista?.numeroTelefono || "",
    tarifaPorHora: userData.perfilArtista?.tarifaPorHora || "",
    moneda: userData.perfilArtista?.moneda || "PEN",
    zonaHoraria: userData.perfilArtista?.zonaHoraria || Intl.DateTimeFormat().resolvedOptions().timeZone,
    urlYoutubeFavorito: userData.perfilArtista?.urlYoutubeFavorito || "",
    urlSoundCloudFavorito: userData.perfilArtista?.urlSoundCloudFavorito || "",
  };
}

export function getVenueInitialFormData(userData: VenueProfileData, countries: { name: string; code: string; phoneCode: string }[]) {
  return {
    nombre: userData.nombre || "",
    nombreUsuario: userData.nombreUsuario || "",
    ciudad: userData.perfilDiscoteca?.ciudad || "",
    pais: findCountryCode(countries, userData.perfilDiscoteca?.pais ?? undefined, 'PE'),
    codigoTelefono: userData.perfilDiscoteca?.codigoTelefono || "+51",
    numeroTelefono: userData.perfilDiscoteca?.numeroTelefono || "",
    zonaHoraria: userData.perfilDiscoteca?.zonaHoraria || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
