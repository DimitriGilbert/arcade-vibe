"use client";

import { useState } from "react";
import { ArcadeBadge } from "@/components/arcade";
import { ArcadeButton } from "@/components/arcade";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GitBranch, Clock } from "lucide-react";
import { PromptDiff } from "@/components/prompt-diff";

export interface PromptVersion {
  id: string;
  version: number;
  content: string;
  createdAt: Date;
  author?: {
    id: string;
    name: string | null;
  };
}

export interface VersionHistoryProps {
  versions: PromptVersion[];
  currentVersion: number;
  onSelectVersion?: (version: PromptVersion) => void;
  onCompareVersions?: (
    leftVersion: PromptVersion,
    rightVersion: PromptVersion,
  ) => void;
  showCompareButton?: boolean;
  className?: string;
}

export function VersionHistory({
  versions,
  currentVersion,
  onSelectVersion,
  onCompareVersions,
  showCompareButton = true,
  className = "",
}: VersionHistoryProps) {
  const [compareMode, setCompareMode] = useState(false);
  const [compareLeft, setCompareLeft] = useState<PromptVersion | null>(null);
  const [compareRight, setCompareRight] = useState<PromptVersion | null>(null);

  const handleCompare = () => {
    if (compareLeft && compareRight && onCompareVersions) {
      onCompareVersions(compareLeft, compareRight);
      setCompareMode(false);
    }
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setCompareLeft(null);
    setCompareRight(null);
  };

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  return (
    <div className={className}>
      <Dialog>
        <DialogTrigger>
          <ArcadeButton variant="outline" className="gap-2">
            <GitBranch className="h-4 w-4" />
            History ({versions.length})
          </ArcadeButton>
        </DialogTrigger>
        <DialogContent className="w-[500px] sm:w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and compare different versions of this prompt
            </DialogDescription>
          </DialogHeader>

          {showCompareButton && versions.length > 1 && (
            <div className="mt-4">
              <ArcadeButton
                variant={compareMode ? "primary" : "outline"}
                onClick={toggleCompareMode}
                className="w-full"
              >
                {compareMode ? "Cancel Compare" : "Compare Versions"}
              </ArcadeButton>
            </div>
          )}

          <div className="h-[calc(100vh-200px)] overflow-y-auto mt-4">
            <div className="space-y-3 pr-4">
              {sortedVersions.map((version) => {
                const isCurrent = version.version === currentVersion;
                const isSelectedForCompare =
                  compareLeft?.id === version.id ||
                  compareRight?.id === version.id;

                return (
                  <div
                    key={version.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isCurrent
                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                        : "border-[var(--border)] hover:border-[var(--primary)]/50"
                    } ${
                      compareMode && isSelectedForCompare
                        ? "ring-2 ring-[var(--primary)]"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <ArcadeBadge
                            text={`v${version.version}`}
                            variant={isCurrent ? "neon" : "default"}
                          />
                          {isCurrent && (
                            <ArcadeBadge text="Current" variant="default" />
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(version.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-3">
                          {version.content}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        {compareMode && (
                          <ArcadeButton
                            variant="outline"
                            onClick={() => {
                              if (compareLeft?.id === version.id) {
                                setCompareLeft(null);
                              } else if (!compareLeft) {
                                setCompareLeft(version);
                              } else if (compareRight?.id === version.id) {
                                setCompareRight(null);
                              } else {
                                setCompareRight(version);
                              }
                            }}
                          >
                            {compareLeft?.id === version.id
                              ? "Left"
                              : compareRight?.id === version.id
                                ? "Right"
                                : compareLeft
                                  ? "Set Right"
                                  : "Set Left"}
                          </ArcadeButton>
                        )}

                        {onSelectVersion && !compareMode && !isCurrent && (
                          <ArcadeButton
                            variant="outline"
                            onClick={() => onSelectVersion(version)}
                          >
                            Load
                          </ArcadeButton>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {compareMode && compareLeft && compareRight && (
            <div className="mt-4 p-4 border-t">
              <ArcadeButton onClick={handleCompare} className="w-full">
                Compare v{compareLeft.version} with v{compareRight.version}
              </ArcadeButton>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function VersionComparison({
  leftVersion,
  rightVersion,
  onClose,
}: {
  leftVersion: PromptVersion;
  rightVersion: PromptVersion;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Version Comparison</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Comparing v{leftVersion.version} with v{rightVersion.version}
          </p>
        </div>
        <ArcadeButton variant="outline" onClick={onClose}>
          Close
        </ArcadeButton>
      </div>

      <PromptDiff
        leftContent={leftVersion.content}
        rightContent={rightVersion.content}
        leftVersion={leftVersion.version}
        rightVersion={rightVersion.version}
      />
    </div>
  );
}
