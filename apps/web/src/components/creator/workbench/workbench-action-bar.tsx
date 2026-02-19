"use client";

import { ArcadeButton, ArcadeBadge } from "@/components/arcade";
import { Save, Play, ExternalLink, Loader2 } from "lucide-react";
import type { ModelSelection } from "./types";

interface WorkbenchActionBarProps {
  selectedModels: ModelSelection[];
  promptContent: string;
  isGenerating: boolean;
  isSaving: boolean;
  completedCount: number;
  activeGameId: string | null;
  onGenerate: () => void;
  onSave: () => void;
  onPlayGame: () => void;
}

export function WorkbenchActionBar({
  selectedModels,
  promptContent,
  isGenerating,
  isSaving,
  completedCount,
  activeGameId,
  onGenerate,
  onSave,
  onPlayGame,
}: WorkbenchActionBarProps) {
  const totalCredits = selectedModels.reduce((sum, m) => sum + m.creditCost, 0);
  const hasByok = selectedModels.some((m) => m.isByok);

  return (
    <div className="border-t border-[var(--border)] px-4 py-2 bg-[var(--card)] shrink-0">
      <div className="flex items-center gap-2">
        {/* Save Button */}
        <ArcadeButton
          variant="outline"
          onClick={onSave}
          disabled={!promptContent.trim() || isSaving}
          className="flex-shrink-0"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </>
          )}
        </ArcadeButton>

        {/* Generate Button */}
        <ArcadeButton
          onClick={onGenerate}
          disabled={isGenerating || !promptContent.trim() || selectedModels.length === 0}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              {selectedModels.length > 1 ? `${completedCount}/${selectedModels.length}` : "Generating..."}
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Generate
              {selectedModels.length > 0 && (
                <span className="ml-1 opacity-70">({selectedModels.length})</span>
              )}
            </>
          )}
        </ArcadeButton>

        {/* Credits Display */}
        {selectedModels.length > 0 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasByok && (
              <span className="text-[10px] text-[var(--muted-foreground)]">+BYOK</span>
            )}
            <ArcadeBadge text={`${totalCredits}cr`} variant="neon" />
          </div>
        )}

        {/* Play Game Button */}
        {activeGameId && !isGenerating && (
          <ArcadeButton
            variant="glow"
            onClick={onPlayGame}
            className="flex-shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Play
          </ArcadeButton>
        )}
      </div>
    </div>
  );
}
