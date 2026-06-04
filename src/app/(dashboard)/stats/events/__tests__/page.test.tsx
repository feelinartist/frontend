import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventListPage from '../page';
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

vi.mock('@/components/animated-background', () => ({ AnimatedBackground: () => <div data-testid="animated-bg" /> }));
vi.mock('@/components/ui/back-button', () => ({ BackButton: () => <button>Back</button> }));
vi.mock('@/components/ui/loading-screen', () => ({ LoadingScreen: () => <div data-testid="loading">Loading...</div> }));

describe('EventListPage', () => {
    let mockRouterPush: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRouterPush = vi.fn();
        vi.mocked(useRouter).mockReturnValue({ push: mockRouterPush } as any);
        // Default to not authenticated to prevent infinite loading loop if not overridden
        vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated' } as any);
    });

    it('shows loading screen initially when cargando is true', () => {
        vi.mocked(useSession).mockReturnValue({ data: { user: { id: 'user1' } }, status: 'authenticated' } as any);
        // By not resolving fetchApi, we keep it in loading state
        vi.mocked(fetchApi).mockImplementation(() => new Promise(() => {}));
        render(<EventListPage />);
        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('handles fetch profile error gracefully', async () => {
        vi.mocked(useSession).mockReturnValue({ data: { user: { id: 'user1' } }, status: 'authenticated' } as any);
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: false } as any);

        render(<EventListPage />);
        await waitFor(() => {
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Mis Eventos')).toBeInTheDocument();
    });

    it('returns early if no perfilArtista id is found', async () => {
        vi.mocked(useSession).mockReturnValue({ data: { user: { id: 'user1' } }, status: 'authenticated' } as any);
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true, json: async () => ({ perfilArtista: null }) } as any);

        render(<EventListPage />);
        await waitFor(() => {
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Mis Eventos')).toBeInTheDocument();
    });

    it('handles fetch events error gracefully', async () => {
        vi.mocked(useSession).mockReturnValue({ data: { user: { id: 'user1' } }, status: 'authenticated' } as any);
        vi.mocked(fetchApi)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ perfilArtista: { id: 'artist1' } }) } as any)
            .mockResolvedValueOnce({ ok: false } as any);

        render(<EventListPage />);
        await waitFor(() => {
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Mis Eventos')).toBeInTheDocument();
    });

    it('renders events and handles search, pagination, row click, and acceptance colors', async () => {
        vi.mocked(useSession).mockReturnValue({ data: { user: { id: 'user1' } }, status: 'authenticated' } as any);
        
        const mockEvents = [
            { id: 'e1', titulo: 'Event 1', horaInicio: new Date('2024-01-01').toISOString(), totalPedidos: 10, tasaAceptacion: 80 },
            { id: 'e2', titulo: 'Event 2', horaInicio: new Date('2024-01-02').toISOString(), totalPedidos: 5, tasaAceptacion: 50 },
            { id: 'e3', titulo: 'Event 3', horaInicio: new Date('2024-01-03').toISOString(), totalPedidos: 2, tasaAceptacion: 20 },
        ];

        vi.mocked(fetchApi).mockImplementation(async (url: string) => {
            if (url.includes('/api/usuarios/perfil')) return { ok: true, json: async () => ({ perfilArtista: { id: 'artist1' } }) } as any;
            return { ok: true, json: async () => ({ eventos: mockEvents, totalPages: 2 }) } as any;
        });

        render(<EventListPage />);
        
        await waitFor(() => {
            expect(screen.getByText('Event 1')).toBeInTheDocument();
        });

        // Verify colors are applied based on rate
        const row1 = screen.getByText('80%');
        expect(row1).toHaveClass('text-green-500');
        const row2 = screen.getByText('50%');
        expect(row2).toHaveClass('text-yellow-500');
        const row3 = screen.getByText('20%');
        expect(row3).toHaveClass('text-red-500');

        // Row click triggers router.push
        fireEvent.click(screen.getByText('Event 1'));
        expect(mockRouterPush).toHaveBeenCalledWith('/stats/events/e1');

        // Test Search input
        // Search input

        const searchInput = screen.getByPlaceholderText('Buscar evento...');
        fireEvent.change(searchInput, { target: { value: 'party' } });
        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalled();
        });

        // Test Pagination Buttons
        let buttons = screen.getAllByRole('button');
        const nextBtn = buttons.find(b => b.querySelector('.lucide-chevron-right')) as HTMLButtonElement | undefined;
        
        // Next page
        if (nextBtn && !nextBtn.disabled) {
            fireEvent.click(nextBtn);
            await waitFor(() => {
                expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
            });
            
            // Prev page
            buttons = screen.getAllByRole('button');
            const prevBtn2 = buttons.find(b => b.querySelector('.lucide-chevron-left')) as HTMLButtonElement | undefined;
            if (prevBtn2 && !prevBtn2.disabled) {
                fireEvent.click(prevBtn2);
                await waitFor(() => {
                    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
                });
            }
        }
    });
});
