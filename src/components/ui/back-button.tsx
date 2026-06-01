"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BackButtonProps {
    readonly href: string;
    readonly className?: string;
}

export function BackButton({ href, className }: BackButtonProps) {
    return (
        <Link href={href}>
            <div className={cn(
                "inline-flex items-center justify-center p-2 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors",
                className
            )}>
                <ArrowLeft className="h-5 w-5" />
            </div>
        </Link>
    );
}
