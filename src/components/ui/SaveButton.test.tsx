import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { SaveButton } from './SaveButton';

describe('SaveButton', () => {
  it('renders default text when no children provided', () => {
    render(<SaveButton />);
    expect(screen.getByRole('button')).toHaveTextContent('Guardar Cambios');
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('renders custom children', () => {
    render(<SaveButton>Enviar</SaveButton>);
    expect(screen.getByRole('button')).toHaveTextContent('Enviar');
  });

  it('shows loading state when isLoading is true', () => {
    render(<SaveButton isLoading={true} />);
    expect(screen.getByRole('button')).toHaveTextContent('Guardando cambios...');
  });

  it('applies disabled prop to button', () => {
    render(<SaveButton disabled={true}>No</SaveButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
