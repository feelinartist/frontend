import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimezoneSelect } from '../timezone-select';

// Mock @/lib/form-helpers
vi.mock('@/lib/form-helpers', () => ({
    formatTimezoneLabel: (tz: string) => tz.replace('_', ' '),
}));

describe('TimezoneSelect Component', () => {
    it('renders with default value and triggers onChange on item click', () => {
        const onValueChange = vi.fn();
        render(<TimezoneSelect value="America/Lima" onValueChange={onValueChange} />);

        const select = screen.getByTestId('mock-select');
        expect(select).toBeInTheDocument();
        expect(select.getAttribute('data-value')).toBe('America/Lima');

                const itemBogota = screen.getByTestId('mock-select-item-America/Bogota');
        expect(itemBogota).toBeInTheDocument();

        fireEvent.click(itemBogota);
        expect(onValueChange).toHaveBeenCalledWith('America/Bogota');
    });

    it('passes className and custom placeholder to select trigger/value', () => {
        const onValueChange = vi.fn();
        render(
            <TimezoneSelect
                value="America/Lima"
                onValueChange={onValueChange}
                placeholder="Custom Placeholder"
                className="custom-class"
            />
        );

        expect(screen.getByTestId('mock-select-trigger')).toHaveClass('custom-class');
        expect(screen.getByTestId('mock-select-value')).toHaveTextContent('Custom Placeholder');
    });
});
