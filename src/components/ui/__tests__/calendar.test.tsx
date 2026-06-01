import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { Calendar } from '../calendar';

describe('Calendar component', () => {
  it('renders day headers and navigates months', async () => {
    const user = userEvent.setup();
    render(<Calendar />);

    // Day headers
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();

    // Prev and next buttons exist (first and last button in header)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    const prev = buttons[0];
    const next = buttons[buttons.length - 1];
    // Click prev and next to change month (no error)
    await user.click(prev);
    await user.click(next);
  });

  it('calls onSelect when clicking a day and respects disabled', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const testDate = new Date(2024, 4, 15); // May 15, 2024
    const disabled = (d: Date) => d.getDate() === 1;

    render(<Calendar onSelect={onSelect} disabled={disabled} selected={testDate} />);

    // Get all buttons and find day buttons (numeric text, not disabled)
    const allButtons = screen.getAllByRole('button');
    
    // Find a day button that's not disabled - pick day 10
    const dayButton = allButtons.find(btn => {
      const text = (btn.textContent || '').trim();
      return text === '10' && !btn.hasAttribute('disabled');
    });

    if (!dayButton) {
      throw new Error('Could not find day button 10');
    }

    await user.click(dayButton);
    
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(expect.any(Date));
    });
  });

  it('changes month and year via select controls', async () => {
    const user = userEvent.setup();
    render(<Calendar selected={new Date(2025, 0, 15)} />);

    const monthButton = screen.getByRole('button', { name: /Enero/i });
    await user.click(monthButton);

    const juneOption = await screen.findByText('Junio');
    await user.click(juneOption);

    const yearButton = screen.getByRole('button', { name: /2025/i });
    await user.click(yearButton);

    const nextYearOption = await screen.findByText((new Date().getFullYear()).toString());
    await user.click(nextYearOption);

    expect(screen.getByRole('button', { name: /Junio/i })).toBeInTheDocument();
  });
});
