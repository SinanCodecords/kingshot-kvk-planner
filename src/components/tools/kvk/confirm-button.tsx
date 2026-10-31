"use client";

import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// A button that asks before doing something destructive. With confirmWord, the user must type it first.
export function ConfirmButton({
  children,
  title,
  description,
  actionLabel,
  confirmWord,
  onConfirm,
  size,
  variant = "destructive",
  className,
}: {
  children: ReactNode;
  title: string;
  description: ReactNode;
  actionLabel: string;
  confirmWord?: string;
  onConfirm: () => Promise<unknown> | void;
  size?: "default" | "sm" | "xs" | "icon-sm";
  variant?: "destructive" | "outline" | "ghost";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          setTyped("");
          setOpen(true);
        }}
      >
        {children}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          {confirmWord && (
            <Input
              autoFocus
              placeholder={`Type ${confirmWord}`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy || (!!confirmWord && typed !== confirmWord)}
              onClick={confirm}
            >
              {actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
