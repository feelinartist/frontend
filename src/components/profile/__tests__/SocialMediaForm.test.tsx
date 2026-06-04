import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SocialMediaForm } from '@/components/profile/SocialMediaForm';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';
import { useConfigList } from '@/lib/useConfigList';

vi.mock('@/lib/api', () => ({
    fetchApi: vi.fn(),
    parseJsonSafe: vi.fn((res) => res.json().catch(() => null))
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

vi.mock('@/lib/useConfigList', () => ({
    useConfigList: vi.fn()
}));

vi.mock('@/lib/use-loading-state', () => ({
    useLoadingState: (onChange: any) => {
        const [loading, setLoading] = React.useState(false);
        React.useEffect(() => { onChange?.(loading) }, [loading]);
        return [loading, setLoading];
    }
}));

vi.mock('@/components/profile/ProfileFormWrapper', () => ({
    ProfileFormWrapper: ({ children, onSubmit }: any) => <form onSubmit={onSubmit} data-testid="form-wrapper">{children}</form>
}));

describe('SocialMediaForm', () => {
    const mockOnSave = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty state when no networks available', () => {
        vi.mocked(useConfigList).mockReturnValue({ data: [] } as any);
        render(<SocialMediaForm redesSociales={[]} usuarioId="u1" onSave={mockOnSave} />);
        expect(screen.getByText('Cargando redes sociales...')).toBeInTheDocument();
    });

    it('renders networks and placeholders correctly based on names', () => {
        vi.mocked(useConfigList).mockReturnValue({ data: [
            { id: '1', nombre: 'Facebook', urlBase: 'https://facebook.com/' },
            { id: '2', nombre: 'Instagram', icono: 'http://icon.png' },
            { id: '3', nombre: 'Twitter' },
            { id: '4', nombre: 'TikTok' },
            { id: '5', nombre: 'YouTube' },
            { id: '6', nombre: 'SoundCloud' },
            { id: '7', nombre: 'Kick' },
            { id: '8', nombre: 'Other' },
            { id: '9', nombre: 'Instagram' }, // without icon URL to trigger L112
            { id: '10', nombre: 'WhatsApp' }, // to trigger L116
            { id: '11', nombre: 'Twitch' },
            { id: '12', nombre: 'OtherNet', icono: 'whatsapp' },
            { id: '13', nombre: 'X' },
        ] } as any);

        render(<SocialMediaForm redesSociales={[]} usuarioId="u1" onSave={mockOnSave} />);
        
        expect(screen.getByPlaceholderText('tu.nombre')).toBeInTheDocument(); // Facebook
        expect(screen.getAllByPlaceholderText('tuusuario').length).toBeGreaterThan(0); // Several
        expect(screen.getAllByPlaceholderText('tucanal').length).toBeGreaterThan(0); // Youtube/Kick/Twitch
    });

    it('populates fields with existing networks', () => {
        vi.mocked(useConfigList).mockReturnValue({ data: [
            { id: '1', nombre: 'Facebook', urlBase: 'https://facebook.com/' },
        ] } as any);

        const existing = [{ id: 'rs1', redSocialId: '1', nombreUsuario: 'myuser', redSocial: { id: '1', nombre: 'Facebook', icono: '', urlBase: '' } }];
        
        render(<SocialMediaForm redesSociales={existing} usuarioId="u1" onSave={mockOnSave} />);
        
        const input = screen.getByDisplayValue('myuser');
        expect(input).toBeInTheDocument();
        
        // Test handle change
        fireEvent.change(input, { target: { value: 'newuser' } });
        expect(screen.getByDisplayValue('newuser')).toBeInTheDocument();
    });

    it('submits correctly', async () => {
        vi.mocked(useConfigList).mockReturnValue({ data: [
            { id: '1', nombre: 'Facebook' },
        ] } as any);
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true } as any);

        render(<SocialMediaForm redesSociales={[]} usuarioId="u1" onSave={mockOnSave} />);
        
        const input = screen.getByPlaceholderText('tu.nombre');
        fireEvent.change(input, { target: { value: 'user' } });
        
        fireEvent.submit(screen.getByTestId('form-wrapper'));
        
        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/perfil', expect.objectContaining({
                method: 'PATCH',
                body: JSON.stringify({
                    usuarioId: 'u1',
                    redesSociales: [{ redSocialId: '1', nombreUsuario: 'user' }]
                })
            }));
            expect(toast.success).toHaveBeenCalledWith('Redes sociales actualizadas correctamente');
            expect(mockOnSave).toHaveBeenCalled();
        });
    });

    it('handles submission error from api', async () => {
        vi.mocked(useConfigList).mockReturnValue({ data: [
            { id: '1', nombre: 'Facebook' },
        ] } as any);
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Bad request' }) } as any);

        render(<SocialMediaForm redesSociales={[]} usuarioId="u1" onSave={mockOnSave} />);
        
        const input = screen.getByPlaceholderText('tu.nombre');
        fireEvent.change(input, { target: { value: 'user' } });
        
        fireEvent.submit(screen.getByTestId('form-wrapper'));
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Bad request');
        });
    });

    it('handles api failure without message', async () => {
        vi.mocked(useConfigList).mockReturnValue({ data: [
            { id: '1', nombre: 'Facebook' },
        ] } as any);
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: false, json: async () => ({}) } as any);

        render(<SocialMediaForm redesSociales={[]} usuarioId="u1" onSave={mockOnSave} />);
        
        const input = screen.getByPlaceholderText('tu.nombre');
        fireEvent.change(input, { target: { value: 'user' } });
        
        fireEvent.submit(screen.getByTestId('form-wrapper'));
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Error al guardar');
        });
    });

    it('handles unexpected network error', async () => {
        vi.mocked(useConfigList).mockReturnValue({ data: [
            { id: '1', nombre: 'Facebook' },
        ] } as any);
        vi.mocked(fetchApi).mockRejectedValueOnce(new Error('Network error'));

        render(<SocialMediaForm redesSociales={[]} usuarioId="u1" onSave={mockOnSave} />);
        
        const input = screen.getByPlaceholderText('tu.nombre');
        fireEvent.change(input, { target: { value: 'user' } });
        
        fireEvent.submit(screen.getByTestId('form-wrapper'));
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Network error');
        });
    });

    it('handles fallback error for non-Error exceptions', async () => {
        vi.mocked(useConfigList).mockReturnValue({ data: [
            { id: '1', nombre: 'Facebook' },
        ] } as any);
        vi.mocked(fetchApi).mockRejectedValueOnce('String error');

        render(<SocialMediaForm redesSociales={[]} usuarioId="u1" onSave={mockOnSave} />);
        
        const input = screen.getByPlaceholderText('tu.nombre');
        fireEvent.change(input, { target: { value: 'user' } });
        
        fireEvent.submit(screen.getByTestId('form-wrapper'));
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Error al actualizar redes sociales');
        });
    });

    it('handles undefined available networks and other placeholders', () => {
        vi.mocked(useConfigList).mockReturnValue({ data: undefined } as any);
        render(<SocialMediaForm redesSociales={[]} usuarioId="u1" onSave={mockOnSave} />);
        expect(screen.getByText('Cargando redes sociales...')).toBeInTheDocument();
    });

    it('handles twitch and other placeholders and empty existing username', () => {
        vi.mocked(useConfigList).mockReturnValue({ data: [
            { id: '1', nombre: 'Twitch' },
        ] } as any);
        const existing = [{ id: 'rs1', redSocialId: '1', nombreUsuario: undefined, redSocial: { id: '1', nombre: 'Twitch', icono: '', urlBase: '' } }];
        render(<SocialMediaForm redesSociales={existing as any} usuarioId="u1" onSave={mockOnSave} />);
        expect(screen.getByPlaceholderText('tucanal')).toBeInTheDocument();
    });

    it('populates fields with existing networks using redSocialId fallback', () => {
        vi.mocked(useConfigList).mockReturnValue({ data: [
            { id: '1', nombre: 'Facebook', urlBase: 'https://facebook.com/' },
        ] } as any);

        const existing = [{ id: 'rs1', redSocialId: '1', nombreUsuario: 'myuser' }];
        
        render(<SocialMediaForm redesSociales={existing as any} usuarioId="u1" onSave={mockOnSave} />);
        
        const input = screen.getByDisplayValue('myuser');
        expect(input).toBeInTheDocument();
    });
});
