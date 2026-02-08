"use client";

import type { ReactNode } from "react";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const arcadeDialogVariants = cva("arcade-dialog", {
  variants: {
    variant: {
      default: "",
      glow: "arcade-dialog--glow",
    },
    size: {
      sm: "sm:max-w-sm",
      md: "sm:max-w-lg",
      lg: "sm:max-w-2xl",
      full: "sm:max-w-[calc(100%-2rem)]",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

interface ArcadeDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function ArcadeDialog({
  open,
  onOpenChange,
  children,
}: ArcadeDialogProps) {
  return (
    <DialogPrimitive.Root
      data-slot="arcade-dialog"
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </DialogPrimitive.Root>
  );
}

interface ArcadeDialogTriggerProps {
  children: ReactNode;
  className?: string;
}

export function ArcadeDialogTrigger({
  children,
  className,
}: ArcadeDialogTriggerProps) {
  return (
    <DialogPrimitive.Trigger
      data-slot="arcade-dialog-trigger"
      className={className}
    >
      {children}
    </DialogPrimitive.Trigger>
  );
}

interface ArcadeDialogBackdropProps {
  className?: string;
}

export function ArcadeDialogBackdrop({ className }: ArcadeDialogBackdropProps) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="arcade-dialog-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-[var(--foreground)]/40 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "duration-200",
        className,
      )}
    />
  );
}

interface ArcadeDialogContentProps extends VariantProps<
  typeof arcadeDialogVariants
> {
  children: ReactNode;
  className?: string;
  showClose?: boolean;
}

export function ArcadeDialogContent({
  variant,
  size,
  children,
  className,
  showClose = true,
}: ArcadeDialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <ArcadeDialogBackdrop />
      <DialogPrimitive.Popup
        data-slot="arcade-dialog-content"
        data-variant={variant ?? "default"}
        className={cn(
          arcadeDialogVariants({ variant, size }),
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "w-full max-w-[calc(100%-2rem)] rounded-[var(--radius)]",
          "bg-[var(--background)] border border-[var(--border)]",
          "p-6 shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "duration-200 outline-none",
          variant === "glow" &&
            "border-[var(--primary)]/50 shadow-[0_0_30px_var(--primary)/20]",
          className,
        )}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            className={cn(
              "absolute top-4 right-4 p-2 rounded-[var(--radius)]",
              "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              "hover:bg-[var(--muted)] transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]",
            )}
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

interface ArcadeDialogHeaderProps {
  children: ReactNode;
  className?: string;
}

export function ArcadeDialogHeader({
  children,
  className,
}: ArcadeDialogHeaderProps) {
  return (
    <div
      data-slot="arcade-dialog-header"
      className={cn("space-y-2 mb-4", className)}
    >
      {children}
    </div>
  );
}

interface ArcadeDialogFooterProps {
  children: ReactNode;
  className?: string;
}

export function ArcadeDialogFooter({
  children,
  className,
}: ArcadeDialogFooterProps) {
  return (
    <div
      data-slot="arcade-dialog-footer"
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ArcadeDialogTitleProps {
  children: ReactNode;
  className?: string;
}

export function ArcadeDialogTitle({
  children,
  className,
}: ArcadeDialogTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="arcade-dialog-title"
      className={cn(
        "text-lg font-semibold text-[var(--foreground)]",
        className,
      )}
    >
      {children}
    </DialogPrimitive.Title>
  );
}

interface ArcadeDialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function ArcadeDialogDescription({
  children,
  className,
}: ArcadeDialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="arcade-dialog-description"
      className={cn("text-sm text-[var(--muted-foreground)]", className)}
    >
      {children}
    </DialogPrimitive.Description>
  );
}

interface ArcadeDialogCloseProps {
  children: ReactNode;
  className?: string;
}

export function ArcadeDialogClose({
  children,
  className,
}: ArcadeDialogCloseProps) {
  return (
    <DialogPrimitive.Close
      data-slot="arcade-dialog-close"
      className={className}
    >
      {children}
    </DialogPrimitive.Close>
  );
}

export { arcadeDialogVariants };
