"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe, Lock, Loader2 } from "lucide-react";
import type { ThemeList, Visibility } from "@/lib/trpc-types";

interface WorkbenchSettingsTabProps {
  themes: ThemeList[] | undefined;
  themesLoading: boolean;
  selectedTheme: string;
  onSelectTheme: (themeId: string) => void;
  visibility: Visibility;
  onVisibilityChange: (visibility: Visibility) => void;
}

export function WorkbenchSettingsTab({
  themes,
  themesLoading,
  selectedTheme,
  onSelectTheme,
  visibility,
  onVisibilityChange,
}: WorkbenchSettingsTabProps) {
  const themeOptions = useMemo(() => {
    if (!themes) return [];
    return themes.map((t) => ({
      id: t.id,
      title: t.title,
    }));
  }, [themes]);

  return (
    <div className="space-y-4">
      {/* Theme Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Theme</Label>
        <Select
          value={selectedTheme}
          onValueChange={(value) => {
            if (value !== null) {
              onSelectTheme(value);
            }
          }}
          disabled={themesLoading}
        >
          <SelectTrigger className="w-full h-8 text-sm">
            <SelectValue placeholder="Select theme">
              {themesLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading...
                </span>
              ) : (
                themeOptions.find((t) => t.id === selectedTheme)?.title || "Select theme"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {themesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : themes && themes.length > 0 ? (
              themes.map((theme) => (
                <SelectItem key={theme.id} value={theme.id}>
                  {theme.title}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-4 text-xs text-center text-[var(--muted-foreground)]">
                No themes available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Visibility Toggle */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Visibility</Label>
        <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-md bg-[var(--card)]">
          <div className="flex items-center gap-2">
            {visibility === "public" || visibility === "public_on_freeze" ? (
              <Globe className="h-4 w-4 text-green-500" />
            ) : (
              <Lock className="h-4 w-4 text-[var(--muted-foreground)]" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {visibility === "public" ? "Public" : visibility === "public_on_freeze" ? "Public on Freeze" : "Private"}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {visibility === "public"
                  ? "Visible to everyone"
                  : visibility === "public_on_freeze"
                    ? "Visible when theme freezes"
                    : "Only visible to you"}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onVisibilityChange("private")}
              className={`p-1.5 rounded transition-colors ${
                visibility === "private"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "hover:bg-[var(--muted)]"
              }`}
              title="Private"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onVisibilityChange("public_on_freeze")}
              className={`p-1.5 rounded transition-colors ${
                visibility === "public_on_freeze"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "hover:bg-[var(--muted)]"
              }`}
              title="Public on Freeze"
            >
              <Globe className="h-3.5 w-3.5 opacity-60" />
            </button>
            <button
              type="button"
              onClick={() => onVisibilityChange("public")}
              className={`p-1.5 rounded transition-colors ${
                visibility === "public"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "hover:bg-[var(--muted)]"
              }`}
              title="Public"
            >
              <Globe className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
