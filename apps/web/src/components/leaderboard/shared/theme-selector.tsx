"use client";

import type { ReactNode } from "react";
import type { ThemeList } from "@/lib/trpc-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ThemeSelectorProps {
  currentTheme: ThemeList | null;
  themes: ThemeList[];
  onSelect: (theme: ThemeList | null) => void;
  includeAllOption?: boolean;
}

const ALL_THEMES_VALUE = "__all__";

export function ThemeSelector({
  currentTheme,
  themes,
  onSelect,
  includeAllOption = false,
}: ThemeSelectorProps): ReactNode {
  const handleValueChange = (value: string | null): void => {
    if (value === null || value === ALL_THEMES_VALUE) {
      onSelect(null);
      return;
    }

    const selectedTheme = themes.find((theme) => theme.id === value);
    if (selectedTheme) {
      onSelect(selectedTheme);
    }
  };

  const currentValue = currentTheme?.id ?? (includeAllOption ? ALL_THEMES_VALUE : undefined);

  const displayText = currentTheme?.title ?? (includeAllOption ? "All Games" : "Select theme");

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger size="sm">
        <SelectValue placeholder="Select theme">{displayText}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && (
          <SelectItem value={ALL_THEMES_VALUE}>All Games</SelectItem>
        )}
        {themes.map((theme) => (
          <SelectItem key={theme.id} value={theme.id}>
            {theme.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
