import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CountrySelect } from '../country-select';

describe('CountrySelect Component', () => {
    it('renders with default value and triggers onChange on item click', () => {
        const onValueChange = vi.fn();
        render(<CountrySelect value="PE" onValueChange={onValueChange} />);

        const select = screen.getByTestId('mock-select');
        expect(select).toBeInTheDocument();
        expect(select.getAttribute('data-value')).toBe('PE');

        const itemUS = screen.getByTestId('mock-select-item-US');
        expect(itemUS).toBeInTheDocument();
        
        fireEvent.click(itemUS);
        expect(onValueChange).toHaveBeenCalledWith('US');
    });

    it('passes className and custom placeholder to select trigger/value', () => {
        const onValueChange = vi.fn();
        render(
            <CountrySelect
                value="PE"
                onValueChange={onValueChange}
                placeholder="Custom Placeholder"
                className="custom-class"
            />
        );

        expect(screen.getByTestId('mock-select-trigger')).toHaveClass('custom-class');
        expect(screen.getByTestId('mock-select-value')).toHaveTextContent('Custom Placeholder');
    });
});
