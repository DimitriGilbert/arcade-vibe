"use client";

import type { ReactNode } from "react";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const arcadeTabsVariants = cva("arcade-tabs", {
  variants: {
    variant: {
      default: "",
      glow: "arcade-tabs--glow",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const arcadeTabsListVariants = cva(
  "arcade-tabs-list inline-flex items-center justify-center gap-1 p-1 rounded-[var(--radius)] bg-[var(--muted)]/40 border border-[var(--border)]",
  {
    variants: {
      variant: {
        default: "",
        glow: "border-[var(--primary)]/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const arcadeTabsTriggerVariants = cva(
  "arcade-tabs-trigger inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-[calc(var(--radius)-4px)] transition-all duration-200 [&_svg]:size-4 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "",
        glow: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface ArcadeTabsProps extends VariantProps<typeof arcadeTabsVariants> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function ArcadeTabs({
  value,
  defaultValue,
  onValueChange,
  variant,
  children,
  className,
}: ArcadeTabsProps) {
  return (
    <TabsPrimitive.Root
      data-slot="arcade-tabs"
      data-variant={variant ?? "default"}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      className={cn(arcadeTabsVariants({ variant }), className)}
    >
      {children}
    </TabsPrimitive.Root>
  );
}

interface ArcadeTabsListProps extends VariantProps<
  typeof arcadeTabsListVariants
> {
  children: ReactNode;
  className?: string;
}

export function ArcadeTabsList({
  variant,
  children,
  className,
}: ArcadeTabsListProps) {
  return (
    <TabsPrimitive.List
      data-slot="arcade-tabs-list"
      data-variant={variant ?? "default"}
      className={cn(arcadeTabsListVariants({ variant }), className)}
    >
      {children}
    </TabsPrimitive.List>
  );
}

interface ArcadeTabsTriggerProps extends VariantProps<
  typeof arcadeTabsTriggerVariants
> {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function ArcadeTabsTrigger({
  value,
  variant,
  children,
  className,
  disabled,
}: ArcadeTabsTriggerProps) {
  return (
    <TabsPrimitive.Tab
      data-slot="arcade-tabs-trigger"
      data-variant={variant ?? "default"}
      value={value}
      disabled={disabled}
      className={cn(
        arcadeTabsTriggerVariants({ variant }),
        "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        "data-[selected]:bg-[var(--primary)] data-[selected]:text-[var(--primary-foreground)]",
        "data-[selected]:shadow-sm",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
    >
      {children}
    </TabsPrimitive.Tab>
  );
}

interface ArcadeTabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function ArcadeTabsContent({
  value,
  children,
  className,
}: ArcadeTabsContentProps) {
  return (
    <TabsPrimitive.Panel
      data-slot="arcade-tabs-content"
      value={value}
      className={cn("outline-none mt-4", className)}
    >
      {children}
    </TabsPrimitive.Panel>
  );
}

export {
  arcadeTabsVariants,
  arcadeTabsListVariants,
  arcadeTabsTriggerVariants,
};
