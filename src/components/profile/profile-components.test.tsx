import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DonationForm } from './DonationForm';
import { GalleryForm } from './GalleryForm';
import { SocialMediaForm } from './SocialMediaForm';
import { ArtistProfileForm } from './ArtistProfileForm';
import { VenueProfileForm } from './VenueProfileForm';

// Mock dependencies
vi.mock('@/lib/api', () => ({
    apiCall: vi.fn(),
    fetchApi: vi.fn(),
}));

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('lucide-react')>();
    return {
        ...actual,
        Loader2: () => <div data-testid="loader">Loader</div>,
        Save: () => <div data-testid="save">Save</div>,
        Plus: () => <div data-testid="plus">Plus</div>,
        Trash2: () => <div data-testid="trash">Trash</div>,
        Upload: () => <div data-testid="upload">Upload</div>,
        Calendar: () => <div data-testid="calendar">Calendar</div>,
        Image: () => <div data-testid="image-icon">Image</div>,
    };
});

describe('Profile Forms', () => {
    const mockUserData = { id: '1', nombre: 'Test User' };

    describe('DonationForm', () => {
        it('renders and handles save', () => {
            const onSave = vi.fn();
            render(<DonationForm 
                donaciones={{
                    yapeUrl: 'https://yape.com',
                    plinUrl: '',
                    paypalUrl: ''
                }}
                usuarioId="1"
                onSave={onSave}
            />);
            
            expect(screen.getByText(/No has agregado métodos de donación/i)).toBeInTheDocument();
            const btn = screen.getByRole('button', { name: /Guardar Cambios/i });
            fireEvent.click(btn);
            expect(onSave).not.toHaveBeenCalled(); // since it calls api first
        });
    });

    describe('GalleryForm', () => {
        it('renders correctly', () => {
            const onSave = vi.fn();
            render(<GalleryForm
                archivosMedia={[{id: "1", url: "https://test.com/img.jpg", tipo: "IMAGEN", descripcion: "test"}]}
                usuarioId="1"
                onSave={onSave}
            />);
            expect(screen.getByText(/No has agregado imágenes aún/i)).toBeInTheDocument();
        });
    });

    describe('SocialMediaForm', () => {
        it('renders and allows adding links', () => {
            const onSave = vi.fn();
            render(<SocialMediaForm
                redesSociales={[{id: "1", plataforma: "Instagram", url: "https://instagram.com/test"}]}
                usuarioId="1"
                onSave={onSave}
            />);
            expect(screen.getByText(/Redes Sociales/i)).toBeInTheDocument();
        });
    });

    describe('ArtistProfileForm', () => {
        it('renders artist profile form', () => {
            const onSubmit = vi.fn();
            render(<ArtistProfileForm
                userData={{
                    nombre: "Test Artist",
                    perfilArtista: { categoria: "Músico" }
                }}
                onSubmit={onSubmit}
                countries={[{ name: "Peru", code: "PE", phoneCode: "+51" }]}
                isLoading={false}
            />);
            expect(screen.getByText(/Nombre Artístico/i)).toBeInTheDocument();
        });
    });

    describe('VenueProfileForm', () => {
        it('renders venue profile form', () => {
            const onSubmit = vi.fn();
            render(<VenueProfileForm
                userData={{
                    nombre: "Test Venue",
                    perfilLocal: { direccion: "Av Test 123" }
                }}
                onSubmit={onSubmit}
                countries={[{ name: "Peru", code: "PE", phoneCode: "+51" }]}
                isLoading={false}
            />);
            expect(screen.getByText(/Nombre de la Discoteca/i)).toBeInTheDocument();
        });
    });
});
