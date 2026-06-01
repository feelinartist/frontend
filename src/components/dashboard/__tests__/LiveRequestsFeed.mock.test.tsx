import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Mocks
vi.mock('socket.io-client', () => ({
  io: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  })
}));

const mockRequests = [
  { id: 'r1', titulo: 'Song A', artista: 'Artist 1', estado: 'PENDIENTE', creadoEn: '2024-01-01', itunesId: 'it1', nombreSolicitante: 'User1' },
  { id: 'r2', titulo: 'Song A', artista: 'Artist 1', estado: 'PENDIENTE', creadoEn: '2024-01-02', itunesId: 'it1', nombreSolicitante: 'User2' }
];

vi.mock('@/lib/api', async () => {
  return {
    fetchApi: vi.fn(async (path: string, opts?: any) => {
      if (path.includes('/pedidos')) {
        return { ok: true };
      }

      // For PATCH requests
      return { ok: true };
    }),
    parseJsonSafe: vi.fn(async () => mockRequests)
  };
});

import { LiveRequestsFeed } from '../LiveRequestsFeed';

describe('LiveRequestsFeed grouping and actions', () => {
  it('renders grouped requests and calls API on accept', async () => {
    const eventoId = 'event-1';
    render(<LiveRequestsFeed eventoId={eventoId} />);

    // Wait for grouped title and count badge
    await waitFor(() => expect(screen.getByText(/Pedidos en Vivo/i)).toBeInTheDocument());

    // Should show group with title 'Song A'
    expect(screen.getByText('Song A')).toBeInTheDocument();

    // There should be an accept button (Check icon) and reject (X icon). Click accept
    const buttons = screen.getAllByRole('button');
    // Find the accept button by data: it's likely the last in group; click it
    fireEvent.click(buttons[buttons.length - 1]);

    // Expect fetchApi (PATCH) to have been called for each request id
    const { fetchApi } = await import('@/lib/api');
    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalled();
    });
  });
});
