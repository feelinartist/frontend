import { describe, it, expect } from 'vitest';
import { getCountryByCode, getCountryByPhoneCode, getCountryByTimezone, countries } from '../countries';

describe('countries lib helpers', () => {
    it('getCountryByCode returns the correct country or undefined', () => {
        const pe = getCountryByCode('PE');
        expect(pe).toBeDefined();
        expect(pe?.name).toBe('Perú');

        const nonexistent = getCountryByCode('XX');
        expect(nonexistent).toBeUndefined();
    });

    it('getCountryByPhoneCode returns the correct country or undefined', () => {
        const pe = getCountryByPhoneCode('+51');
        expect(pe).toBeDefined();
        expect(pe?.code).toBe('PE');

        const nonexistent = getCountryByPhoneCode('+999');
        expect(nonexistent).toBeUndefined();
    });

    it('getCountryByTimezone returns the correct country or undefined', () => {
        const pe = getCountryByTimezone('America/Lima');
        expect(pe).toBeDefined();
        expect(pe?.code).toBe('PE');

        const nonexistent = getCountryByTimezone('Earth/UTC');
        expect(nonexistent).toBeUndefined();
    });

    it('countries list has valid properties', () => {
        expect(countries.length).toBeGreaterThan(0);
        const first = countries[0];
        expect(first).toHaveProperty('code');
        expect(first).toHaveProperty('name');
        expect(first).toHaveProperty('flag');
        expect(first).toHaveProperty('phoneCode');
        expect(first).toHaveProperty('timezone');
        expect(first).toHaveProperty('timezoneLabel');
    });
});
