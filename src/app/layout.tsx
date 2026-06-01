import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css';
import Providers from './providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Feelin - Comunidad de Artistas',
    description: 'Conecta con artistas, pide canciones y vive la música.',
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.ico',
        apple: '/icons/icon-192x192.png',
    },
}

export default function RootLayout({
    children,
}: {
    readonly children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <Providers>
                    {children}
                    <Toaster />
                </Providers>
            </body>
        </html>
    )
}
