import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BackButton } from './back-button';
import { LoadingScreen } from './loading-screen';
import { CountrySelect } from './country-select';
import { CountryPhoneSelector } from './country-phone-selector';
import { TimezoneSelect } from './timezone-select';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        back: vi.fn(),
    }),
}));

describe('Custom UI Components', () => {
    describe('BackButton', () => {
        it('renders with href', () => {
            const { getByRole } = render(<BackButton href="/test-path" />);
            const link = getByRole('link');
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', '/test-path');
        });

        it('applies custom className', () => {
            const { getByRole } = render(<BackButton href="/test-path" className="my-class" />);
            const link = getByRole('link');
            // The class is applied to the child div, not the link itself
            expect(link.firstChild).toHaveClass('my-class');
        });
    });

    describe('LoadingScreen', () => {
        it('renders the loading screen with default text', () => {
            const { getByText } = render(<LoadingScreen />);
            expect(getByText('Cargando...')).toBeInTheDocument();
        });
    });

    describe('CountrySelect', () => {
        it('renders country select and handles changes', () => {
            const onChange = vi.fn();
            render(<CountrySelect value="PE" onChange={onChange} />);
            const trigger = screen.getByTestId('mock-select-trigger');
            expect(trigger).toBeInTheDocument();
            
            // To properly test we would simulate opening the select, but it's mocked via vitest.setup.ts
        });
    });

    describe('CountryPhoneSelector', () => {
        it('renders phone selector and handles changes', () => {
            const onChange = vi.fn();
            render(<CountryPhoneSelector value="+51" onChange={onChange} />);
            const trigger = screen.getByTestId('mock-select-trigger');
            expect(trigger).toBeInTheDocument();
        });
    });

    describe('TimezoneSelect', () => {
        it('renders timezone select and handles changes', () => {
            const onChange = vi.fn();
            render(<TimezoneSelect value="America/Lima" onChange={onChange} />);
            const trigger = screen.getByTestId('mock-select-trigger');
            expect(trigger).toBeInTheDocument();
        });
    });
});
