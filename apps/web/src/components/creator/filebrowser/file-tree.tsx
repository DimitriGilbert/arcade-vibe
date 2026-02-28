"use client";

import { memo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  Globe,
  EyeOff,
  MoreHorizontal,
  Trash2,
  Send,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ThemeNode, PromptNode, RunNode } from "./types";
import { cn } from "@/lib/utils";

interface FileTreeProps {
  themes: ThemeNode[] | undefined;
  themesLoading: boolean;
  prompts: PromptNode[] | undefined;
  promptsLoading: boolean;
  runs: RunNode[] | undefined;
  runsLoading: boolean;
  runsByPromptId: Record<string, RunNode[]>;
  runsLoadingByPromptId: Record<string, boolean>;
  expandedThemes: string[];
  expandedPrompts: string[];
  selectedThemeId: string | null;
  selectedPromptId: string | null;
  selectedRunId: string | null;
  onToggleTheme: (themeId: string) => void;
  onTogglePrompt: (promptId: string) => void;
  onSelectTheme: (themeId: string) => void;
  onSelectPrompt: (promptId: string) => void;
  onSelectRun: (runId: string) => void;
  onDeletePrompt?: (promptId: string) => void;
  onTogglePromptVisibility?: (promptId: string, visibility: "private" | "public" | "public_on_freeze") => void;
  deletingPromptId?: string | null;
}

function getStatusIcon(status: RunNode["status"]) {
  switch (status) {
    case "generating":
      return <Sparkles className="h-3 w-3 text-cyan-400 animate-spin" />;
    case "completed":
      return <CheckCircle className="h-3 w-3 text-green-400" />;
    case "failed":
      return <AlertCircle className="h-3 w-3 text-red-400" />;
    case "hidden":
      return <EyeOff className="h-3 w-3 text-[var(--muted-foreground)]" />;
    default:
      return <Clock className="h-3 w-3 text-[var(--muted-foreground)]" />;
  }
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength).trim()}...`;
}

const RunNodeComponent = memo(function RunNodeComponent({
  run,
  isSelected,
  onSelect,
  onSubmit,
  onUnpublish,
  onDelete,
  isSubmitting,
  isUnpublishing,
  isDeleting,
}: {
  run: RunNode;
  isSelected: boolean;
  onSelect: () => void;
  onSubmit: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  isSubmitting: boolean;
  isUnpublishing: boolean;
  isDeleting: boolean;
}) {
  const canSubmit = run.status === "completed" && !run.isSubmitted;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex flex-col gap-1 px-2 py-1.5 rounded transition-colors cursor-pointer",
        isSelected ? "bg-[var(--primary)]/15 text-[var(--foreground)]" : "hover:bg-[var(--muted)]/50"
      )}
    >
      <div className="flex items-start gap-2 min-w-0 w-full text-left">
        <FileCode className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
        {getStatusIcon(run.status)}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <span className="text-xs leading-tight whitespace-normal break-words">{run.name ?? "Untitled"}</span>
            {run.isSubmitted && <Globe className="h-3 w-3 text-green-500 shrink-0" />}
          </div>
          <span className="text-[10px] leading-tight text-[var(--primary)] whitespace-normal break-words">
            {run.modelName ?? "Unknown model"}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pl-7">
        <ArcadeBadge
          text={formatRelativeTime(run.createdAt)}
          variant="default"
          className="text-[9px] px-1 py-0 h-4"
        />
        <div className="flex items-center gap-1 shrink-0">
        {run.gameId ? (
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <ArcadeButton
              variant="outline"
              size="sm"
              className="h-6 w-6 px-0 [&_svg]:size-3"
              onClick={() => window.open(`/game/${run.gameId}`, "_blank")}
            >
              <Play className="h-3 w-3" />
            </ArcadeButton>
          </div>
        ) : null}
        {canSubmit ? (
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <ArcadeButton size="sm" className="h-6 w-6 px-0 [&_svg]:size-3" onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            </ArcadeButton>
          </div>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center h-6 w-6 p-0.5 rounded hover:bg-[var(--muted)] focus:opacity-100"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3 text-[var(--muted-foreground)]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {run.isSubmitted ? (
              <DropdownMenuItem onClick={onUnpublish} disabled={isUnpublishing}>
                <EyeOff className="h-3.5 w-3.5 mr-2" />
                {isUnpublishing ? "Unpublishing..." : "Unpublish"}
              </DropdownMenuItem>
            ) : null}
            {run.isSubmitted ? <DropdownMenuSeparator /> : null}
            {!run.isSubmitted ? (
              <DropdownMenuItem onClick={onDelete} disabled={isDeleting} variant="destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </div>
  );
});

const PromptNodeComponent = memo(function PromptNodeComponent({
  prompt,
  runs,
  runsLoading,
  isExpanded,
  isSelected,
  selectedRunId,
  onToggle,
  onClick,
  onSelectRun,
  onSubmitRun,
  onUnpublishRun,
  onDeleteRun,
  submittingRunId,
  unpublishingRunId,
  deletingRunId,
}: {
  prompt: PromptNode;
  runs: RunNode[] | undefined;
  runsLoading: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  selectedRunId: string | null;
  onToggle: () => void;
  onClick: () => void;
  onSelectRun: (runId: string) => void;
  onSubmitRun: (runId: string) => void;
  onUnpublishRun: (runId: string) => void;
  onDeleteRun: (run: RunNode) => void;
  submittingRunId: string | null;
  unpublishingRunId: string | null;
  deletingRunId: string | null;
}) {
  return (
    <div className="ml-2">
      <div
        className={cn(
          "group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer rounded transition-colors",
          isSelected ? "bg-[var(--primary)]/15 text-[var(--foreground)]" : "hover:bg-[var(--muted)]/50"
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-0.5 hover:bg-[var(--muted)] rounded"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronRight className="h-3 w-3 text-[var(--muted-foreground)]" />
          )}
        </button>
        <button
          type="button"
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          onClick={onClick}
        >
          {isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          )}
          <span className="text-xs truncate flex-1">
            {truncateContent(prompt.content, 30)}
          </span>
          <ArcadeBadge text={`v${prompt.version}`} variant="default" className="text-[10px] px-1 shrink-0" />
        </button>
      </div>
      {isExpanded && (
        <div className="ml-4 border-l border-[var(--border)] pl-1">
          {runsLoading ? (
            <div className="flex items-center gap-2 px-2 py-1">
              <Loader2 className="h-3 w-3 animate-spin text-[var(--muted-foreground)]" />
              <span className="text-xs text-[var(--muted-foreground)]">Loading runs...</span>
            </div>
          ) : runs && runs.length > 0 ? (
            runs.map((run) => (
              <RunNodeComponent
                key={run.id}
                run={run}
                isSelected={run.id === selectedRunId}
                onSelect={() => onSelectRun(run.id)}
                onSubmit={() => onSubmitRun(run.id)}
                onUnpublish={() => onUnpublishRun(run.id)}
                onDelete={() => onDeleteRun(run)}
                isSubmitting={submittingRunId === run.id}
                isUnpublishing={unpublishingRunId === run.id}
                isDeleting={deletingRunId === run.id}
              />
            ))
          ) : (
            <div className="px-2 py-1">
              <span className="text-xs text-[var(--muted-foreground)]">No runs yet</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const ThemeNodeComponent = memo(function ThemeNodeComponent({
  theme,
  prompts,
  promptsLoading,
  expandedPrompts,
  selectedPromptId,
  selectedRunId,
  isExpanded,
  isSelected,
  onToggle,
  onClick,
  onTogglePrompt,
  onSelectPrompt,
  onSelectRun,
  onSubmitRun,
  onUnpublishRun,
  onDeleteRun,
  submittingRunId,
  unpublishingRunId,
  deletingRunId,
  getRunsForPrompt,
  getRunsLoadingForPrompt,
}: {
  theme: ThemeNode;
  prompts: PromptNode[] | undefined;
  promptsLoading: boolean;
  expandedPrompts: string[];
  selectedPromptId: string | null;
  selectedRunId: string | null;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onClick: () => void;
  onTogglePrompt: (promptId: string) => void;
  onSelectPrompt: (promptId: string) => void;
  onSelectRun: (runId: string) => void;
  onSubmitRun: (runId: string) => void;
  onUnpublishRun: (runId: string) => void;
  onDeleteRun: (run: RunNode) => void;
  submittingRunId: string | null;
  unpublishingRunId: string | null;
  deletingRunId: string | null;
  getRunsForPrompt: (promptId: string) => RunNode[] | undefined;
  getRunsLoadingForPrompt: (promptId: string) => boolean;
}) {
  return (
    <div className="border-b border-[var(--border)] last:border-b-0">
      <div
        className={cn(
          "group flex items-center gap-1.5 px-3 py-2 cursor-pointer transition-colors",
          isSelected ? "bg-[var(--primary)]/10" : "hover:bg-[var(--muted)]/30"
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-0.5 hover:bg-[var(--muted)] rounded"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          )}
        </button>
        <button
          type="button"
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          onClick={onClick}
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500 shrink-0" />
          )}
          <span className="text-sm font-medium truncate flex-1">{theme.title}</span>
          {theme.isActive && (
            <ArcadeBadge text="Active" variant="neon" className="text-[10px] px-1 shrink-0" />
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="ml-2 pb-2">
          {promptsLoading ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <Loader2 className="h-3 w-3 animate-spin text-[var(--muted-foreground)]" />
              <span className="text-xs text-[var(--muted-foreground)]">Loading prompts...</span>
            </div>
          ) : prompts && prompts.length > 0 ? (
            prompts.map((prompt) => (
              <PromptNodeComponent
                key={prompt.id}
                prompt={prompt}
                runs={getRunsForPrompt(prompt.id)}
                runsLoading={getRunsLoadingForPrompt(prompt.id)}
                isExpanded={expandedPrompts.includes(prompt.id)}
                isSelected={prompt.id === selectedPromptId}
                selectedRunId={selectedRunId}
                onToggle={() => onTogglePrompt(prompt.id)}
                onClick={() => onSelectPrompt(prompt.id)}
                onSelectRun={onSelectRun}
                onSubmitRun={onSubmitRun}
                onUnpublishRun={onUnpublishRun}
                onDeleteRun={onDeleteRun}
                submittingRunId={submittingRunId}
                unpublishingRunId={unpublishingRunId}
                deletingRunId={deletingRunId}
              />
            ))
          ) : (
            <div className="px-3 py-2">
              <span className="text-xs text-[var(--muted-foreground)]">No prompts yet</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export function FileTree({
  themes,
  themesLoading,
  prompts,
  promptsLoading,
  runs,
  runsLoading,
  runsByPromptId,
  runsLoadingByPromptId,
  expandedThemes,
  expandedPrompts,
  selectedThemeId,
  selectedPromptId,
  selectedRunId,
  onToggleTheme,
  onTogglePrompt,
  onSelectTheme,
  onSelectPrompt,
  onSelectRun,
}: FileTreeProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [runToDelete, setRunToDelete] = useState<RunNode | null>(null);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [unpublishingRunId, setUnpublishingRunId] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: async (gameId: string) => {
      return await trpcClient.games.submit.mutate({ gameId });
    },
    onSuccess: () => {
      toast.success("Game submitted!");
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
      void queryClient.invalidateQueries({ queryKey: ["games", "user"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit game");
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async (gameId: string) => {
      setUnpublishingRunId(gameId);
      return await trpcClient.games.unpublish.mutate({ gameId });
    },
    onSuccess: () => {
      toast.success("Game unpublished!");
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
      void queryClient.invalidateQueries({ queryKey: ["games", "user"] });
      setUnpublishingRunId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unpublish game");
      setUnpublishingRunId(null);
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: async (gameId: string) => {
      setDeletingRunId(gameId);
      return await trpcClient.games.hardDelete.mutate({ gameId });
    },
    onSuccess: () => {
      toast.success("Game deleted!");
      void queryClient.invalidateQueries({ queryKey: ["games-by-prompt"] });
      void queryClient.invalidateQueries({ queryKey: ["games", "user"] });
      setDeleteDialogOpen(false);
      setRunToDelete(null);
      setDeletingRunId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete game");
      setDeletingRunId(null);
    },
  });

  const handleSubmitRun = (runId: string) => {
    submitMutation.mutate(runId);
  };

  const handleUnpublishRun = (runId: string) => {
    unpublishMutation.mutate(runId);
  };

  const handleDeleteRun = (run: RunNode) => {
    setRunToDelete(run);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteRun = () => {
    if (!runToDelete) return;
    hardDeleteMutation.mutate(runToDelete.id);
  };

  // Helper to get runs for a prompt - uses map for expanded prompts, falls back to selected prompt
  const getRunsForPrompt = (promptId: string): RunNode[] | undefined => {
    if (promptId in runsByPromptId) {
      return runsByPromptId[promptId];
    }
    // Fallback for selected prompt (backward compatibility)
    if (promptId === selectedPromptId) {
      return runs;
    }
    return undefined;
  };

  const getRunsLoadingForPrompt = (promptId: string): boolean => {
    if (promptId in runsLoadingByPromptId) {
      return runsLoadingByPromptId[promptId] ?? false;
    }
    // Fallback for selected prompt (backward compatibility)
    if (promptId === selectedPromptId) {
      return runsLoading;
    }
    return false;
  };

  if (themesLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (!themes || themes.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[var(--muted-foreground)]">
        No themes available
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {themes.map((theme) => (
        <ThemeNodeComponent
          key={theme.id}
          theme={theme}
          prompts={theme.id === selectedThemeId ? prompts : undefined}
          promptsLoading={theme.id === selectedThemeId && promptsLoading}
          expandedPrompts={expandedPrompts}
          selectedPromptId={selectedPromptId}
          selectedRunId={selectedRunId}
          isExpanded={expandedThemes.includes(theme.id)}
          isSelected={theme.id === selectedThemeId}
          onToggle={() => onToggleTheme(theme.id)}
          onClick={() => onSelectTheme(theme.id)}
          onTogglePrompt={onTogglePrompt}
          onSelectPrompt={onSelectPrompt}
          onSelectRun={onSelectRun}
          onSubmitRun={handleSubmitRun}
          onUnpublishRun={handleUnpublishRun}
          onDeleteRun={handleDeleteRun}
          submittingRunId={submitMutation.isPending ? submitMutation.variables ?? null : null}
          unpublishingRunId={unpublishingRunId}
          deletingRunId={deletingRunId}
          getRunsForPrompt={getRunsForPrompt}
          getRunsLoadingForPrompt={getRunsLoadingForPrompt}
        />
      ))}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Game</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{runToDelete?.name || runToDelete?.modelName || "this game"}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <ArcadeButton variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </ArcadeButton>
            <ArcadeButton
              onClick={handleConfirmDeleteRun}
              disabled={deletingRunId === runToDelete?.id}
              className="bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90"
            >
              {deletingRunId === runToDelete?.id ? "Deleting..." : "Delete"}
            </ArcadeButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
