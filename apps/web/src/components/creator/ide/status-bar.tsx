import { Coins, Loader2, Layers } from "lucide-react";

interface StatusBarProps {
  credits?: { balance: number };
  isGenerating: boolean;
  completedCount: number;
  totalModels: number;
  cursorLine?: number;
  cursorColumn?: number;
  wordCount?: number;
  activeTabType: "prompt" | "game";
}

function formatWordCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function StatusBar({
  credits,
  isGenerating,
  completedCount,
  totalModels,
  cursorLine,
  cursorColumn,
  wordCount,
  activeTabType,
}: StatusBarProps) {
  return (
    <footer className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-muted shrink-0">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Coins className="h-3 w-3" />
          {credits?.balance ?? 0}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {activeTabType === "prompt" && cursorLine !== undefined && (
          <>
            <span>
              Ln {cursorLine}, Col {cursorColumn ?? 1}
            </span>
            {wordCount !== undefined && (
              <span>{formatWordCount(wordCount)} words</span>
            )}
          </>
        )}

        <div className="w-px h-3 bg-border" />

        <div className="flex items-center gap-2">
          {isGenerating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="text-primary">Generating...</span>
            </>
          ) : (
            <span>Ready</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {totalModels > 0 && (
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {completedCount}/{totalModels} models
          </span>
        )}
      </div>
    </footer>
  );
}
