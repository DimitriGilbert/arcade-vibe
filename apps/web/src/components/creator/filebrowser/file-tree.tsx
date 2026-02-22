"use client";

import { memo } from "react";
import { Loader2, ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, Sparkles, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { ArcadeBadge } from "@/components/arcade";
import type { ThemeNode, PromptNode, RunNode, GenerationStatus } from "./types";
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

function getStatusIcon(status: GenerationStatus) {
  switch (status) {
    case "reasoning":
      return <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" />;
    case "generating":
      return <Sparkles className="h-3 w-3 text-cyan-400 animate-spin" />;
    case "complete":
      return <CheckCircle className="h-3 w-3 text-green-400" />;
    case "error":
      return <AlertCircle className="h-3 w-3 text-red-400" />;
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
  onClick,
}: {
  run: RunNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded transition-colors w-full text-left",
        isSelected ? "bg-[var(--primary)]/15 text-[var(--foreground)]" : "hover:bg-[var(--muted)]/50"
      )}
      onClick={onClick}
    >
      <FileCode className="h-3.5 w-3.5 text-[var(--muted-foreground)] shrink-0" />
      {getStatusIcon(run.status)}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs truncate">
          {run.name ?? "Untitled"}
        </span>
        <span className="text-[10px] text-[var(--primary)] truncate">
          {run.modelName ?? "Unknown model"}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <ArcadeBadge
          text={formatRelativeTime(run.createdAt)}
          variant="default"
          className="text-[10px] px-1"
        />
      </div>
    </button>
  );
});

const PromptNodeComponent = memo(function PromptNodeComponent({
  prompt,
  promptsLoading,
  runs,
  runsLoading,
  isExpanded,
  isSelected,
  selectedRunId,
  onToggle,
  onClick,
  onSelectRun,
}: {
  prompt: PromptNode;
  promptsLoading: boolean;
  runs: RunNode[] | undefined;
  runsLoading: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  selectedRunId: string | null;
  onToggle: () => void;
  onClick: () => void;
  onSelectRun: (runId: string) => void;
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
                onClick={() => onSelectRun(run.id)}
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
                promptsLoading={promptsLoading}
                runs={getRunsForPrompt(prompt.id)}
                runsLoading={getRunsLoadingForPrompt(prompt.id)}
                isExpanded={expandedPrompts.includes(prompt.id)}
                isSelected={prompt.id === selectedPromptId}
                selectedRunId={selectedRunId}
                onToggle={() => onTogglePrompt(prompt.id)}
                onClick={() => onSelectPrompt(prompt.id)}
                onSelectRun={onSelectRun}
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
          getRunsForPrompt={getRunsForPrompt}
          getRunsLoadingForPrompt={getRunsLoadingForPrompt}
        />
      ))}
    </div>
  );
}
