import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PaginaAdmin from '../page';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('@/components/ui/loading-screen', () => ({
  LoadingScreen: () => <div data-testid="loading-screen">Cargando...</div>,
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('PaginaAdmin Component', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it('renders loading screen when status is loading', () => {
    (useSession as any).mockReturnValue({ status: 'loading' });
    render(<PaginaAdmin />);
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });

  it('redirects to /home if not authenticated', () => {
    (useSession as any).mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<PaginaAdmin />);
    expect(mockPush).toHaveBeenCalledWith('/home');
  });

  it('redirects to /home if user is not ADMIN or SUPER_ADMIN', () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: 'USER' } },
      status: 'authenticated',
    });
    render(<PaginaAdmin />);
    expect(mockPush).toHaveBeenCalledWith('/home');
  });

  it('renders admin sections for ADMIN', () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: 'ADMIN' } },
      status: 'authenticated',
    });
    render(<PaginaAdmin />);
    expect(screen.getByText('Configuración del Sistema')).toBeInTheDocument();
    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
  });

  it('renders admin sections for SUPER_ADMIN', () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: 'SUPER_ADMIN' } },
      status: 'authenticated',
    });
    render(<PaginaAdmin />);
    expect(screen.getByText('Configuración de Redes')).toBeInTheDocument();
  });
});
