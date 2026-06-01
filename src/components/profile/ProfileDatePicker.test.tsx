import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ open, children }: any) => <div data-testid="popover" data-open={open}>{children}</div>,
  PopoverTrigger: ({ children }: any) => <>{children}</>,
  PopoverContent: ({ children }: any) => <div data-testid="popover-content">{children}</div>,
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ selected, onSelect, disabled }: any) => (
    <div>
      <div data-testid="calendar-selected">{selected ? 'selected' : 'none'}</div>
      <button data-testid="calendar-select" onClick={() => onSelect(new Date('2020-05-15T12:00:00.000Z'))}>
        Select Date
      </button>
      <div data-testid="calendar-disabled">{disabled(new Date('2030-01-01')) ? 'disabled' : 'enabled'}</div>
    </div>
  ),
}));

import { ProfileDatePicker } from './ProfileDatePicker';

describe('ProfileDatePicker', () => {
  it('renders label and placeholder when no date is provided', () => {
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();

    render(
      <ProfileDatePicker
        label="Fecha de inicio"
        date={undefined}
        open={false}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
        placeholder="Selecciona una fecha"
      />
    );

    expect(screen.getByText(/Fecha de inicio/i)).toBeInTheDocument();
    expect(screen.getByText(/Selecciona una fecha/i)).toBeInTheDocument();
    expect(screen.getByTestId('popover')).toBeInTheDocument();
  });

  it('renders formatted date and calls callbacks on select', () => {
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();
    const currentDate = new Date('2020-05-15T00:00:00.000Z');

    render(
      <ProfileDatePicker
        label="Fecha de inicio"
        date={currentDate}
        open={true}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
        placeholder="Selecciona una fecha"
      />
    );

    expect(screen.getByText(/14 de mayo de 2020/i)).toBeInTheDocument();
    expect(screen.getByTestId('popover-content')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-selected')).toHaveTextContent('selected');

    fireEvent.click(screen.getByTestId('calendar-select'));
    expect(onSelect).toHaveBeenCalledWith(new Date('2020-05-15T12:00:00.000Z'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
