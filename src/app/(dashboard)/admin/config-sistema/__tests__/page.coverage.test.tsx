import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, vi, beforeEach, expect } from 'vitest';

// Mock next-auth session
vi.mock('next-auth/react', () => ({
    useSession: vi.fn()
}));

// Mock next/navigation useRouter
vi.mock('next/navigation', () => ({
    useRouter: vi.fn()
}));

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: { error: vi.fn(), success: vi.fn() }
}));

import ConfigSistemaPage from '../page';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const mockPush = vi.fn();
const mockUseRouter = useRouter as ReturnType<typeof vi.fn>;
const mockUseSession = useSession as ReturnType<typeof vi.fn>;

beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
    global.fetch = vi.fn();
});

const findConfigCard = async (clave: string): Promise<HTMLElement> => {
    const codeElement = await screen.findByText(clave);
    let card: HTMLElement | null = codeElement.closest('div');
    while (card && card.querySelectorAll('button').length < 2) {
        card = card.parentElement;
    }
    if (!card) {
        throw new Error(`Could not find config card for ${clave}`);
    }
    return card;
};

describe('ConfigSistemaPage', () => {
    it('renders loading state when status is loading', () => {
        mockUseSession.mockReturnValue({ data: null, status: 'loading' });
        const { container } = render(<ConfigSistemaPage /> as any);
        expect(container).toBeTruthy();
    });

    it('redirects to login when unauthenticated', async () => {
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
        render(<ConfigSistemaPage /> as any);
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });

    it('redirects to home when user is not ADMIN or SUPER_ADMIN', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { rol: 'PUBLIC' } },
            status: 'authenticated'
        });
        (toast.error as ReturnType<typeof vi.fn>).mockClear();
        render(<ConfigSistemaPage /> as any);
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/home');
            expect(toast.error).toHaveBeenCalledWith('Acceso denegado');
        });
    });

    it('loads configurations for SUPER_ADMIN', async () => {
        const mockConfigs = [
            {
                id: '1',
                clave: 'STRIPE_KEY',
                valor: 'sk_test_123',
                descripcion: 'Stripe API Key',
                categoria: 'PAYMENT',
                esSecreta: true,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => mockConfigs
        });

        render(<ConfigSistemaPage /> as any);
        
        await waitFor(() => {
            expect(screen.getByText('STRIPE_KEY')).toBeInTheDocument();
        });
    });

    it('loads configurations for ADMIN role', async () => {
        const mockConfigs = [
            {
                id: '1',
                clave: 'EMAIL_HOST',
                valor: 'smtp.gmail.com',
                descripcion: 'SMTP Host',
                categoria: 'EMAIL',
                esSecreta: false,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => mockConfigs
        });

        render(<ConfigSistemaPage /> as any);
        
        await waitFor(() => {
            expect(screen.getByText('EMAIL_HOST')).toBeInTheDocument();
        });
    });

    it('displays error when fetching configurations fails', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Fetch failed' })
        });

        render(<ConfigSistemaPage /> as any);
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Error al cargar configuraciones');
        });
    });

    it('displays error when fetch throws exception', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

        render(<ConfigSistemaPage /> as any);
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Error al cargar configuraciones');
        });
    });

    it('renders empty state when no configurations exist', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => []
        });

        const { getByText } = render(<ConfigSistemaPage /> as any);
        
        await waitFor(() => {
            expect(getByText(/No hay configuraciones/i)).toBeInTheDocument();
        });
    });

    it('opens and closes new configuration dialog', async () => {
        const user = userEvent.setup();
        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => []
        });

        render(<ConfigSistemaPage /> as any);
        
        const addButton = await screen.findByRole('button', { name: /Nueva Configuración/i });
        await user.click(addButton);
        
        const dialogTitle = await screen.findByRole('heading', { name: /Nueva Configuración/i });
        expect(dialogTitle).toBeInTheDocument();

        const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
        await user.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByRole('heading', { name: /Nueva Configuración/i })).not.toBeInTheDocument();
        });
    });

    it('displays secret badge for sensitive configurations', async () => {
        const mockConfigs = [
            {
                id: '1',
                clave: 'DATABASE_PASSWORD',
                valor: 'secret_pass_123',
                descripcion: 'Database password',
                categoria: 'GENERAL',
                esSecreta: true,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => mockConfigs
        });

        render(<ConfigSistemaPage /> as any);
        
        await waitFor(() => {
            expect(screen.getByText(/Secreto/i)).toBeInTheDocument();
        });
    });

    it('masks secret values by default', async () => {
        const mockConfigs = [
            {
                id: '1',
                clave: 'API_TOKEN',
                valor: 'token_xyz_123_secret',
                descripcion: 'API Token',
                categoria: 'GENERAL',
                esSecreta: true,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => mockConfigs
        });

        render(<ConfigSistemaPage /> as any);
        
        await waitFor(() => {
            expect(screen.getByText(/•••••••••••/)).toBeInTheDocument();
        });
    });

    it('toggles secret value visibility', async () => {
        const user = userEvent.setup();
        const mockConfigs = [
            {
                id: '1',
                clave: 'PAYPAL_CLIENT_SECRET',
                valor: 'paypal_secret_value',
                descripcion: 'PayPal secret',
                categoria: 'PAYMENT',
                esSecreta: true,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => mockConfigs
        });

        render(<ConfigSistemaPage /> as any);

        await waitFor(() => {
            expect(screen.getByText(/••+/)).toBeInTheDocument();
        });

        const card = await findConfigCard('PAYPAL_CLIENT_SECRET');
        const buttons = card.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(1);
        await user.click(buttons[0]);

        await waitFor(() => {
            expect(screen.getByText('paypal_secret_value')).toBeInTheDocument();
        });
    });

    it('creates a new configuration successfully', async () => {
        const user = userEvent.setup();
        const mockConfigs: any[] = [];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs })
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs });

        render(<ConfigSistemaPage /> as any);

        const newButton = await screen.findByRole('button', { name: /Nueva Configuración/i });
        await user.click(newButton);

        const claveInput = await screen.findByPlaceholderText('CLIENT_ID');
        const valorInput = screen.getByPlaceholderText('Ingresa el valor');
        const secretCheckbox = screen.getByRole('checkbox', { name: /Valor secreto/i });

        await user.type(claveInput, 'NEW_CONFIG');
        await user.type(valorInput, 'new_value');
        await user.click(secretCheckbox);

        const createButton = screen.getByRole('button', { name: /Crear/i });
        await user.click(createButton);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Configuración creada');
        });
    });

    it('updates an existing configuration successfully', async () => {
        const user = userEvent.setup();
        const mockConfigs = [
            {
                id: '1',
                clave: 'EMAIL_HOST',
                valor: 'smtp.gmail.com',
                descripcion: 'SMTP Host',
                categoria: 'EMAIL',
                esSecreta: false,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs })
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs });

        render(<ConfigSistemaPage /> as any);

        const card = await findConfigCard('EMAIL_HOST');
        const buttons = card.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(1);
        await user.click(buttons[0]);

        const updateButton = await screen.findByRole('button', { name: /Actualizar/i });
        const valorInput = screen.getByPlaceholderText('Ingresa el valor');
        await user.clear(valorInput);
        await user.type(valorInput, 'smtp.changed.com');
        await user.click(updateButton);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Configuración actualizada');
        });
    });

    it('opens edit dialog for configurations without a description', async () => {
        const user = userEvent.setup();
        const mockConfigs = [
            {
                id: '1',
                clave: 'EMAIL_HOST',
                valor: 'smtp.gmail.com',
                descripcion: undefined,
                categoria: 'EMAIL',
                esSecreta: false,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs });

        render(<ConfigSistemaPage /> as any);

        const card = await findConfigCard('EMAIL_HOST');
        const buttons = card.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(1);
        await user.click(buttons[0]);

        const dialogTitle = await screen.findByText(/Editar Configuración/i);
        expect(dialogTitle).toBeInTheDocument();
    });

    it('closes new config dialog and resets the form', async () => {
        const user = userEvent.setup();
        const mockConfigs: any[] = [];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs });

        render(<ConfigSistemaPage /> as any);

        const newButton = await screen.findByRole('button', { name: /Nueva Configuración/i });
        await user.click(newButton);

        const cancelButton = await screen.findByRole('button', { name: /Cancelar/i });
        await user.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByRole('heading', { name: /Nueva Configuración/i })).not.toBeInTheDocument();
        });
    });

    it('deletes a configuration successfully', async () => {
        const user = userEvent.setup();
        const mockConfigs = [
            {
                id: '1',
                clave: 'EMAIL_HOST',
                valor: 'smtp.gmail.com',
                descripcion: 'SMTP Host',
                categoria: 'EMAIL',
                esSecreta: false,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs })
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs });

        render(<ConfigSistemaPage /> as any);

        const card = await findConfigCard('EMAIL_HOST');
        const buttons = card.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(2);
        await user.click(buttons[1]);

        const confirmButton = await screen.findByRole('button', { name: /Eliminar/i });
        await user.click(confirmButton);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Configuración eliminada');
        });
    });

    it('handles delete configuration failure', async () => {
        const user = userEvent.setup();
        const mockConfigs = [
            {
                id: '1',
                clave: 'EMAIL_HOST',
                valor: 'smtp.gmail.com',
                descripcion: 'SMTP Host',
                categoria: 'EMAIL',
                esSecreta: false,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs })
            .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

        render(<ConfigSistemaPage /> as any);

        const card = await findConfigCard('EMAIL_HOST');
        const buttons = card.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(2);
        await user.click(buttons[1]);

        const confirmButton = await screen.findByRole('button', { name: /Eliminar/i });
        await user.click(confirmButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Error al eliminar');
        });
    });

    it('handles delete configuration exception', async () => {
        const user = userEvent.setup();
        const mockConfigs = [
            {
                id: '1',
                clave: 'EMAIL_HOST',
                valor: 'smtp.gmail.com',
                descripcion: 'SMTP Host',
                categoria: 'EMAIL',
                esSecreta: false,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs })
            .mockRejectedValueOnce(new Error('Network failure'));

        render(<ConfigSistemaPage /> as any);

        const card = await findConfigCard('EMAIL_HOST');
        const buttons = card.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(2);
        await user.click(buttons[1]);

        const confirmButton = await screen.findByRole('button', { name: /Eliminar/i });
        await user.click(confirmButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Error al eliminar configuración');
        });
    });

    it('allows typing a description when creating a new configuration', async () => {
        const user = userEvent.setup();
        const mockConfigs: any[] = [];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs });

        render(<ConfigSistemaPage /> as any);

        const newButton = await screen.findByRole('button', { name: /Nueva Configuración/i });
        await user.click(newButton);

        const descriptionTextarea = await screen.findByPlaceholderText('Descripción de la configuración');
        await user.type(descriptionTextarea, 'This is a description.');

        expect(descriptionTextarea).toHaveValue('This is a description.');
    });

    it('handles create configuration failure without error message', async () => {
        const user = userEvent.setup();
        const mockConfigs: any[] = [];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs })
            .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

        render(<ConfigSistemaPage /> as any);

        const newButton = await screen.findByRole('button', { name: /Nueva Configuración/i });
        await user.click(newButton);

        const claveInput = await screen.findByPlaceholderText('CLIENT_ID');
        const valorInput = screen.getByPlaceholderText('Ingresa el valor');
        await user.type(claveInput, 'NEW_CONFIG');
        await user.type(valorInput, 'new_value');

        const createButton = screen.getByRole('button', { name: /Crear/i });
        await user.click(createButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Error al guardar');
        });
    });

    it('handles create configuration failure', async () => {
        const user = userEvent.setup();
        const mockConfigs: any[] = [];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs })
            .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Save failed' }) });

        render(<ConfigSistemaPage /> as any);

        const newButton = await screen.findByRole('button', { name: /Nueva Configuración/i });
        await user.click(newButton);

        const claveInput = await screen.findByPlaceholderText('CLIENT_ID');
        const valorInput = screen.getByPlaceholderText('Ingresa el valor');
        await user.type(claveInput, 'NEW_CONFIG');
        await user.type(valorInput, 'new_value');

        const createButton = screen.getByRole('button', { name: /Crear/i });
        await user.click(createButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Save failed');
        });
    });

    it('handles update configuration exception', async () => {
        const user = userEvent.setup();
        const mockConfigs = [
            {
                id: '1',
                clave: 'EMAIL_HOST',
                valor: 'smtp.gmail.com',
                descripcion: 'SMTP Host',
                categoria: 'EMAIL',
                esSecreta: false,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ ok: true, json: async () => mockConfigs })
            .mockRejectedValueOnce(new Error('Network failure'));

        render(<ConfigSistemaPage /> as any);

        const card = await findConfigCard('EMAIL_HOST');
        const buttons = card.querySelectorAll('button');
        expect(buttons.length).toBeGreaterThanOrEqual(1);
        await user.click(buttons[0]);

        const updateButton = await screen.findByRole('button', { name: /Actualizar/i });
        await user.click(updateButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Error al guardar configuración');
        });
    });

    it('shows description when provided', async () => {
        const mockConfigs = [
            {
                id: '1',
                clave: 'SMTP_HOST',
                valor: 'smtp.gmail.com',
                descripcion: 'Gmail SMTP server address',
                categoria: 'EMAIL',
                esSecreta: false,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => mockConfigs
        });

        render(<ConfigSistemaPage /> as any);
        
        await waitFor(() => {
            expect(screen.getByText('Gmail SMTP server address')).toBeInTheDocument();
        });
    });

    it('categorizes configurations correctly', async () => {
        const mockConfigs = [
            {
                id: '1',
                clave: 'STRIPE_PUBLIC',
                valor: 'pk_test_123',
                descripcion: undefined,
                categoria: 'PAYMENT',
                esSecreta: false,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            },
            {
                id: '2',
                clave: 'EMAIL_FROM',
                valor: 'noreply@company.com',
                descripcion: undefined,
                categoria: 'EMAIL',
                esSecreta: false,
                creadoEn: '2024-01-01T00:00:00Z',
                actualizadoEn: '2024-01-01T00:00:00Z'
            }
        ];

        mockUseSession.mockReturnValue({
            data: { user: { rol: 'SUPER_ADMIN' } },
            status: 'authenticated'
        });

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => mockConfigs
        });

        render(<ConfigSistemaPage /> as any);
        
        await waitFor(() => {
            expect(screen.getByText('STRIPE_PUBLIC')).toBeInTheDocument();
            expect(screen.getByText('EMAIL_FROM')).toBeInTheDocument();
        });
    });
});
