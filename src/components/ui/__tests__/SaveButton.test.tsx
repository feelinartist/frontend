import React from 'react';
import { render, screen } from '@testing-library/react';
import SaveButton from '../SaveButton';

describe('SaveButton', () => {
  it('shows loading state when isLoading is true', () => {
    render(<SaveButton isLoading>Test</SaveButton>);
    expect(screen.getByText(/Guardando cambios/i)).toBeInTheDocument();
  });

  it('shows children when not loading', () => {
    render(<SaveButton>Enviar</SaveButton>);
    expect(screen.getByText('Enviar')).toBeInTheDocument();
  });

  it('renders disabled state when disabled is true', () => {
    render(<SaveButton disabled>Enviar</SaveButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
