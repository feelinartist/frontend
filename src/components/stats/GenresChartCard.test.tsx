import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GenresChartCard } from './GenresChartCard';

const sample = [
  { genero: 'Rock', conteo: 10, porcentaje: 50 },
  { genero: 'Pop', conteo: 5, porcentaje: 25 },
];

describe('GenresChartCard', () => {
  it('renders title and empty state when no data', () => {
    render(<GenresChartCard generosPorConteo={[]} />);
    expect(screen.getByText(/Géneros Más Pedidos/i)).toBeInTheDocument();
    expect(screen.getByText(/No hay datos de géneros disponibles/i)).toBeInTheDocument();
  });

  it('renders chart when data provided', () => {
    const { container } = render(<GenresChartCard generosPorConteo={sample} />);
    expect(screen.getByText(/Géneros Más Pedidos/i)).toBeInTheDocument();
    // Recharts renders an internal responsive container; assert it's present and not the empty state
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy();
    expect(screen.queryByText(/No hay datos de géneros disponibles/i)).not.toBeInTheDocument();
  });
});
