import { type ReactNode } from "react";
import { AnimatedBackground } from "@/components/animated-background";
import { BackButton } from "@/components/ui/back-button";

type RegistrationPageShellProps = {
  readonly title: string;
  readonly backHref: string;
  readonly children: ReactNode;
};

export function RegistrationPageShell({ title, backHref, children }: RegistrationPageShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-x-hidden bg-black text-white font-sans">
      <AnimatedBackground />

      <div className="z-10 w-full max-w-2xl px-6 pt-32 pb-8 flex items-center justify-between">
        <BackButton href={backHref} />
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <div className="w-6" />
      </div>

      <div className="z-10 w-full max-w-3xl px-6 pb-20">{children}</div>
    </div>
  );
}
