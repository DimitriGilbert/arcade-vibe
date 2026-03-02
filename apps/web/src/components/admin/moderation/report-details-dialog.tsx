"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArcadeBadge } from "@/components/arcade";
import type { Report } from "./types";

export interface ReportDetailsDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Report details dialog
 * Client component - has dialog open/close state
 */
export function ReportDetailsDialog({
  report,
  open,
  onOpenChange,
}: ReportDetailsDialogProps) {
  if (!report) return null;

  const statusVariant = report.status === "pending" ? "neon" : "default";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] min-w-7xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Details</DialogTitle>
          <DialogDescription>
            Full details of moderation report
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Reporter</Label>
              <p className="text-sm">
                {report.reporter?.name || "Anonymous"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {report.reporter?.email || ""}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Target Type</Label>
              <p className="text-sm capitalize">
                {report.targetType}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Reason</Label>
              <p className="text-sm">{report.reason}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <ArcadeBadge
                text={report.status}
                variant={statusVariant}
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Description</Label>
            <p className="text-sm bg-[var(--muted)]/40 p-3 rounded-lg">
              {report.description ?? ""}
            </p>
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">
            Created: {new Date(report.createdAt).toLocaleString()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
