import { describe, it, expect } from 'vitest';
import { normalize, findCountryCode } from './profile-utils';

describe('profile-utils', () => {
  describe('normalize', () => {
    it('converts text to lowercase', () => {
      expect(normalize('HELLO')).toBe('hello');
      expect(normalize('HeLLo')).toBe('hello');
    });

    it('removes accents and diacritical marks', () => {
      expect(normalize('café')).toBe('cafe');
      expect(normalize('naïve')).toBe('naive');
      expect(normalize('résumé')).toBe('resume');
      expect(normalize('Perú')).toBe('peru');
      expect(normalize('México')).toBe('mexico');
    });

    it('handles multiple accents in sequence', () => {
      expect(normalize('àáâãäå')).toBe('aaaaaa');
      expect(normalize('èéêë')).toBe('eeee');
    });

    it('handles empty string', () => {
      expect(normalize('')).toBe('');
    });

    it('handles strings with numbers', () => {
      expect(normalize('Test123')).toBe('test123');
      expect(normalize('Café123')).toBe('cafe123');
    });

    it('handles special characters', () => {
      expect(normalize('café@123')).toBe('cafe@123');
      expect(normalize('Hello-World')).toBe('hello-world');
    });

    it('handles combined accent cases', () => {
      expect(normalize('Ñoño')).toBe('nono');
      expect(normalize('Côte d\'Ivoire')).toBe('cote d\'ivoire');
    });
  });

  describe('findCountryCode', () => {
    const mockCountries = [
      { name: 'Peru', code: 'PE', phoneCode: '+51' },
      { name: 'Mexico', code: 'MX', phoneCode: '+52' },
      { name: 'Colombia', code: 'CO', phoneCode: '+57' },
      { name: 'España', code: 'ES', phoneCode: '+34' },
      { name: 'Argentina', code: 'AR', phoneCode: '+54' },
    ];

    it('returns fallback when countryCandidate is undefined', () => {
      expect(findCountryCode(mockCountries, undefined)).toBe('PE');
      expect(findCountryCode(mockCountries, undefined, 'MX')).toBe('MX');
    });

    it('returns fallback when countryCandidate is empty string', () => {
      expect(findCountryCode(mockCountries, '')).toBe('PE');
    });

    it('finds country by exact code match', () => {
      expect(findCountryCode(mockCountries, 'PE')).toBe('PE');
      expect(findCountryCode(mockCountries, 'MX')).toBe('MX');
      expect(findCountryCode(mockCountries, 'CO')).toBe('CO');
    });

    it('finds country by fuzzy name match (normalized)', () => {
      expect(findCountryCode(mockCountries, 'Peru')).toBe('PE');
      expect(findCountryCode(mockCountries, 'peru')).toBe('PE');
      expect(findCountryCode(mockCountries, 'PERU')).toBe('PE');
      expect(findCountryCode(mockCountries, 'Mexico')).toBe('MX');
    });

    it('finds country by fuzzy name match with accents', () => {
      expect(findCountryCode(mockCountries, 'España')).toBe('ES');
      expect(findCountryCode(mockCountries, 'Espana')).toBe('ES');
      expect(findCountryCode(mockCountries, 'espana')).toBe('ES');
      expect(findCountryCode(mockCountries, 'ESPAÑA')).toBe('ES');
    });

    it('returns fallback when no match is found', () => {
      expect(findCountryCode(mockCountries, 'NonExistent')).toBe('PE');
      expect(findCountryCode(mockCountries, 'XYZ')).toBe('PE');
      expect(findCountryCode(mockCountries, 'NonExistent', 'MX')).toBe('MX');
    });

    it('prefers exact code match over name match', () => {
      // If we have a country with code that matches a name, prefer code match
      const countries = [
        { name: 'Country A', code: 'PE', phoneCode: '+51' },
        { name: 'PE', code: 'XX', phoneCode: '+1' },
      ];
      expect(findCountryCode(countries, 'PE')).toBe('PE');
    });

    it('handles empty country list', () => {
      expect(findCountryCode([], 'PE')).toBe('PE');
      expect(findCountryCode([], 'Peru', 'MX')).toBe('MX');
    });

    it('handles case-insensitive fuzzy matching', () => {
      const countries = [
        { name: 'United States', code: 'US', phoneCode: '+1' },
        { name: 'United Kingdom', code: 'GB', phoneCode: '+44' },
      ];
      expect(findCountryCode(countries, 'united states')).toBe('US');
      expect(findCountryCode(countries, 'UNITED STATES')).toBe('US');
      expect(findCountryCode(countries, 'United States')).toBe('US');
    });

    it('handles complex country names with special characters', () => {
      const countries = [
        { name: 'Côte d\'Ivoire', code: 'CI', phoneCode: '+225' },
        { name: 'Réunion', code: 'RE', phoneCode: '+262' },
      ];
      expect(findCountryCode(countries, 'Cote d\'Ivoire')).toBe('CI');
      expect(findCountryCode(countries, 'Reunion')).toBe('RE');
      expect(findCountryCode(countries, 'REUNION')).toBe('RE');
    });
  });
});
