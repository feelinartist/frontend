import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventsPage from '../page';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/components/dashboard/EventManager', () => ({
  EventManager: ({ onEventChange }: any) => {
    // We can simulate an active event by calling onEventChange if we want
    return <div data-testid="event-manager">Event Manager Mock</div>;
  }
}));

vi.mock('@/components/ui/loading-screen', () => ({
  LoadingScreen: () => <div data-testid="loading-screen">Loading...</div>
}));

describe('EventsPage Component', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it('renders loading screen when status is loading', () => {
    (useSession as any).mockReturnValue({ status: 'loading' });
    render(<EventsPage />);
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });

  it('redirects to /login if unauthenticated', () => {
    (useSession as any).mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<EventsPage />);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('redirects to /home if authenticated but not ARTISTA', () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: 'USER' } },
      status: 'authenticated',
    });
    render(<EventsPage />);
    expect(mockPush).toHaveBeenCalledWith('/home');
  });

  it('renders EventManager for ARTISTA', () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: 'ARTISTA' } },
      status: 'authenticated',
    });
    render(<EventsPage />);
    expect(screen.getByTestId('event-manager')).toBeInTheDocument();
  });
});
