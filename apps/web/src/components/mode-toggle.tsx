"use client";

import { Palette } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";
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
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
        <Palette className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
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
