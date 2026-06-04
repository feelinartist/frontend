import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileCompletionChecklist } from '@/components/ProfileCompletionChecklist';
import { fetchApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
    fetchApi: vi.fn(),
}));

const mockReload = vi.fn();
Object.defineProperty(globalThis, 'location', {
    value: { href: '', reload: mockReload },
    writable: true,
});

global.fetch = vi.fn() as any;

describe('ProfileCompletionChecklist', () => {
    const defaultPerfil = {
        biografia: '',
        categoria: '',
        galeria: [],
        redesSociales: [],
        metodosDonacion: [],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as any).mockResolvedValue({
            json: async () => ({ user: { id: 'u1' } })
        });
        vi.mocked(fetchApi).mockResolvedValue({ ok: true, json: async () => ({}) } as any);
    });

    it('renders checklist items correctly', () => {
        render(<ProfileCompletionChecklist perfilArtista={defaultPerfil} onDismiss={vi.fn()} />);
        expect(screen.getByText('Información básica')).toBeInTheDocument();
        expect(screen.getByText('Galería de imágenes')).toBeInTheDocument();
        expect(screen.getByText('Redes sociales')).toBeInTheDocument();
        expect(screen.getByText('Métodos de donación')).toBeInTheDocument();
        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('navigates when items are clicked', () => {
        render(<ProfileCompletionChecklist perfilArtista={defaultPerfil} onDismiss={vi.fn()} />);
        fireEvent.click(screen.getByText('Información básica'));
        expect(globalThis.location.href).toBe('/profile?tab=personal');

        fireEvent.click(screen.getByText('Galería de imágenes'));
        expect(globalThis.location.href).toBe('/profile?tab=gallery');
        
        fireEvent.click(screen.getByText('Redes sociales'));
        expect(globalThis.location.href).toBe('/profile?tab=social');

        fireEvent.click(screen.getByText('Métodos de donación'));
        expect(globalThis.location.href).toBe('/profile?tab=donation');
    });

    it('resets completion acknowledgment if progress < 100', async () => {
        render(<ProfileCompletionChecklist perfilArtista={defaultPerfil} onDismiss={vi.fn()} />);
        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/marcar-perfil-completado', expect.any(Object));
        });
    });

    it('handles reset completion error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(fetchApi).mockRejectedValueOnce(new Error('Network error'));
        render(<ProfileCompletionChecklist perfilArtista={defaultPerfil} onDismiss={vi.fn()} />);
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Error resetting completion acknowledgment:', expect.any(Error));
        });
        consoleSpy.mockRestore();
    });
    
    it('handles reset completion empty session gracefully', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            json: async () => ({ user: null })
        });
        render(<ProfileCompletionChecklist perfilArtista={defaultPerfil} onDismiss={vi.fn()} />);
        await waitFor(() => {
            expect(fetchApi).not.toHaveBeenCalled();
        });
    });

    it('shows 100% and allows completion when all filled', async () => {
        const completePerfil = {
            biografia: 'bio',
            categoria: 'cat',
            galeria: [{}],
            redesSociales: [{}],
            metodosDonacion: [{}],
        };
        const mockDismiss = vi.fn();

        render(<ProfileCompletionChecklist perfilArtista={completePerfil} onDismiss={mockDismiss} />);
        
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('¡Perfil completo! 🎉')).toBeInTheDocument();
        
        const completeBtn = screen.getByText('¡Entendido!');
        fireEvent.click(completeBtn);
        
        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/marcar-perfil-completado', expect.objectContaining({
                body: JSON.stringify({ usuarioId: 'u1' })
            }));
            expect(mockReload).toHaveBeenCalled();
        });
    });

    it('handles complete profile failure', async () => {
        const completePerfil = { biografia: 'bio', categoria: 'cat', galeria: [{}], redesSociales: [{}], metodosDonacion: [{}] };
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'error' } as any);
        const mockDismiss = vi.fn();

        render(<ProfileCompletionChecklist perfilArtista={completePerfil} onDismiss={mockDismiss} />);
        
        fireEvent.click(screen.getByText('¡Entendido!'));
        
        await waitFor(() => {
            expect(mockDismiss).toHaveBeenCalled();
        });
    });

    it('handles complete profile network error', async () => {
        const completePerfil = { biografia: 'bio', categoria: 'cat', galeria: [{}], redesSociales: [{}], metodosDonacion: [{}] };
        vi.mocked(fetchApi).mockRejectedValueOnce(new Error('Network'));
        const mockDismiss = vi.fn();

        render(<ProfileCompletionChecklist perfilArtista={completePerfil} onDismiss={mockDismiss} />);
        
        fireEvent.click(screen.getByText('¡Entendido!'));
        
        await waitFor(() => {
            expect(mockDismiss).toHaveBeenCalled();
        });
    });

    it('handles complete profile without session user id', async () => {
        const completePerfil = { biografia: 'bio', categoria: 'cat', galeria: [{}], redesSociales: [{}], metodosDonacion: [{}] };
        (global.fetch as any).mockResolvedValueOnce({
            json: async () => ({ user: null })
        });
        
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<ProfileCompletionChecklist perfilArtista={completePerfil} onDismiss={vi.fn()} />);
        
        fireEvent.click(screen.getByText('¡Entendido!'));
        
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('No session or user ID found');
        });
        consoleSpy.mockRestore();
    });

    it('calls onDismiss when close button clicked', () => {
        const mockDismiss = vi.fn();
        render(<ProfileCompletionChecklist perfilArtista={defaultPerfil} onDismiss={mockDismiss} />);
        const closeBtn = screen.getAllByRole('button')[0];
        fireEvent.click(closeBtn);
        expect(mockDismiss).toHaveBeenCalled();
    });
});
