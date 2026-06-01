import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppRouterContext, AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ArtistCard } from './ArtistCard';
import { ArtistDiscovery } from './ArtistDiscovery';
import { EventManager } from './EventManager';
import { LiveRequestsFeed } from './LiveRequestsFeed';

// Mock map component to avoid leaflet errors
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }: any) => <div data-testid="map">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: () => <div data-testid="marker" />,
    Popup: () => <div data-testid="popup" />
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
    useParams: () => ({})
}));

// Mock next-auth to avoid fetch errors
vi.mock('next-auth/react', () => ({
    useSession: () => ({ data: { user: { id: "1" } }, status: "authenticated" }),
    getSession: vi.fn(),
}));

// Mock api
vi.mock('@/lib/api', () => ({
    fetchApi: vi.fn().mockResolvedValue({
        ok: true,
        json: async () => []
    }),
    apiCall: vi.fn().mockResolvedValue([]),
    parseJsonSafe: vi.fn().mockResolvedValue([])
}));

describe('Dashboard Components', () => {
    const mockRouter: AppRouterInstance = {
        back: vi.fn(),
        forward: vi.fn(),
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
    };

    const renderWithRouter = (ui: React.ReactElement) => {
        return render(
            <AppRouterContext.Provider value={mockRouter}>
                {ui}
            </AppRouterContext.Provider>
        );
    };

    describe('ArtistCard', () => {
        it('renders artist information', () => {
            const { container } = renderWithRouter(<ArtistCard 
                artista={{
                    id: "1",
                    usuario: { nombreUsuario: "testartist" },
                    nombreArtistico: "Test Artist",
                    categoria: "Músico"
                }}
            />);
            expect(container).toBeInTheDocument();
        });
    });

    describe('ArtistDiscovery', () => {
        it('renders without crashing', () => {
            renderWithRouter(<ArtistDiscovery />);
            expect(screen.getByText(/Descubrir Artistas/i)).toBeInTheDocument();
        });
    });

    describe('EventManager', () => {
        it('renders without crashing', () => {
            const { container } = render(<EventManager localId="1" />);
            expect(container).toBeInTheDocument();
        });
    });

    describe('LiveRequestsFeed', () => {
        it('renders without crashing', () => {
            const { container } = render(<LiveRequestsFeed eventId="1" />);
            expect(container).toBeInTheDocument();
        });
    });
});
