"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  User,
} from "lucide-react";
import {
  ArcadeCard,
  ArcadeButton,
  ArcadeBadge,
} from "@/components/arcade";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { LoadingState } from "@/components/reusable";
import { EmptyState } from "@/components/reusable";
import UserAvatar from "@/components/reusable/user-avatar";
import { trpcClient } from "@/utils/trpc";
import type { Feedback } from "@/lib/trpc-types";

export default function AdminFeedbackPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    feedback: Feedback | null;
  }>({
    open: false,
    feedback: null,
  });
  const queryClient = useQueryClient();

  // Fetch feedback list
  const { data: feedbackList, isLoading } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: async () => {
      return await trpcClient.feedback.list.query();
    },
  });

  // Delete feedback mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await trpcClient.feedback.delete.mutate({ id });
    },
    onSuccess: () => {
      toast.success("Feedback deleted successfully!");
      setDeleteDialog({ open: false, feedback: null });
      queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete feedback");
    },
  });

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatJsonAnswer = (answer: Record<string, unknown>): string => {
    return JSON.stringify(answer, null, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingState
          size="lg"
          message="Loading feedback..."
          variant="accent"
          centered
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Feedback Management
        </h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          View and manage user feedback submissions
        </p>
      </div>

      {/* Stats Card */}
      <ArcadeCard>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Total Submissions
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {feedbackList?.length ?? 0}
              </p>
            </div>
          </div>
        </div>
      </ArcadeCard>

      {/* Feedback List */}
      <ArcadeCard>
        <div className="p-6">
          {!feedbackList || feedbackList.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-12 w-12" />}
              title="No feedback yet"
              message="There are no feedback submissions to display."
            />
          ) : (
            <div className="space-y-4">
              {feedbackList.map((item) => {
                const isExpanded = expandedId === item.id;
                
                return (
                  <div
                    key={item.id}
                    className="border border-[var(--border)] rounded-lg overflow-hidden"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between p-4 hover:bg-[var(--muted)]/40 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.id)}
                        className="flex items-center gap-4 flex-1 min-w-0 text-left"
                      >
                        <UserAvatar user={item.user} size="xs" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-[var(--foreground)] truncate">
                              {item.subject}
                            </span>
                            <ArcadeBadge
                              text={item.user?.email ?? "Unknown"}
                              variant="default"
                              className="text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted-foreground)]">
                            <User className="h-3 w-3" />
                            <span>{item.user?.name ?? "Anonymous"}</span>
                            <span className="text-[var(--border)]">|</span>
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <ArcadeButton
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteDialog({ open: true, feedback: item })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </ArcadeButton>
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.id)}
                          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-[var(--muted-foreground)]" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-[var(--muted-foreground)]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-[var(--border)] p-4 space-y-4 bg-[var(--muted)]/20">
                        {/* Answer JSON */}
                        <div>
                          <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                            Form Response
                          </h4>
                          <pre className="text-xs bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                            <code className="text-[var(--foreground)]">
                              {formatJsonAnswer(item.answer)}
                            </code>
                          </pre>
                        </div>

                        {/* Comment */}
                        {item.comment && (
                          <div>
                            <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                              Additional Comment
                            </h4>
                            <p className="text-sm text-[var(--muted-foreground)] bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                              {item.comment}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ArcadeCard>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, feedback: null })
        }
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Feedback</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feedback from{" "}
              <span className="font-medium">
                {deleteDialog.feedback?.user?.email ?? "Unknown User"}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-[var(--muted)]/40 rounded-lg p-4">
              <p className="text-sm font-medium text-[var(--foreground)]">
                Subject:
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {deleteDialog.feedback?.subject}
              </p>
            </div>
          </div>
          <DialogFooter>
            <ArcadeButton
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, feedback: null })}
            >
              Cancel
            </ArcadeButton>
            <ArcadeButton
              variant="primary"
              onClick={() => {
                if (deleteDialog.feedback) {
                  deleteMutation.mutate(deleteDialog.feedback.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </ArcadeButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
