import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Calendar } from '@/components/ui/calendar';

vi.mock('lucide-react', () => ({
    ChevronLeft: () => <svg data-testid="chevron-left" />,
    ChevronRight: () => <svg data-testid="chevron-right" />
}));

vi.mock('@/components/ui/select', () => ({
    Select: ({ value, onValueChange, children }: any) => {
        // Distinguish based on value length (year vs month) or just pass it through
        return (
            <select 
                data-testid={`select-${String(value).length === 4 ? 'year' : 'month'}`} 
                value={value} 
                onChange={(e) => onValueChange(e.target.value)}
            >
                {React.Children.toArray(children).find((c: any) => c.type.name === 'SelectContent')?.props.children}
            </select>
        );
    },
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

describe('Calendar Component', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2023, 5, 15)); // June 15, 2023
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders with current month if no selected date', () => {
        render(<Calendar />);
        const monthSelect = screen.getByTestId('select-month');
        expect(monthSelect).toHaveValue('5'); // June is index 5
        const yearSelect = screen.getByTestId('select-year');
        expect(yearSelect).toHaveValue('2023');
    });

    it('renders with selected date', () => {
        const date = new Date(2022, 0, 10); // Jan 10, 2022
        render(<Calendar selected={date} />);
        expect(screen.getByTestId('select-month')).toHaveValue('0');
        expect(screen.getByTestId('select-year')).toHaveValue('2022');
    });

    it('updates when selected date changes externally', () => {
        const { rerender } = render(<Calendar selected={new Date(2022, 0, 10)} />);
        rerender(<Calendar selected={new Date(2023, 2, 10)} />);
        expect(screen.getByTestId('select-month')).toHaveValue('2');
    });

    it('handles prev month click', () => {
        render(<Calendar />);
        const prevBtn = screen.getByTestId('chevron-left').closest('button');
        fireEvent.click(prevBtn!);
        expect(screen.getByTestId('select-month')).toHaveValue('4'); // May
    });

    it('handles next month click', () => {
        render(<Calendar />);
        const nextBtn = screen.getByTestId('chevron-right').closest('button');
        fireEvent.click(nextBtn!);
        expect(screen.getByTestId('select-month')).toHaveValue('6'); // July
    });

    it('handles month select change', () => {
        render(<Calendar />);
        const monthSelect = screen.getByTestId('select-month');
        fireEvent.change(monthSelect, { target: { value: '8' } }); // September
        expect(monthSelect).toHaveValue('8');
    });

    it('handles year select change', () => {
        render(<Calendar />);
        const yearSelect = screen.getByTestId('select-year');
        fireEvent.change(yearSelect, { target: { value: '2020' } });
        expect(yearSelect).toHaveValue('2020');
    });

    it('handles day click', () => {
        const mockOnSelect = vi.fn();
        render(<Calendar onSelect={mockOnSelect} />);
        
        // Find day 10
        const dayBtn = screen.getByText('10');
        fireEvent.click(dayBtn);
        
        expect(mockOnSelect).toHaveBeenCalledWith(new Date(2023, 5, 10));
    });

    it('renders selected day with proper classes', () => {
        const date = new Date(2023, 5, 15);
        render(<Calendar selected={date} />);
        const dayBtn = screen.getByText('15');
        expect(dayBtn).toHaveClass('bg-white');
    });

    it('renders disabled day correctly and prevents click', () => {
        const mockOnSelect = vi.fn();
        const isDisabled = (date: Date) => date.getDate() === 20;
        
        render(<Calendar onSelect={mockOnSelect} disabled={isDisabled} />);
        
        const dayBtn = screen.getByText('20');
        expect(dayBtn).toBeDisabled();
        
        fireEvent.click(dayBtn);
        expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('handles disabled function returning false', () => {
        const isDisabled = (date: Date) => false;
        render(<Calendar disabled={isDisabled} />);
        expect(screen.getByText('20')).not.toBeDisabled();
    });
});
