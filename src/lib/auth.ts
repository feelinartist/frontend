import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

interface ExtendedToken {
    id?: string;
    rol?: string | null;
    nombreArtistico?: string | null;
    name?: string | null;
    image?: string | null;
    accessToken?: string | null;
    perfilCompletadoReconocido?: boolean;
    [key: string]: unknown;
}

interface UserAuth {
    email?: string | null;
    name?: string | null;
    image?: string | null;
    [key: string]: unknown;
}

// Helper functions to reduce cognitive complexity
const handleSessionUpdate = (trigger: string | undefined, session: Partial<ExtendedToken> | undefined, token: ExtendedToken) => {
    if (trigger === "update" && session) {
        if (session.rol) token.rol = session.rol;
        if (session.nombreArtistico) token.nombreArtistico = session.nombreArtistico;
        if (session.name) token.name = session.name;
        if (session.image) token.image = session.image;
        if (session.accessToken) token.accessToken = session.accessToken;
        if (session.perfilCompletadoReconocido !== undefined) token.perfilCompletadoReconocido = session.perfilCompletadoReconocido;
    }
};

const syncUserWithBackend = async (user: UserAuth, token: ExtendedToken, backendUrl: string) => {
    try {
        const response = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                correo: user.email,
                nombre: user.name,
                imagen: user.image
            }),
        });

        if (response.ok) {
            const dbUser = await response.json();
            token.id = dbUser.id;
            token.rol = dbUser.rol?.nombre;
            token.name = dbUser.nombre || user.name;
            token.image = dbUser.imagen || user.image;
            token.perfilCompletadoReconocido = dbUser.perfilCompletadoReconocido || false;
            token.accessToken = dbUser.token;
        } else {
            console.error("Failed to sync user with backend. Status:", response.status);
            throw new Error("Failed to authenticate with backend");
        }
    } catch (error) {
        console.error("Error syncing user with backend:", error);
        throw new Error("Backend synchronization failed");
    }
};

export function getAuthOptions(): NextAuthOptions {
    // Valores directos de variables de entorno (.env.local)
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    if (!googleClientId || !googleClientSecret) {
        console.warn('⚠️ Faltan credenciales de Google en .env.local');
    }

    return {
        // secret: process.env.NEXTAUTH_SECRET, // Implícito
        providers: [
            GoogleProvider({
                clientId: googleClientId,
                clientSecret: googleClientSecret,
                authorization: {
                    params: {
                        prompt: "select_account",
                        access_type: "offline",
                        response_type: "code"
                    }
                }
            }),
        ],
        session: {
            strategy: "jwt",
        },
        pages: {
            signIn: "/login",
        },
        callbacks: {
            async jwt({ token, user, account, trigger, session }) {
                handleSessionUpdate(trigger, session, token as ExtendedToken);

                if (account && user) {
                    const authUser: UserAuth = {
                        email: (user as { email?: string | null }).email ?? null,
                        name: (user as { name?: string | null }).name ?? null,
                        image: (user as { image?: string | null }).image ?? null,
                    };
                    await syncUserWithBackend(authUser, token as ExtendedToken, backendUrl);
                }
                return token;
            },
            async session({ session, token }) {
                const extendedToken = token as ExtendedToken;
                if (session.user) {
                    if (extendedToken.id) session.user.id = extendedToken.id;
                    if (extendedToken.rol) session.user.rol = extendedToken.rol;
                    if (extendedToken.name) session.user.name = extendedToken.name;
                    if (extendedToken.image) session.user.image = extendedToken.image;
                    if (extendedToken.perfilCompletadoReconocido !== undefined) session.user.perfilCompletadoReconocido = extendedToken.perfilCompletadoReconocido;
                }
                // Expose the backend JWT to the client for API calls
                if (extendedToken.accessToken) session.accessToken = extendedToken.accessToken;
                return session;
            },
        },
    };
}
