"use client";

import { Eye, CheckCircle } from "lucide-react";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import type { Report } from "./types";

export interface ReportListItemProps {
  report: Report;
  onViewDetails: (report: Report) => void;
  onResolve: (report: Report) => void;
}

/**
 * Report card display component
 * Client component - has onClick handlers for view/resolve buttons
 */
export function ReportListItem({
  report,
  onViewDetails,
  onResolve,
}: ReportListItemProps) {
  const statusVariant = report.status === "pending" ? "neon" : "default";

  return (
    <div className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/40 transition-all bg-[var(--muted)]/40">
      <div className="flex items-start justify-between gap-4">
        {/* Report Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <ArcadeBadge
              text={report.targetType}
              variant="default"
              className="capitalize"
            />
            <ArcadeBadge
              text={report.status}
              variant={statusVariant}
              className="capitalize"
            />
            <ArcadeBadge
              text={report.reason}
              variant="pixel"
              className="text-xs"
            />
          </div>
          <p className="text-sm text-[var(--muted-foreground)] line-clamp-2">
            {report.description ?? ""}
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
            <span>
              By{" "}
              {report.reporter?.name ||
                report.reporter?.email ||
                "Anonymous"}
            </span>
            <span>•</span>
            <span>
              {new Date(report.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ArcadeButton
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(report)}
          >
            <Eye className="h-4 w-4" />
            Details
          </ArcadeButton>
          {report.status === "pending" && (
            <ArcadeButton
              variant="secondary"
              size="sm"
              onClick={() => onResolve(report)}
            >
              <CheckCircle className="h-4 w-4" />
              Resolve
            </ArcadeButton>
          )}
        </div>
      </div>
    </div>
  );
}
