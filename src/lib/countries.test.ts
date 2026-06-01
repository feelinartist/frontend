import { describe, it, expect } from 'vitest';
import { getCountryByCode, getCountryByPhoneCode, getCountryByTimezone, countries } from './countries';

describe('countries lib', () => {
    it('should have a predefined list of countries', () => {
        expect(countries.length).toBeGreaterThan(0);
    });

    it('getCountryByCode returns country for valid code', () => {
        expect(getCountryByCode('PE')?.name).toBe('Perú');
    });

    it('getCountryByCode returns undefined for invalid code', () => {
        expect(getCountryByCode('XX')).toBeUndefined();
    });

    it('getCountryByPhoneCode returns country for valid code', () => {
        expect(getCountryByPhoneCode('+51')?.name).toBe('Perú');
    });

    it('getCountryByPhoneCode returns undefined for invalid code', () => {
        expect(getCountryByPhoneCode('+999')).toBeUndefined();
    });

    it('getCountryByTimezone returns country for valid timezone', () => {
        expect(getCountryByTimezone('America/Lima')?.name).toBe('Perú');
    });

    it('getCountryByTimezone returns undefined for invalid timezone', () => {
        expect(getCountryByTimezone('Mars/City')).toBeUndefined();
    });
});
