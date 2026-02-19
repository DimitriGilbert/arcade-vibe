"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { ArcadeButton, ArcadeBadge } from "@/components/arcade";
import { ChevronDown, ChevronRight, Play, Save, History, Loader2 } from "lucide-react";
import type { CodelabModelSelection, CodelabVersion } from "./types";

interface CodelabPromptCellProps {
  cellId: string;
  promptContent: string;
  onPromptChange: (content: string) => void;
  gameName: string;
  onGameNameChange: (name: string) => void;
  selectedModels: CodelabModelSelection[];
  totalCredits: number;
  isGenerating: boolean;
  completedCount: number;
  onRun: () => void;
  onSave?: () => void;
  versions?: CodelabVersion[];
  currentVersion?: number;
  onLoadVersion?: (versionId: string) => void;
  savePending?: boolean;
  isActive?: boolean;
}

export function CodelabPromptCell({
  promptContent,
  onPromptChange,
  gameName,
  onGameNameChange,
  selectedModels,
  totalCredits,
  isGenerating,
  completedCount,
  onRun,
  onSave,
  versions,
  currentVersion,
  onLoadVersion,
  savePending,
  isActive = false,
}: CodelabPromptCellProps) {
  const [showParams, setShowParams] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const editorRef = useRef<Parameters<NonNullable<Parameters<typeof Editor>[0]["onMount"]>>[0] | null>(null);

  // Auto-resize editor to content
  useEffect(() => {
    if (editorRef.current) {
      const lineHeight = 20;
      const minLines = 4;
      const maxLines = 20;
      const lineCount = Math.min(maxLines, Math.max(minLines, promptContent.split("\n").length));
      const height = lineCount * lineHeight + 24;
      const editorContainer = editorRef.current.getContainerDomNode();
      if (editorContainer) {
        editorContainer.style.height = `${height}px`;
      }
    }
  }, [promptContent]);

  const handleEditorMount = useCallback(
    (editor: Parameters<NonNullable<Parameters<typeof Editor>[0]["onMount"]>>[0]) => {
      editorRef.current = editor;
    },
    []
  );

  const canRun = promptContent.trim().length > 0 && selectedModels.length > 0 && !isGenerating;

  return (
    <div
      className={[
        "rounded-lg border bg-[var(--card)] overflow-hidden transition-all",
        isActive ? "border-[var(--primary)]/50 shadow-md" : "border-[var(--border)]",
      ].join(" ")}
    >
      {/* Cell Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--muted-foreground)]">In [ ]:</span>
          {isGenerating && (
            <span className="text-xs text-blue-400 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {completedCount}/{selectedModels.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {versions && versions.length > 0 && (
            <ArcadeBadge
              text={`v${currentVersion ?? versions.length}`}
              variant="default"
              className="text-[10px]"
            />
          )}
          <ArcadeBadge
            text={`${selectedModels.length} model${selectedModels.length !== 1 ? "s" : ""}`}
            variant={selectedModels.length > 0 ? "neon" : "default"}
            className="text-[10px]"
          />
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="min-h-[100px]">
        <Editor
          height="auto"
          defaultLanguage="markdown"
          value={promptContent}
          onChange={(value) => onPromptChange(value ?? "")}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            lineNumbers: "off",
            wordWrap: "on",
            fontSize: 13,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
            folding: false,
            renderLineHighlight: "none",
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
            },
          }}
        />
      </div>

      {/* Collapsible Parameters Section */}
      <div className="border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => setShowParams(!showParams)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/30 transition-colors"
        >
          {showParams ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          Parameters
          <ArcadeBadge text={`${totalCredits}cr`} variant="neon" className="text-[10px] ml-auto" />
        </button>

        {showParams && (
          <div className="px-3 py-2 space-y-2 bg-[var(--muted)]/10">
            {/* Game Name */}
            <div>
              <span className="text-[10px] text-[var(--muted-foreground)] mb-1 block">
                Game name (optional)
              </span>
              <input
                type="text"
                value={gameName}
                onChange={(e) => onGameNameChange(e.target.value)}
                placeholder="My awesome game"
                className="w-full px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                maxLength={100}
              />
            </div>

            {/* Selected Models Chips */}
            <div>
              <span className="text-[10px] text-[var(--muted-foreground)] mb-1 block">
                Models
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedModels.map((model) => (
                  <span
                    key={model.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[var(--muted)] rounded-full"
                  >
                    {model.modelName}
                    {model.isByok && <span className="text-yellow-500">(BYOK)</span>}
                  </span>
                ))}
                {selectedModels.length === 0 && (
                  <span className="text-[10px] text-[var(--muted-foreground)] italic">
                    No models selected
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Version History (collapsible) */}
      {versions && versions.length > 0 && onLoadVersion && (
        <div className="border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setShowVersions(!showVersions)}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/30 transition-colors"
          >
            <History className="h-3 w-3" />
            {showVersions ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Versions ({versions.length})
          </button>

          {showVersions && (
            <div className="px-3 py-2 bg-[var(--muted)]/10">
              <div className="flex flex-wrap gap-1">
                {versions.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onLoadVersion(v.id)}
                    className={[
                      "px-2 py-0.5 text-[10px] rounded-md transition-colors",
                      v.version === currentVersion
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--muted)] hover:bg-[var(--muted)]/80",
                    ].join(" ")}
                  >
                    v{v.version}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cell Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--border)] bg-[var(--muted)]/20">
        <ArcadeButton
          variant="primary"
          size="sm"
          onClick={onRun}
          disabled={!canRun}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Running {completedCount}/{selectedModels.length}...
            </>
          ) : (
            <>
              <Play className="h-3 w-3" />
              Run ({totalCredits}cr)
            </>
          )}
        </ArcadeButton>

        {onSave && (
          <ArcadeButton
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={!promptContent.trim() || savePending}
          >
            {savePending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </ArcadeButton>
        )}
      </div>
    </div>
  );
}
