import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ username: 'missing-artist' }),
  useRouter: () => ({ push: mockPush })
}));
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: null }) }));
vi.mock('@/components/animated-background', () => ({ AnimatedBackground: () => <div data-testid="animated" /> }));
vi.mock('@/components/Navbar', () => ({ __esModule: true, default: () => <nav data-testid="navbar" /> }));
vi.mock('@/components/ui/loading-screen', () => ({ LoadingScreen: () => <div data-testid="loading" /> }));

import PaginaPerfilArtistaPublico from './page';

beforeEach(() => {
  mockPush.mockReset();
  // Mock fetch to return a 404 response
  global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
});

describe('Artist public page - not found flow', () => {
  it('shows not found content and navigates back when API returns 404', async () => {
    render(<PaginaPerfilArtistaPublico />);

    // Wait for the not-found UI to appear
    await waitFor(() => expect(screen.getByText(/Artista no encontrado/i)).toBeInTheDocument());

    // Ensure router.push was called (component attempts to navigate)
    expect(mockPush).toHaveBeenCalled();
  });
});
