import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Roles that don't require profile registration — they go straight to Home
export async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const isRolePage = req.nextUrl.pathname.startsWith("/role-selection");
    const isRegistrationPage =
        req.nextUrl.pathname.startsWith("/artist-registration") ||
        req.nextUrl.pathname.startsWith("/public-registration") ||
        req.nextUrl.pathname.startsWith("/venue-registration");
    const isDashboardPage = req.nextUrl.pathname === "/" ||
        req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname.startsWith("/home") ||
        req.nextUrl.pathname.startsWith("/events") ||
        req.nextUrl.pathname.startsWith("/profile") ||
        req.nextUrl.pathname.startsWith("/settings") ||
        req.nextUrl.pathname.startsWith("/stats") ||
        req.nextUrl.pathname.startsWith("/search") ||
        req.nextUrl.pathname.startsWith("/admin");

    if (isAuth) {
        const userRol = token.rol as string | undefined;

        if (userRol) {
            // User HAS a role — they shouldn't be on role selection or registration pages
            if (isRolePage || isRegistrationPage) {
                return NextResponse.redirect(new URL("/home", req.url));
            }
        } else if (isDashboardPage) {
            // User has NO role
            // SUPER_ADMIN/ADMIN are pre-seeded with a role, so this path
            // is only for regular users who haven't picked a role yet.
            return NextResponse.redirect(new URL("/role-selection", req.url));
        }
    } else if (isRolePage || isRegistrationPage || isDashboardPage) {
        // Not authenticated — redirect to login for protected pages
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/dashboard",
        "/dashboard/:path*",
        "/home",
        "/home/:path*",
        "/role-selection",
        "/role-selection/:path*",
        "/artist-registration",
        "/artist-registration/:path*",
        "/public-registration",
        "/public-registration/:path*",
        "/venue-registration",
        "/venue-registration/:path*",
        "/events",
        "/events/:path*",
        "/profile",
        "/profile/:path*",
        "/settings",
        "/settings/:path*",
        "/stats",
        "/stats/:path*",
        "/search",
        "/search/:path*",
        "/admin",
        "/admin/:path*",
    ],
};
