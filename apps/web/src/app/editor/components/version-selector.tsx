import type { ReactNode } from "react";

import { ArcadeBadge } from "@/components/arcade/arcade-badge";
import { ArcadeButton } from "@/components/arcade/arcade-button";
import { Plus } from "lucide-react";

interface VersionData {
  id: string;
  version: number;
  createdAt: string;
}

interface VersionSelectorProps {
  versions: VersionData[];
  currentVersion: number;
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
  onNewVersion: () => void;
}

function getBadgeVariant(
  versionNumber: number,
  currentVersion: number,
  isSelected: boolean,
): "neon" | "pixel" | "default" {
  if (versionNumber === currentVersion) {
    return "neon";
  }
  if (isSelected) {
    return "pixel";
  }
  return "default";
}

export function VersionSelector({
  versions,
  currentVersion,
  selectedVersionId,
  onSelectVersion,
  onNewVersion,
}: VersionSelectorProps): ReactNode {
  const sortedVersions = [...versions].sort((a, b) => a.version - b.version);

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--border)] px-4 py-2">
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
        <Plus />
        New Version
      </ArcadeButton>
    </div>
  );
}
