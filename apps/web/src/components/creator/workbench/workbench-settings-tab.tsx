"use client";

import { Globe, Lock } from "lucide-react";

import type { Visibility } from "@/lib/trpc-types";

interface WorkbenchSettingsTabProps {
  visibility: Visibility;
  onVisibilityChange: (visibility: Visibility) => void;
}

export function WorkbenchSettingsTab({
  visibility,
  onVisibilityChange,
}: WorkbenchSettingsTabProps) {
  return (
    <div className="space-y-4">
      {/* Visibility Toggle */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-[var(--foreground)]">Visibility</span>
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

      {/* Note about theme */}
      <div className="text-[10px] text-[var(--muted-foreground)] italic">
        Theme selection is available in the header bar above.
      </div>
    </div>
  );
}
