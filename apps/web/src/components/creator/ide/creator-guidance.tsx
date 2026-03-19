"use client";

import { Lightbulb, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameNode, IDESelection, ModelSelection } from "./types";

export type CreatorGuidanceStep =
  | "create"
  | "name"
  | "content"
  | "model"
  | "generate"
  | "publish"
  | "done";

export interface CreatorGuidanceState {
  currentStep: CreatorGuidanceStep;
}

interface DeriveCreatorGuidanceStateInput {
  selection: IDESelection;
  isNewPrompt: boolean;
  promptTitle: string;
  promptContent: string;
  selectedModels: ModelSelection[];
  games: GameNode[];
}

export function deriveCreatorGuidanceState({
  selection,
  isNewPrompt,
  promptTitle,
  promptContent,
  selectedModels,
  games,
}: DeriveCreatorGuidanceStateInput): CreatorGuidanceState {
  const hasStartedPrompt = isNewPrompt || selection.promptId !== null;
  const hasValidTitle = promptTitle.trim().length >= 3;
  const hasPromptContent = promptContent.trim().length > 0;
  const hasSelectedModels = selectedModels.length > 0;
  const hasGeneratedGame = games.some(
    (game) => game.status === "completed" || game.gameId !== null,
  );
  const hasPublishedGame = games.some((game) => game.isSubmitted);

  if (!selection.themeId || !hasStartedPrompt) {
    return { currentStep: "create" };
  }

  if (!hasValidTitle) {
    return { currentStep: "name" };
  }

  if (!hasPromptContent) {
    return { currentStep: "content" };
  }

  if (!hasSelectedModels) {
    return { currentStep: "model" };
  }

  if (!hasGeneratedGame) {
    return { currentStep: "generate" };
  }

  if (!hasPublishedGame) {
    return { currentStep: "publish" };
  }

  return { currentStep: "done" };
}

export function GuidanceBubble({
  text,
  className,
  onDismiss,
}: {
  text: string;
  className?: string;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onDismiss}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onDismiss?.();
        }
      }}
      className={cn(
        "pointer-events-auto cursor-pointer rounded-xl border border-[var(--primary)]/30 bg-[var(--card)] px-3 py-2 shadow-lg backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
        <p className="flex-1 text-xs font-medium leading-5 text-[var(--foreground)]">{text}</p>
        {onDismiss ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDismiss();
            }}
            className="rounded p-0.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Dismiss hint"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
