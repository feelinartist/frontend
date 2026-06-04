import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ArtistRegistrationPage from '../page';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

vi.mock('next-auth/react', () => ({
    useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
    fetchApi: vi.fn(),
    parseJsonSafe: vi.fn((res) => res.json()),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    }
}));

vi.mock('@/components/ui/loading-screen', () => ({ LoadingScreen: () => <div data-testid="loading">Loading...</div> }));
vi.mock('@/components/profile/RegistrationPageShell', () => ({ RegistrationPageShell: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/profile/ProfileFormWrapper', () => ({ 
    ProfileFormWrapper: ({ children, onSubmit }: any) => <form onSubmit={onSubmit} data-testid="form-wrapper">{children}</form> 
}));
vi.mock('@/components/profile/ArtistFormFields', () => ({
    ArtistFormFields: (props: any) => (
        <div data-testid="mock-artist-form-fields">
            <input data-testid="name-input" onChange={(e) => props.onNameChange(e.target.value)} />
            <input data-testid="username-input" onChange={(e) => props.onUsernameChange(e.target.value)} />
            <button type="button" onClick={() => props.onStatusChange(true)}>Verify</button>
            <button type="button" onClick={() => props.onStatusChange(false)}>Unverify</button>
            
            <button type="button" onClick={() => props.onDateOpenChange(true)}>onDateOpenChange</button>
            <button type="button" onClick={() => props.onDateSelect(new Date('2022-02-02'))}>onDateSelect</button>
            <button type="button" onClick={() => props.onCategoryChange('DJ')}>onCategoryChange</button>
            <button type="button" onClick={() => props.onCurrencyChange('USD')}>onCurrencyChange</button>
            <button type="button" onClick={() => props.onFieldChange('biografia', 'Bio text')}>onFieldChange</button>
            <button type="button" onClick={() => props.places && props.onPlacesChange(['Place A'])}>onPlacesChange</button>
        </div>
    )
}));

export const mockUseProfileFormControls = vi.fn().mockReturnValue({
    date: new Date('2020-01-01'),
    setDate: vi.fn(),
    open: false,
    setOpen: vi.fn(),
    verified: true,
    setVerified: vi.fn(),
});
vi.mock('@/components/profile/useProfileFormControls', () => ({
    useProfileFormControls: () => mockUseProfileFormControls()
}));

describe('ArtistRegistrationPage', () => {
    let mockRouterPush: ReturnType<typeof vi.fn>;
    let mockUpdate: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRouterPush = vi.fn();
        mockUpdate = vi.fn();
        vi.mocked(useRouter).mockReturnValue({ push: mockRouterPush } as any);
        mockUseProfileFormControls.mockReturnValue({
            date: new Date('2020-01-01'),
            setDate: vi.fn(),
            open: false,
            setOpen: vi.fn(),
            verified: true,
            setVerified: vi.fn(),
        });
        
        Object.defineProperty(globalThis, 'location', {
            value: { replace: vi.fn() },
            writable: true,
        });
    });

    it('redirects to login if unauthenticated', () => {
        vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated' } as any);
        render(<ArtistRegistrationPage />);
        expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });

    it('redirects to home if user is already an artist or user without admin role', () => {
        vi.mocked(useSession).mockReturnValue({ data: { user: { name: 'Test', rol: 'ARTISTA' } }, status: 'authenticated' } as any);
        render(<ArtistRegistrationPage />);
        expect(mockRouterPush).toHaveBeenCalledWith('/home');
    });

    it('shows loading screen', () => {
        vi.mocked(useSession).mockReturnValue({ data: null, status: 'loading' } as any);
        render(<ArtistRegistrationPage />);
        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('renders form and allows submission for admin', async () => {
        vi.mocked(useSession).mockReturnValue({ data: { user: { name: 'Test', rol: 'ADMIN', email: 'test@test.com' } }, update: mockUpdate, status: 'authenticated' } as any);
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'tk', rol: { nombre: 'ARTISTA' } }) } as any);
        
        render(<ArtistRegistrationPage />);
        
        // Fill form
        fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'New Name' } });
        
        const form = screen.getByTestId('form-wrapper');
        fireEvent.submit(form);
        
        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/rol', expect.objectContaining({
                method: 'PATCH',
            }));
            expect(toast.success).toHaveBeenCalledWith('¡Registro completado con éxito!');
            expect(mockUpdate).toHaveBeenCalled();
            expect(globalThis.location.replace).toHaveBeenCalledWith('/settings');
        });
    });

    it('handles submission error gracefully', async () => {
        vi.mocked(useSession).mockReturnValue({ data: { user: { name: 'Test', rol: 'ADMIN' } }, status: 'authenticated' } as any);
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: false } as any);
        
        render(<ArtistRegistrationPage />);
        fireEvent.submit(screen.getByTestId('form-wrapper'));
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Error al registrar artista. Inténtalo de nuevo.');
        });
    });

    it('handles network error gracefully', async () => {
        vi.mocked(useSession).mockReturnValue({ data: { user: { name: 'Test', rol: 'ADMIN' } }, status: 'authenticated' } as any);
        vi.mocked(fetchApi).mockRejectedValueOnce(new Error('Network'));
        
        render(<ArtistRegistrationPage />);
        fireEvent.submit(screen.getByTestId('form-wrapper'));
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Error de conexión. Verifica tu internet.');
        });
    });

    it('prevents submission if unverified', async () => {
        mockUseProfileFormControls.mockReturnValue({ verified: false, date: new Date('2020-01-01'), setDate: vi.fn(), setOpen: vi.fn(), setVerified: vi.fn() });
        vi.mocked(useSession).mockReturnValue({ data: { user: { name: 'Test', rol: 'ADMIN' } }, status: 'authenticated' } as any);
        
        render(<ArtistRegistrationPage />);
        
        // Unverify
        fireEvent.click(screen.getByText('Unverify'));
        fireEvent.submit(screen.getByTestId('form-wrapper'));
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Por favor verifica tu nombre de usuario');
        });
    });

    it('prevents submission if date is in the future', async () => {
        mockUseProfileFormControls.mockReturnValue({ verified: true, date: new Date('2050-01-01'), setDate: vi.fn(), setOpen: vi.fn(), setVerified: vi.fn() });
        vi.mocked(useSession).mockReturnValue({ data: { user: { name: 'Test', rol: 'ADMIN' } }, status: 'authenticated' } as any);
        
        render(<ArtistRegistrationPage />);
        fireEvent.submit(screen.getByTestId('form-wrapper'));
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('La fecha de inicio no puede ser futura');
        });
    });

    it('handles session user name missing', () => {
        vi.mocked(useSession).mockReturnValue({ data: { user: { name: '', rol: 'ADMIN' } }, status: 'authenticated' } as any);
        render(<ArtistRegistrationPage />);
        expect(screen.getByTestId('form-wrapper')).toBeInTheDocument();
    });

    it('handles submission for non-admin user (falsy rol in session)', async () => {
        vi.mocked(useSession).mockReturnValue({ data: { user: { name: 'Test', email: 'test@test.com' } }, update: mockUpdate, status: 'authenticated' } as any);
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'tk', rol: { nombre: 'ARTISTA' } }) } as any);
        
        render(<ArtistRegistrationPage />);
        fireEvent.submit(screen.getByTestId('form-wrapper'));
        
        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                rol: 'ARTISTA'
            }));
            expect(globalThis.location.replace).toHaveBeenCalledWith('/home');
        });
    });

    it('handles null start date (fechaInicio) and missing update function', async () => {
        mockUseProfileFormControls.mockReturnValue({
            date: null,
            setDate: vi.fn(),
            open: false,
            setOpen: vi.fn(),
            verified: true,
            setVerified: vi.fn(),
        });
        vi.mocked(useSession).mockReturnValue({ data: { user: { name: 'Test', rol: 'ADMIN', email: 'test@test.com' } }, status: 'authenticated' } as any);
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'tk', rol: { nombre: 'ARTISTA' } }) } as any);

        render(<ArtistRegistrationPage />);
        fireEvent.submit(screen.getByTestId('form-wrapper'));

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/rol', expect.objectContaining({
                body: expect.stringContaining('"fechaInicio":null')
            }));
            expect(globalThis.location.replace).toHaveBeenCalledWith('/settings');
        });
    });

    it('covers all mock callbacks of ArtistFormFields and redirects for SUPER_ADMIN role', async () => {
        vi.mocked(useSession).mockReturnValue({
            data: { user: { name: 'Super', rol: 'SUPER_ADMIN', email: 'super@test.com' } },
            update: vi.fn(),
            status: 'authenticated'
        } as any);

        render(<ArtistRegistrationPage />);

        // Click every button in mock-artist-form-fields
        fireEvent.click(screen.getByRole("button", { name: "onDateOpenChange" }));
        fireEvent.click(screen.getByRole("button", { name: "onDateSelect" }));
        fireEvent.click(screen.getByRole("button", { name: "onCategoryChange" }));
        fireEvent.click(screen.getByRole("button", { name: "onCurrencyChange" }));
        fireEvent.click(screen.getByRole("button", { name: "onFieldChange" }));
        fireEvent.click(screen.getByRole("button", { name: "onPlacesChange" }));
        
        // We can also change the inputs
        fireEvent.change(screen.getByTestId("name-input"), { target: { value: "Super Art" } });
        fireEvent.change(screen.getByTestId("username-input"), { target: { value: "superart" } });

        // Submit form
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'tk-super', rol: { nombre: 'ARTISTA' } }) } as any);
        fireEvent.submit(screen.getByTestId('form-wrapper'));

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/api/usuarios/rol', expect.objectContaining({
                body: expect.stringContaining('"nombreArtistico":"Super Art"')
            }));
            expect(globalThis.location.replace).toHaveBeenCalledWith('/settings');
        });
    });

    it('handles submission with missing token and role in response to cover fallbacks', async () => {
        vi.mocked(useSession).mockReturnValue({ 
            data: { user: { name: 'Test', email: 'test@test.com' }, accessToken: 'existing-session-token' }, 
            update: mockUpdate, 
            status: 'authenticated' 
        } as any);
        // Response contains no token and no rol.nombre
        vi.mocked(fetchApi).mockResolvedValueOnce({ ok: true, json: async () => ({}) } as any);
        
        render(<ArtistRegistrationPage />);
        fireEvent.submit(screen.getByTestId('form-wrapper'));

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                rol: 'ARTISTA',
                accessToken: 'existing-session-token'
            }));
            expect(globalThis.location.replace).toHaveBeenCalledWith('/home');
        });
    });
});
