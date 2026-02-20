"use client";

import { Loader2, Save, Play, Plus, ExternalLink, Home, ChevronRight } from "lucide-react";
import { ArcadeButton } from "@/components/arcade";
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
  onNewPrompt,
  onSave,
  onGenerate,
  onPlayGame,
  onHome,
}: HeaderBarProps) {
  const theme = themes?.find((t) => t.id === selection.themeId);
  const prompt = prompts?.find((p) => p.id === selection.promptId);
  const run = runs?.find((r) => r.id === selection.runId);

  const getBreadcrumbs = () => {
    const crumbs: Array<{ label: string; onClick?: () => void }> = [];
    
    crumbs.push({ label: "Filebrowser", onClick: onHome });
    
    if (theme) {
      crumbs.push({ label: theme.title, onClick: selection.promptId ? () => {} : undefined });
    }
    
    if (prompt) {
      const preview = prompt.content.slice(0, 30);
      crumbs.push({ label: preview.length < prompt.content.length ? `${preview}...` : preview });
    }
    
    if (run) {
      crumbs.push({ label: run.name ?? run.modelName ?? "Run" });
    }
    
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

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

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {credits && (
          <span className="text-xs text-[var(--muted-foreground)] mr-2">
            {credits.balance} credits
          </span>
        )}

        {(selection.type === "theme" || selection.type === "prompt") && (
          <>
            <ArcadeButton
              variant="outline"
              size="sm"
              onClick={onNewPrompt}
            >
              <Plus className="h-3 w-3" />
              New
            </ArcadeButton>

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
          </>
        )}

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
