"use client";

import { Palette } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const arcadeThemes = [
  { name: "Synthwave", value: "synthwave" },
  { name: "Tron", value: "tron" },
  { name: "Pixel", value: "pixel" },
  { name: "Cabinet", value: "cabinet" },
  { name: "Vaporwave", value: "vaporwave" },
] as const;

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-[calc(var(--radius)-4px)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
        aria-label="Toggle theme"
      >
        <Palette className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Arcade Themes</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {arcadeThemes.map((arcadeTheme) => (
            <DropdownMenuItem
              key={arcadeTheme.value}
              onClick={() => setTheme(arcadeTheme.value)}
              className="flex items-center"
            >
              <span
                className="mr-2 h-3 w-3 rounded-full bg-[var(--primary)]"
                aria-hidden="true"
              />
              {arcadeTheme.name}
              {theme === arcadeTheme.value && (
                <span className="ml-auto text-xs opacity-60">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
