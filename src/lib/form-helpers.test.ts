import { describe, it, expect } from 'vitest';
import { formatTimezoneLabel, sanitizePhoneNumber, normalizeText } from './form-helpers';

describe('form-helpers', () => {
    it('formatTimezoneLabel should replace underscores with spaces', () => {
        expect(formatTimezoneLabel('America/New_York')).toBe('America/New York');
    });

    it('sanitizePhoneNumber should remove non-digit characters', () => {
        expect(sanitizePhoneNumber('+51 987-654-321')).toBe('51987654321');
        expect(sanitizePhoneNumber('abc123xyz')).toBe('123');
    });

    it('normalizeText should lowercase, remove accents', () => {
        expect(normalizeText('México')).toBe('mexico');
        expect(normalizeText('PERÚ')).toBe('peru');
    });
});
