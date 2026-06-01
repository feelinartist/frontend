"use client";

import { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type ConfirmActionDialogProps = {
  readonly trigger: ReactNode;
  readonly title: string;
  readonly description: string;
  readonly confirmText: string;
  readonly cancelText?: string;
  readonly confirmButtonClassName?: string;
  readonly onConfirm: () => void;
  readonly contentClassName?: string;
  readonly triggerAsChild?: boolean;
};

export function ConfirmActionDialog({
  trigger,
  title,
  description,
  confirmText,
  cancelText = "Cancelar",
  confirmButtonClassName,
  onConfirm,
  contentClassName = "bg-zinc-900 border-zinc-800 text-white",
  triggerAsChild = true,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild={triggerAsChild}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent className={contentClassName}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={confirmButtonClassName ?? "bg-red-600 hover:bg-red-700 text-white"}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
