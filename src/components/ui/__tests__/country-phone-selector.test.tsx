import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CountryPhoneSelector } from '../country-phone-selector';

describe('CountryPhoneSelector Component', () => {
    it('renders with default value and triggers onChange on item click', () => {
        const onValueChange = vi.fn();
        render(<CountryPhoneSelector value="+51" onValueChange={onValueChange} />);

        const select = screen.getByTestId('mock-select');
        expect(select).toBeInTheDocument();
        expect(select.getAttribute('data-value')).toBe('+51');

        const itemUS = screen.getByTestId('mock-select-item-+1');
        expect(itemUS).toBeInTheDocument();

        fireEvent.click(itemUS);
        expect(onValueChange).toHaveBeenCalledWith('+1');
    });

    it('renders alternative span when phone code does not match any country', () => {
        const onValueChange = vi.fn();
        render(<CountryPhoneSelector value="+999" onValueChange={onValueChange} />);

        expect(screen.getByText('+999')).toBeInTheDocument();
    });

    it('passes custom className to select trigger', () => {
        const onValueChange = vi.fn();
        render(<CountryPhoneSelector value="+51" onValueChange={onValueChange} className="custom-phone-class" />);

        expect(screen.getByTestId('mock-select-trigger')).toHaveClass('custom-phone-class');
    });
});
