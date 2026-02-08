"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const arcadeTabsListVariants = cva(
  "arcade-tabs-list inline-flex items-center justify-center gap-1 p-1 rounded-[var(--radius)] bg-[var(--muted)]/40 border border-[var(--border)]",
  {
    variants: {
      variant: {
        default: "",
        glow: "border-[var(--primary)]/50",
        line: "bg-transparent border-b-0 border-x-0 border-t-0 p-0 rounded-none gap-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const arcadeTabsTriggerVariants = cva(
  "arcade-tabs-trigger inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium transition-all duration-200 [&_svg]:size-4 [&_svg]:pointer-events-none relative",
  {
    variants: {
      variant: {
        default: "rounded-[calc(var(--radius)-4px)]",
        glow: "rounded-[calc(var(--radius)-4px)]",
        line: "rounded-none border-b-2 border-transparent px-3 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function ArcadeTabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="arcade-tabs"
      data-orientation={orientation}
      className={cn("gap-2 group/arcade-tabs flex data-horizontal:flex-col", className)}
      {...props}
    />
  );
}

function ArcadeTabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof arcadeTabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="arcade-tabs-list"
      data-variant={variant}
      className={cn(arcadeTabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function ArcadeTabsTrigger({
  className,
  ...props
}: TabsPrimitive.Tab.Props & VariantProps<typeof arcadeTabsTriggerVariants>) {
  return (
    <TabsPrimitive.Tab
      data-slot="arcade-tabs-trigger"
      className={cn(
        arcadeTabsTriggerVariants({ variant: props.variant as any }),
        "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        "data-active:bg-[var(--primary)] data-active:text-[var(--primary-foreground)]",
        "data-active:shadow-sm",
        "disabled:opacity-50 disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
        "after:bg-[var(--primary)] after:absolute after:opacity-0 after:transition-opacity",
        "group-data-horizontal/arcade-tabs:after:inset-x-0 group-data-horizontal/arcade-tabs:after:bottom-0 group-data-horizontal/arcade-tabs:after:h-0.5",
        "group-data-vertical/arcade-tabs:after:inset-y-0 group-data-vertical/arcade-tabs:after:-right-1 group-data-vertical/arcade-tabs:after:w-0.5",
        "group-data-[variant=line]/arcade-tabs-list:data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function ArcadeTabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="arcade-tabs-content"
      className={cn("flex-1 outline-none mt-4", className)}
      {...props}
    />
  );
}

export { ArcadeTabs, ArcadeTabsList, ArcadeTabsTrigger, ArcadeTabsContent, arcadeTabsListVariants, arcadeTabsTriggerVariants };
