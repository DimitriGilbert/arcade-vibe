"use client";

import { useCallback, useRef } from "react";
import { Loader2, Save, Play, Plus, ExternalLink, ChevronRight } from "lucide-react";
import { ArcadeButton } from "@/components/arcade";
import { EditableTitle, type EditableTitleHandle } from "@/components/creator/shared";
import type { ThemeNode, PromptNode, RunNode, FilebrowserSelection } from "./types";

interface HeaderBarProps {
  selection: FilebrowserSelection;
  themes: ThemeNode[] | undefined;
  prompts: PromptNode[] | undefined;
  runs: RunNode[] | undefined;
  credits: { balance: number } | undefined;
  isGenerating: boolean;
  canGenerate: boolean;
  canSave: boolean;
  hasActiveGame: boolean;
  completedCount: number;
  totalModels: number;
  promptTitle: string;
  onPromptTitleChange: (title: string) => void;
  onNewPrompt: () => void;
  onSave: () => void;
  onGenerate: () => void;
  onPlayGame: () => void;
  onHome: () => void;
}

export function HeaderBar({
  selection,
  themes,
  prompts,
  runs,
  credits,
  isGenerating,
  canGenerate,
  canSave,
  hasActiveGame,
  completedCount,
  totalModels,
  promptTitle,
  onPromptTitleChange,
  onNewPrompt,
  onSave,
  onGenerate,
  onPlayGame,
  onHome,
}: HeaderBarProps) {
  const editableTitleRef = useRef<EditableTitleHandle>(null);
  const theme = themes?.find((t) => t.id === selection.themeId);
  const prompt = prompts?.find((p) => p.id === selection.promptId);
  const run = runs?.find((r) => r.id === selection.runId);
  const isNewPrompt = selection.type === "new-prompt";

  const getBreadcrumbs = () => {
    const crumbs: Array<{ label: string; onClick?: () => void }> = [];
    
    crumbs.push({ label: "Filebrowser", onClick: onHome });
    
    if (theme) {
      crumbs.push({ label: theme.title, onClick: selection.promptId || isNewPrompt ? () => {} : undefined });
    }
    
    if (isNewPrompt) {
      crumbs.push({ label: "New Prompt" });
    } else if (prompt) {
      const preview = prompt.content.slice(0, 30);
      crumbs.push({ label: preview.length < prompt.content.length ? `${preview}...` : preview });
    }
    
    if (run) {
      crumbs.push({ label: run.name ?? run.modelName ?? "Run" });
    }
    
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  const isEditingPrompt = selection.type === "theme" || selection.type === "prompt" || selection.type === "new-prompt";

  const handleNewPromptClick = useCallback(() => {
    onNewPrompt();
    editableTitleRef.current?.startEditing("");
  }, [onNewPrompt]);

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm min-w-0 flex-1">
        {breadcrumbs.map((crumb, index) => {
          const crumbKey = `crumb-${index}-${crumb.label.slice(0, 20)}`;
          return (
            <div key={crumbKey} className="flex items-center gap-1 min-w-0">
              {index > 0 && <ChevronRight className="h-3 w-3 text-[var(--muted-foreground)] shrink-0" />}
              {crumb.onClick ? (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="text-[var(--foreground)] hover:text-[var(--primary)] truncate transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-[var(--muted-foreground)] truncate">{crumb.label}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions - Order: Credits → Title → New → Save → Generate → Play */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Credits - FIRST */}
        {credits && (
          <span className="text-xs text-[var(--muted-foreground)] mr-2">
            {credits.balance} credits
          </span>
        )}

        {/* Title (EditableTitle) - only when editing prompt */}
        {isEditingPrompt && (
          <EditableTitle
            ref={editableTitleRef}
            value={promptTitle}
            onChange={onPromptTitleChange}
            placeholder="Prompt title"
            disabled={isGenerating}
          />
        )}

        {/* New button - only when editing prompt */}
        {isEditingPrompt && (
          <ArcadeButton
            variant="outline"
            size="sm"
            onClick={handleNewPromptClick}
          >
            <Plus className="h-3 w-3" />
            New
          </ArcadeButton>
        )}

        {/* Save button - only when editing prompt */}
        {isEditingPrompt && (
          <ArcadeButton
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={!canSave || isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Save
          </ArcadeButton>
        )}

        {/* Generate button - only when editing prompt */}
        {isEditingPrompt && (
          <ArcadeButton
            size="sm"
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {totalModels > 1 ? ` ${completedCount}/${totalModels}` : "..."}
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                Generate{totalModels > 0 ? ` (${totalModels})` : ""}
              </>
            )}
          </ArcadeButton>
        )}

        {/* Play Game button - only for run selection */}
        {selection.type === "run" && hasActiveGame && (
          <ArcadeButton
            variant="glow"
            size="sm"
            onClick={onPlayGame}
          >
            <ExternalLink className="h-3 w-3" />
            Play Game
          </ArcadeButton>
        )}
      </div>
    </header>
  );
}
