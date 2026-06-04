"use client";

import { ReactNode } from "react";
import { AnimatedBackground } from "@/components/animated-background";
import { BackButton } from "@/components/ui/back-button";

interface DashboardPageShellProps {
    readonly title: string;
    readonly description: string;
    readonly backHref: string;
    readonly children: ReactNode;
    readonly headerRight?: ReactNode;
}

export function DashboardPageShell({ title, description, backHref, children, headerRight }: DashboardPageShellProps) {
    return (
        <div className="relative min-h-[100dvh] bg-black px-4 md:px-6 py-4 pt-20 overflow-x-hidden">
            <AnimatedBackground />
            <div className="relative z-10 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <BackButton href={backHref} />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h1>
                        <p className="text-zinc-400 text-sm">{description}</p>
                    </div>
                </div>
                {headerRight && <div className="mb-6">{headerRight}</div>}
                {children}
            </div>
        </div>
    );
}
