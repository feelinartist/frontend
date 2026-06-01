import { describe, it, expect } from 'vitest';
import { formatTimezoneLabel, sanitizePhoneNumber, normalizeText } from '../form-helpers';

describe('form-helpers', () => {
    describe('formatTimezoneLabel', () => {
        it('should replace underscores with spaces', () => {
            expect(formatTimezoneLabel('America/New_York')).toBe('America/New York');
            expect(formatTimezoneLabel('Europe/Paris')).toBe('Europe/Paris');
        });
    });

    describe('sanitizePhoneNumber', () => {
        it('should remove all non-digit characters', () => {
            expect(sanitizePhoneNumber('+51 (999) 123-456')).toBe('51999123456');
            expect(sanitizePhoneNumber('123abc456')).toBe('123456');
        });
    });

    describe('normalizeText', () => {
        it('should convert text to lowercase and remove diacritics', () => {
            expect(normalizeText('Canción')).toBe('cancion');
            expect(normalizeText('Mëthöd')).toBe('method');
            expect(normalizeText('ÁÉÍÓÚáéíóú')).toBe('aeiouaeiou');
        });
    });
});
