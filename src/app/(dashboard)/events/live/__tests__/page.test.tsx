import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LiveRequestsPage from '../page';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  fetchApi: vi.fn(),
}));

vi.mock('@/components/dashboard/LiveRequestsFeed', () => ({
  LiveRequestsFeed: () => <div data-testid="live-requests-feed">Feed Mock</div>
}));

vi.mock('@/components/ui/loading-screen', () => ({
  LoadingScreen: () => <div data-testid="loading-screen">Loading...</div>
}));

vi.mock('@/components/ui/back-button', () => ({
  BackButton: () => <div data-testid="back-button">Back</div>
}));

vi.mock('@/components/animated-background', () => ({
  AnimatedBackground: () => <div data-testid="animated-bg">BG</div>
}));

describe('LiveRequestsPage Component', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it('renders loading screen initially', () => {
    (useSession as any).mockReturnValue({ status: 'loading' });
    render(<LiveRequestsPage />);
    expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
  });

  it('redirects to /login if unauthenticated', async () => {
    (useSession as any).mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<LiveRequestsPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects to /home if not ARTISTA', async () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: 'USER' } },
      status: 'authenticated',
    });
    render(<LiveRequestsPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/home');
    });
  });

  it('redirects to /events if fetch throws an error', async () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: 'ARTISTA', id: '1' } },
      status: 'authenticated',
    });
    (fetchApi as any).mockRejectedValueOnce(new Error('Network Fail'));

    await act(async () => {
      render(<LiveRequestsPage />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/events');
    });
  });

  it('redirects to /events if no active event is found', async () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: 'ARTISTA', id: '1' } },
      status: 'authenticated',
    });
    (fetchApi as any).mockResolvedValueOnce({ ok: true, json: async () => null });

    await act(async () => {
      render(<LiveRequestsPage />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/events');
    });
  });

  it('redirects to /events if fetch returns not ok', async () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: 'ARTISTA', id: '1' } },
      status: 'authenticated',
    });
    (fetchApi as any).mockResolvedValueOnce({ ok: false });

    await act(async () => {
      render(<LiveRequestsPage />);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/events');
    });
  });

  it('renders LiveRequestsFeed if active event is found', async () => {
    (useSession as any).mockReturnValue({
      data: { user: { rol: 'ARTISTA', id: '1' } },
      status: 'authenticated',
    });
    (fetchApi as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'evt-1', titulo: 'Concierto' }),
    });

    await act(async () => {
      render(<LiveRequestsPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('live-requests-feed')).toBeInTheDocument();
      expect(screen.getByText('Concierto')).toBeInTheDocument();
    });
  });
});
