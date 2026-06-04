import { describe, it, expect, vi } from 'vitest';
import { getArtistInitialFormData, getVenueInitialFormData } from "../profile-initializers";

vi.mock("../profile-utils", () => ({
  findCountryCode: vi.fn((countries, pais, defaultPais) => pais || defaultPais)
}));

describe('profile-initializers', () => {
  const countries = [{ name: 'Peru', code: 'PE', phoneCode: '+51' }];

  describe('getArtistInitialFormData', () => {
    it('returns default values when userData is empty', () => {
      const result = getArtistInitialFormData({}, countries);
      expect(result).toEqual({
        nombreArtistico: "",
        nombreUsuario: "",
        categoria: "",
        biografia: "",
        ciudad: "",
        pais: "PE",
        codigoTelefono: "+51",
        numeroTelefono: "",
        tarifaPorHora: "",
        moneda: "PEN",
        zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
        urlYoutubeFavorito: "",
        urlSoundCloudFavorito: ""
      });
    });

    it('returns correct values when userData is fully populated', () => {
      const userData = {
        nombre: 'Nombre original',
        nombreUsuario: 'user123',
        perfilArtista: {
          nombreArtistico: 'ArtistaX',
          categoria: 'DJ',
          biografia: 'Bio test',
          ciudad: 'Lima',
          pais: 'CO',
          codigoTelefono: '+57',
          numeroTelefono: '9999999',
          tarifaPorHora: 100,
          moneda: 'USD',
          zonaHoraria: 'America/Bogota',
          urlYoutubeFavorito: 'https://youtube.com',
          urlSoundCloudFavorito: 'https://soundcloud.com'
        }
      };

      const result = getArtistInitialFormData(userData, countries);
      expect(result).toEqual({
        nombreArtistico: 'ArtistaX',
        nombreUsuario: 'user123',
        categoria: 'DJ',
        biografia: 'Bio test',
        ciudad: 'Lima',
        pais: 'CO',
        codigoTelefono: '+57',
        numeroTelefono: '9999999',
        tarifaPorHora: 100,
        moneda: 'USD',
        zonaHoraria: 'America/Bogota',
        urlYoutubeFavorito: 'https://youtube.com',
        urlSoundCloudFavorito: 'https://soundcloud.com'
      });
    });

    it('falls back to nombre if nombreArtistico is empty', () => {
      const userData = {
        nombre: 'Nombre Fallback',
        perfilArtista: {}
      };
      const result = getArtistInitialFormData(userData, countries);
      expect(result.nombreArtistico).toBe('Nombre Fallback');
    });
  });

  describe('getVenueInitialFormData', () => {
    it('returns default values when userData is empty', () => {
      const result = getVenueInitialFormData({}, countries);
      expect(result).toEqual({
        nombre: "",
        nombreUsuario: "",
        ciudad: "",
        pais: "PE",
        codigoTelefono: "+51",
        numeroTelefono: "",
        zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    });

    it('returns correct values when userData is fully populated', () => {
      const userData = {
        nombre: 'Discoteca Central',
        nombreUsuario: 'disco_central',
        perfilDiscoteca: {
          ciudad: 'Arequipa',
          pais: 'MX',
          codigoTelefono: '+52',
          numeroTelefono: '8888888',
          zonaHoraria: 'America/Mexico_City'
        }
      };

      const result = getVenueInitialFormData(userData, countries);
      expect(result).toEqual({
        nombre: 'Discoteca Central',
        nombreUsuario: 'disco_central',
        ciudad: 'Arequipa',
        pais: 'MX',
        codigoTelefono: '+52',
        numeroTelefono: '8888888',
        zonaHoraria: 'America/Mexico_City'
      });
    });
  });
});
