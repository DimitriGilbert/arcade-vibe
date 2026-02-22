/**
 * @fileoverview Type definitions for moderation components
 *
 * Types are derived from the tRPC router output and database schema.
 * These are local convenience types for the moderation components.
 */

/**
 * Report status values from moderation_report_status enum
 * @source packages/db/src/schema/enums.ts
 */
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

/**
 * Resolution action types for report resolution
 * @source packages/api/src/routers/moderation.ts
 */
export type ReportAction =
  | "approved"
  | "rejected"
  | "requested_changes"
  | "escalated";

/**
 * Target type for moderation reports
 * @source packages/db/src/schema/enums.ts
 */
export type ReportTargetType = "prompt" | "game" | "user" | "review";

/**
 * Reporter information embedded in report
 */
export interface ReporterInfo {
  id: string;
  name: string | null;
  email: string;
}

/**
 * Reviewer information embedded in report
 */
export interface ReviewerInfo {
  id: string;
  name: string | null;
}

/**
 * Report entity shape matching tRPC router output
 * @source packages/api/src/routers/moderation.ts getQueue
 */
export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string | null;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reporter: ReporterInfo | null;
  reviewer: ReviewerInfo | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
}

/**
 * Filter state for moderation queue
 */
export interface ModerationFilters {
  searchQuery: string;
  statusFilter: ReportStatus | "all";
  typeFilter: ReportTargetType | "all";
}

/**
 * Resolution dialog state
 */
export interface ResolutionDialogState {
  open: boolean;
  report: Report | null;
  action: ReportAction | null;
}
