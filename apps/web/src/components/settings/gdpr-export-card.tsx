"use client";

import { useState } from "react";
import { Download, Loader2, FileArchive, CheckCircle } from "lucide-react";

import { ArcadeCard, ArcadeButton } from "@/components/arcade";

interface GdprExportCardProps {
  /** Date of the last export, if any */
  lastExportDate?: Date | string | null;
  /** Whether an export is currently in progress */
  isExporting?: boolean;
  /** Handler for export button click */
  onExport?: () => void;
}

/**
 * GDPR data export card
 * Allows users to request a copy of their personal data
 */
export function GdprExportCard({
  lastExportDate,
  isExporting = false,
  onExport,
}: GdprExportCardProps) {
  const [hasRequestedExport, setHasRequestedExport] = useState(false);

  const handleExportClick = () => {
    setHasRequestedExport(true);
    onExport?.();
  };

  const formattedLastExport = lastExportDate
    ? new Date(lastExportDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <ArcadeCard>
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
            <FileArchive className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">
              Data Export
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Request a copy of your personal data (GDPR)
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          Under GDPR regulations, you have the right to receive a copy of your
          personal data in a machine-readable format. This includes your profile
          information, games, prompts, and activity history.
        </p>

        {formattedLastExport && (
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/50 px-3 py-2 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Last export: {formattedLastExport}</span>
          </div>
        )}

        {hasRequestedExport && isExporting && (
          <div className="flex items-center gap-2 text-sm text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-2 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Preparing your data export...</span>
          </div>
        )}

        <ArcadeButton
          variant="outline"
          onClick={handleExportClick}
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing Export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Request Data Export
            </>
          )}
        </ArcadeButton>

        <p className="text-xs text-[var(--muted-foreground)]">
          You will receive an email with a download link once your data is
          ready. This may take up to 24 hours.
        </p>
      </div>
    </ArcadeCard>
  );
}
