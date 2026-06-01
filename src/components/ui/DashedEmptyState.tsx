"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface Props {
  readonly loading?: boolean;
  readonly title?: string;
  readonly subtitle?: string;
}

export function DashedEmptyState({ loading, title, subtitle }: Readonly<Props>) {
  return (
    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-zinc-800 rounded-lg">
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-zinc-600 mb-4" />
      ) : null}
      {title ? <p className="text-zinc-400 text-sm">{title}</p> : null}
      {subtitle ? <p className="text-zinc-500 text-xs mt-1">{subtitle}</p> : null}
    </div>
  );
}
