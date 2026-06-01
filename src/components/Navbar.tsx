'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, Menu, X, Search, ShieldAlert, Home, Calendar, BarChart3 } from "lucide-react";

import { SearchBar } from "@/components/SearchBar";

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const isRestrictedFlow = pathname === '/role-selection' ||
        pathname === '/artist-registration' ||
        pathname === '/public-registration' ||
        pathname === '/venue-registration';

    // Show search only on /home and /artist (and their sub-routes)
    const showSearch = pathname === '/home' || pathname.startsWith('/home/') || pathname.startsWith('/artist');

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full pr-[calc(var(--removed-body-scroll-bar-size,0px))]">
            <nav className="flex h-16 w-full items-center justify-between border-b border-white/10 bg-black/60 px-6 backdrop-blur-xl shadow-2xl shadow-black/50 supports-[backdrop-filter]:bg-black/40 transition-all hover:bg-black/70">

                {/* Mobile Menu Button */}
                {!isRestrictedFlow && session && (
                    <Button variant="ghost" size="icon" className="md:hidden mr-2 text-white" onClick={() => setIsMenuOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                )}

                {isRestrictedFlow ? (
                    <div className="flex items-center gap-3 pl-2 opacity-80 cursor-default">
                        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-black">
                                <span className="text-sm font-black text-white">F</span>
                            </div>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">
                            Feelin
                        </span>
                    </div>
                ) : (
                    <Link href="/" className="flex items-center gap-3 pl-2 transition-opacity hover:opacity-80">
                        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-black">
                                <span className="text-sm font-black text-white">F</span>
                            </div>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">
                            Feelin
                        </span>
                    </Link>
                )}

                {/* Centered SearchBar - Desktop */}
                {!isRestrictedFlow && session && showSearch && (
                    <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
                        <SearchBar />
                    </div>
                )}

                <div className="flex items-center gap-2 pr-1">
                    {/* Mobile Search Toggle */}
                    {!isRestrictedFlow && session && showSearch && (
                        <Button variant="ghost" size="icon" className="md:hidden text-zinc-400 hover:text-white" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                            <Search className="h-5 w-5" />
                        </Button>
                    )}

                    {session ? (
                        <>
                            {session.user?.rol && (
                                <span className="hidden md:inline-flex mr-2 items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 select-none">
                                    {session.user.rol.replace('_', ' ')}
                                </span>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-white/10 transition-all hover:ring-white/30 hover:bg-white/5 focus:ring-white/30">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || ''} />
                                            <AvatarFallback className="bg-zinc-800 text-xs font-medium text-zinc-300">
                                                {session.user?.name?.[0]?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 border-white/10 bg-black/90 text-zinc-200 backdrop-blur-xl mt-2" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none text-white">{session.user?.name}</p>
                                            <p className="text-xs leading-none text-zinc-400 truncate w-full">{session.user?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    {!isRestrictedFlow && (
                                        <>
                                            <Link href="/home">
                                                <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white text-white">
                                                    <Home className="mr-2 h-4 w-4" />
                                                    <span>Inicio</span>
                                                </DropdownMenuItem>
                                            </Link>
                                            {(session?.user?.rol === 'ARTISTA' || session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN') && (
                                                <>
                                                    <Link href="/events">
                                                        <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white text-white">
                                                            <Calendar className="mr-2 h-4 w-4" />
                                                            <span>Eventos</span>
                                                        </DropdownMenuItem>
                                                    </Link>
                                                    <Link href="/stats">
                                                        <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white text-white">
                                                            <BarChart3 className="mr-2 h-4 w-4" />
                                                            <span>Estadísticas</span>
                                                        </DropdownMenuItem>
                                                    </Link>
                                                </>
                                            )}
                                            <Link href="/profile">
                                                <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white text-white">
                                                    <User className="mr-2 h-4 w-4" />
                                                    <span>Perfil</span>
                                                </DropdownMenuItem>
                                            </Link>
                                            <Link href="/settings">
                                                <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white text-white">
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    <span>Configuración</span>
                                                </DropdownMenuItem>
                                            </Link>
                                            {(session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN') && (
                                                <Link href="/admin">
                                                    <DropdownMenuItem className="cursor-pointer focus:bg-white/10 focus:text-white text-white font-medium">
                                                        <ShieldAlert className="mr-2 h-4 w-4" />
                                                        <span>Panel Admin</span>
                                                    </DropdownMenuItem>
                                                </Link>
                                            )}
                                            <DropdownMenuSeparator className="bg-white/10" />
                                        </>
                                    )}
                                    <DropdownMenuItem
                                        className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
                                        onClick={() => {
                                            sessionStorage.removeItem('eventRedirectChecked');
                                            signOut();
                                        }}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Cerrar Sesión</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <Link href="/login">
                            <Button size="sm" className="rounded-full bg-white px-6 font-medium text-black hover:bg-zinc-200 transition-colors">
                                Iniciar Sesión
                            </Button>
                        </Link>
                    )}
                </div>
            </nav>

            {/* Mobile Search Bar Overlay */}
            {isSearchOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-black/95 border-b border-white/10 p-4 animate-in slide-in-from-top-2">
                    <SearchBar />
                </div>
            )}

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl animate-in fade-in slide-in-from-left-4 md:hidden">
                    <div className="flex flex-col h-full p-6">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-xl font-bold text-white">Menu</span>
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" onClick={() => setIsMenuOpen(false)}>
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                        <nav className="flex flex-col gap-6">
                            <Link href="/home" onClick={() => setIsMenuOpen(false)} className="text-xl font-medium text-zinc-300 hover:text-white transition-colors">
                                Inicio
                            </Link>
                            {(session?.user?.rol === 'ARTISTA' || session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN') && (
                                <>
                                    <Link href="/events" onClick={() => setIsMenuOpen(false)} className="text-xl font-medium text-zinc-300 hover:text-white transition-colors">
                                        Eventos
                                    </Link>
                                    <Link href="/stats" onClick={() => setIsMenuOpen(false)} className="text-xl font-medium text-zinc-300 hover:text-white transition-colors">
                                        Estadísticas
                                    </Link>
                                </>
                            )}
                            <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="text-xl font-medium text-zinc-300 hover:text-white transition-colors">
                                Perfil
                            </Link>
                            <Link href="/settings" onClick={() => setIsMenuOpen(false)} className="text-xl font-medium text-zinc-300 hover:text-white transition-colors">
                                Configuración
                            </Link>
                            {(session?.user?.rol === 'SUPER_ADMIN' || session?.user?.rol === 'ADMIN') && (
                                <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="text-xl font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                                    Panel Admin
                                </Link>
                            )}
                            <div className="h-px bg-white/10 my-2" />
                            <button onClick={() => {
                                sessionStorage.removeItem('eventRedirectChecked');
                                signOut();
                            }} className="text-xl font-medium text-red-400 hover:text-red-300 text-left transition-colors">
                                Cerrar Sesión
                            </button>
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
}
