"use client";

import { useState } from "react";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { Plus, GitBranch } from "lucide-react";
import type { PromptVersion } from "@/lib/trpc-types";
import { VersionComparisonDialog } from "@/components/creator/shared";

interface WorkbenchVersionBarProps {
  versions: PromptVersion[] | undefined;
  currentVersion: number;
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
  onNewVersion: () => void;
}

function getBadgeVariant(
  versionNumber: number,
  currentVersion: number,
  isSelected: boolean
): "neon" | "pixel" | "default" {
  if (versionNumber === currentVersion) {
    return "neon";
  }
  if (isSelected) {
    return "pixel";
  }
  return "default";
}

export function WorkbenchVersionBar({
  versions,
  currentVersion,
  selectedVersionId,
  onSelectVersion,
  onNewVersion,
}: WorkbenchVersionBarProps) {
  const [compareOpen, setCompareOpen] = useState(false);

  if (!versions || versions.length === 0) {
    return null;
  }

  const sortedVersions = [...versions].sort((a, b) => a.version - b.version);

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--border)] px-4 py-1.5 bg-[var(--muted)]/20 shrink-0">
        {sortedVersions.map((v) => {
          const isSelected = v.id === selectedVersionId;
          const variant = getBadgeVariant(v.version, currentVersion, isSelected);

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVersion(v.id)}
              className="cursor-pointer"
            >
              <ArcadeBadge text={`v${v.version}`} variant={variant} />
            </button>
          );
        })}
        <ArcadeButton variant="outline" size="sm" onClick={onNewVersion}>
          <Plus className="h-3 w-3" />
        </ArcadeButton>
        {versions.length > 1 && (
          <ArcadeButton
            variant="outline"
            size="sm"
            onClick={() => setCompareOpen(true)}
          >
            <GitBranch className="h-3 w-3" />
          </ArcadeButton>
        )}
      </div>

      <VersionComparisonDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        versions={versions}
        currentVersion={currentVersion}
      />
    </>
  );
}
