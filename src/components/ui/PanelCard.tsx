"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface PanelCardProps {
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly headerActions?: React.ReactNode;
}

export function PanelCard({ title, description, children, className = "", headerActions }: PanelCardProps) {
  return (
    <Card className={`border-white/10 bg-black/40 backdrop-blur-xl ${className}`}>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="text-xl text-white flex items-center gap-2">{title}</CardTitle>
            {description ? <CardDescription className="text-zinc-400">{description}</CardDescription> : null}
          </div>
          {headerActions ? <div className="ml-auto">{headerActions}</div> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
