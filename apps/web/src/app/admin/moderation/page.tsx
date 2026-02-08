"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import { LoadingState, EmptyState } from "@/components/reusable";

type ReportStatus = "pending" | "resolved" | "reviewing" | "dismissed";
type ReportAction = "approved" | "rejected" | "requested_changes" | "escalated";

export default function AdminModerationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "prompt" | "game" | "user" | "review"
  >("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionDialog, setResolutionDialog] = useState<{
    open: boolean;
    report: Report | null;
    action: ReportAction | null;
  }>({
    open: false,
    report: null,
    action: null,
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch moderation queue
  const {
    data: reports,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-moderation-queue", typeFilter, statusFilter, page],
    queryFn: async () => {
      const params: {
        targetType?: "user" | "prompt" | "game" | "review";
        limit: number;
        offset: number;
      } = { limit: pageSize, offset: (page - 1) * pageSize };

      if (typeFilter !== "all") {
        params.targetType = typeFilter;
      }

      const allReports =
        await trpcClient.admin.direct.getModerationQueue.query(params);

      // Filter by status if needed (since endpoint only returns pending reports)
      if (statusFilter === "resolved") {
        return [];
      } else if (statusFilter === "pending") {
        return allReports;
      }
      return allReports;
    },
  });

  // Resolve report mutation
  const resolveReportMutation = useMutation({
    mutationFn: async (input: {
      reportId: string;
      action: ReportAction;
      resolutionReason: string;
    }) => {
      return await trpcClient.moderation.resolveReport.mutate({
        reportId: input.reportId,
        action: input.action,
        resolutionReason: input.resolutionReason,
      });
    },
    onSuccess: () => {
      toast.success("Report resolved successfully!");
      refetch();
      setResolutionDialog({ open: false, report: null, action: null });
      setSelectedReport(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resolve report");
    },
  });

  // Filter reports
  const filteredReports = (reports || []).filter((report) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (report.description ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      report.targetType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;
    const matchesType =
      typeFilter === "all" || report.targetType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleResolve = (
    report: Report,
    action: ReportAction,
    resolutionReason: string,
  ) => {
    resolveReportMutation.mutate({
      reportId: report.id,
      action,
      resolutionReason,
    });
  };

  if (isLoading) {
    return <LoadingState size="lg" message="Loading moderation queue..." variant="accent" centered />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Moderation Queue
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and resolve user reports
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-[var(--card)]/60 backdrop-blur-sm border-[var(--border)]">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ReportStatus | "all")
              }
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value as
                    | "all"
                    | "prompt"
                    | "game"
                    | "user"
                    | "review",
                )
              }
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Types</option>
              <option value="prompt">Prompts</option>
              <option value="game">Games</option>
              <option value="user">Users</option>
              <option value="review">Reviews</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card className="bg-[var(--card)]/60 backdrop-blur-sm border-[var(--border)]">
        <CardContent className="p-6">
          {filteredReports.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="h-12 w-12" />}
              message="No reports found matching your filters"
              variant="card"
            />
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/40 transition-all bg-[var(--muted)]/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Report Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="capitalize">
                          {report.targetType}
                        </Badge>
                        <Badge
                          variant={
                            report.status === "pending"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {report.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {report.reason}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.description ?? ""}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      {report.status === "pending" && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setResolutionDialog({
                                open: true,
                                report,
                                action: null,
                              })
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border)]">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={!reports || reports.length < pageSize}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Full details of moderation report
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Reporter</Label>
                  <p className="text-sm">
                    {selectedReport.reporter?.name || "Anonymous"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedReport.reporter?.email || ""}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Target Type</Label>
                  <p className="text-sm capitalize">
                    {selectedReport.targetType}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reason</Label>
                  <p className="text-sm">{selectedReport.reason}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge
                    variant={
                      selectedReport.status === "pending"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedReport.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm bg-[var(--muted)]/40 p-3 rounded-lg">
                  {selectedReport.description ?? ""}
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                Created: {new Date(selectedReport.createdAt).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolution Dialog */}
      <Dialog
        open={resolutionDialog.open}
        onOpenChange={(open) =>
          !open &&
          setResolutionDialog({ open: false, report: null, action: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              Choose an action and provide a resolution reason
            </DialogDescription>
          </DialogHeader>
          {resolutionDialog.report && (
            <div className="space-y-4">
              <div>
                <Label>Resolution Action</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setResolutionDialog({
                        ...resolutionDialog,
                        action: "approved" as ReportAction,
                      })
                    }
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      resolutionDialog.action === "approved"
                        ? "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]"
                        : "hover:bg-[var(--muted)]/60"
                    }`}
                  >
                    <XCircle className="h-4 w-4 mx-auto mb-1" />
                    <span className="block">Approve</span>
                    <span className="block text-xs text-muted-foreground mt-1">
                      Take action (hide game, suspend user, etc.)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setResolutionDialog({
                        ...resolutionDialog,
                        action: "rejected" as ReportAction,
                      })
                    }
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      resolutionDialog.action === "rejected"
                        ? "bg-[var(--secondary)]/20 border-[var(--secondary)] text-[var(--secondary)]"
                        : "hover:bg-[var(--muted)]/60"
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 mx-auto mb-1" />
                    <span className="block">Reject</span>
                    <span className="block text-xs text-muted-foreground mt-1">
                      No action needed
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setResolutionDialog({
                        ...resolutionDialog,
                        action: "requested_changes" as ReportAction,
                      })
                    }
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      resolutionDialog.action === "requested_changes"
                        ? "bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)]"
                        : "hover:bg-[var(--muted)]/60"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                    <span className="block">Request Changes</span>
                    <span className="block text-xs text-muted-foreground mt-1">
                      Ask for content modification
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setResolutionDialog({
                        ...resolutionDialog,
                        action: "escalated" as ReportAction,
                      })
                    }
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      resolutionDialog.action === "escalated"
                        ? "bg-[var(--destructive)]/20 border-[var(--destructive)] text-[var(--destructive)]"
                        : "hover:bg-[var(--muted)]/60"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                    <span className="block">Escalate</span>
                    <span className="block text-xs text-muted-foreground mt-1">
                      Send to admin review
                    </span>
                  </button>
                </div>
              </div>
              <div>
                <Label>Resolution Reason</Label>
                <Textarea
                  placeholder="Explain your resolution decision..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setResolutionDialog({ open: false, report: null, action: null })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (resolutionDialog.report && resolutionDialog.action) {
                  const textarea = document.querySelector(
                    "textarea",
                  ) as HTMLTextAreaElement;
                  handleResolve(
                    resolutionDialog.report,
                    resolutionDialog.action,
                    textarea?.value || "No reason provided",
                  );
                }
              }}
              disabled={
                !resolutionDialog.action || resolveReportMutation.isPending
              }
            >
              {resolveReportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Submit Resolution
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type Report = {
  id: string;
  targetType: "user" | "prompt" | "game" | "review";
  targetId: string | null;
  reason: string;
  description: string | null;
  status: "pending" | "resolved" | "reviewing" | "dismissed";
  reporter: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  reviewer: {
    id: string;
    name: string | null;
  } | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
};
