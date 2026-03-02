"use client";

import { useState, useMemo } from "react";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitBranch, ArrowRight, FileText } from "lucide-react";
import { diffWords, type Change } from "diff";
import type { PromptVersion } from "@/lib/trpc-types";

interface BaseVersion {
  id: string;
  version: number;
  createdAt: Date | string;
}

interface VersionComparisonDialogProps<T extends BaseVersion> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: T[];
  currentVersion: number;
  initialLeftVersionId?: string;
  initialRightVersionId?: string;
  getContent?: (version: T) => string | null | undefined;
}

function VersionDiff({
  leftContent,
  rightContent,
}: {
  leftContent: string;
  rightContent: string;
}) {
  const diff = useMemo(() => {
    return diffWords(leftContent, rightContent);
  }, [leftContent, rightContent]);

  const renderDiff = (changes: Change[]) => {
    return changes.map((part, index) => {
      const style = part.added
        ? "bg-green-500/20 text-green-400"
        : part.removed
          ? "bg-red-500/20 text-red-400 line-through"
          : "text-[var(--foreground)]";

      return (
        <span key={`change-${index}-${part.value.length}`} className={style}>
          {part.value}
        </span>
      );
    });
  };

  const leftDiff = diff.filter((d) => !d.added);
  const rightDiff = diff.filter((d) => !d.removed);

  return (
    <div className="grid grid-cols-2 gap-0 bg-[var(--muted)]/40 rounded-lg overflow-hidden border border-[var(--border)] min-h-[60vh]">
      <div className="border-r border-[var(--border)] flex flex-col">
        <div className="p-2 border-b border-[var(--border)] bg-[var(--muted)]/50 text-xs font-medium text-[var(--muted-foreground)] shrink-0">
          Original
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 whitespace-pre-wrap text-sm font-mono">
            {renderDiff(leftDiff)}
          </div>
        </ScrollArea>
      </div>
      <div className="flex flex-col">
        <div className="p-2 border-b border-[var(--border)] bg-[var(--muted)]/50 text-xs font-medium text-[var(--muted-foreground)] shrink-0">
          New
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 whitespace-pre-wrap text-sm font-mono">
            {renderDiff(rightDiff)}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export function VersionComparisonDialog<T extends BaseVersion>({
  open,
  onOpenChange,
  versions,
  currentVersion,
  initialLeftVersionId,
  initialRightVersionId,
  getContent,
}: VersionComparisonDialogProps<T>) {
  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.version - a.version),
    [versions]
  );

  const [leftVersionId, setLeftVersionId] = useState<string | null>(
    initialLeftVersionId ?? sortedVersions[1]?.id ?? null
  );
  const [rightVersionId, setRightVersionId] = useState<string | null>(
    initialRightVersionId ?? sortedVersions[0]?.id ?? null
  );

  const leftVersion = versions.find((v) => v.id === leftVersionId);
  const rightVersion = versions.find((v) => v.id === rightVersionId);

  const leftContent = leftVersion ? getContent?.(leftVersion) ?? ("content" in leftVersion ? String(leftVersion.content) : null) : null;
  const rightContent = rightVersion ? getContent?.(rightVersion) ?? ("content" in rightVersion ? String(rightVersion.content) : null) : null;

  const getVersionBadgeVariant = (
    versionNumber: number
  ): "neon" | "default" => {
    return versionNumber === currentVersion ? "neon" : "default";
  };

  const hasContent = leftContent && rightContent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Compare Versions
          </DialogTitle>
          <DialogDescription>
            Compare two versions to see what changed
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 py-4">
          <select
            value={leftVersionId ?? ""}
            onChange={(e) => setLeftVersionId(e.target.value || null)}
            className="flex-1 px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Select version</option>
            {sortedVersions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version}
                {v.version === currentVersion ? " (current)" : ""} -{" "}
                {new Date(v.createdAt).toLocaleDateString()}
              </option>
            ))}
          </select>

          <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />

          <select
            value={rightVersionId ?? ""}
            onChange={(e) => setRightVersionId(e.target.value || null)}
            className="flex-1 px-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Select version</option>
            {sortedVersions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version}
                {v.version === currentVersion ? " (current)" : ""} -{" "}
                {new Date(v.createdAt).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-h-0">
          {leftVersion && rightVersion ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArcadeBadge
                    text={`v${leftVersion.version}`}
                    variant={getVersionBadgeVariant(leftVersion.version)}
                  />
                  <ArrowRight className="h-3 w-3 text-[var(--muted-foreground)]" />
                  <ArcadeBadge
                    text={`v${rightVersion.version}`}
                    variant={getVersionBadgeVariant(rightVersion.version)}
                  />
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  {leftVersion.id === rightVersion.id
                    ? "Same version selected"
                    : "Comparing versions"}
                </div>
              </div>

              {hasContent ? (
                <VersionDiff
                  leftContent={leftContent}
                  rightContent={rightContent}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] bg-[var(--muted)]/20 rounded-lg border border-[var(--border)]">
                  <FileText className="h-8 w-8 text-[var(--muted-foreground)] mb-2" />
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Version content not available for comparison
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]/70 mt-1">
                    Load a version to view its content
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[var(--muted-foreground)]">
              Select two versions to compare
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-[var(--border)]">
          <ArcadeButton variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </ArcadeButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useVersionComparison() {
  const [isOpen, setIsOpen] = useState(false);
  const [leftVersionId, setLeftVersionId] = useState<string | undefined>();
  const [rightVersionId, setRightVersionId] = useState<string | undefined>();

  const openComparison = (leftId?: string, rightId?: string) => {
    setLeftVersionId(leftId);
    setRightVersionId(rightId);
    setIsOpen(true);
  };

  const closeComparison = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    leftVersionId,
    rightVersionId,
    openComparison,
    closeComparison,
    setIsOpen,
  };
}
