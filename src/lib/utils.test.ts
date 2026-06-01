import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
    describe('cn', () => {
        it('merges class names correctly', () => {
            expect(cn('class1', 'class2')).toBe('class1 class2');
        });

        it('handles tailwind overrides', () => {
            expect(cn('p-2', 'p-4')).toBe('p-4');
        });

        it('handles conditional classes', () => {
            expect(cn('base', true && 'active', false && 'inactive')).toBe('base active');
        });
    });
});
