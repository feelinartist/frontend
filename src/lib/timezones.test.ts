import { describe, it, expect } from 'vitest';
import { timezones } from './timezones';

describe('timezones', () => {
    it('should export a list of timezones', () => {
        expect(Array.isArray(timezones)).toBe(true);
        expect(timezones.length).toBeGreaterThan(0);
        expect(timezones).toContain("America/Lima");
    });
});
