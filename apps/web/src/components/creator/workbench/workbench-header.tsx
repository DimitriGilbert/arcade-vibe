"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Pencil, Check, X, Loader2, Save, Play, ExternalLink, ChevronDown, FileText, Plus, GitBranch, Trash2 } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import type { CreditBalanceInfo, ThemeList, Visibility, PromptVersion } from "@/lib/trpc-types";
import type { ModelSelection } from "./types";

interface PromptListItem {
  id: string;
  title: string | null;
  content: string;
  version: number;
  updatedAt: string;
  visibility?: Visibility;
}

interface WorkbenchHeaderProps {
  promptTitle: string;
  onPromptTitleChange: (title: string) => void;
  credits: CreditBalanceInfo | null | undefined;
  isLoading?: boolean;
  // Theme selection
  themes: ThemeList[] | undefined;
  themesLoading: boolean;
  selectedTheme: string;
  onSelectTheme: (themeId: string) => void;
  // Prompt selection
  selectedPromptId: string | null;
  onSelectPrompt: (promptId: string) => void;
  onNewPrompt: () => void;
  onDeletePrompt: (promptId: string) => void;
  deletingPromptId: string | null;
  // Version selection
  versions: PromptVersion[] | undefined;
  currentVersion: number | null;
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
  onNewVersion: () => void;
  // Action buttons
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

export function WorkbenchHeader({
  promptTitle,
  onPromptTitleChange,
  credits,
  isLoading,
  // Theme
  themes,
  themesLoading,
  selectedTheme,
  onSelectTheme,
  // Prompt
  selectedPromptId,
  onSelectPrompt,
  onNewPrompt,
  onDeletePrompt,
  deletingPromptId,
  // Version
  versions,
  currentVersion,
  selectedVersionId,
  onSelectVersion,
  onNewVersion,
  // Actions
  selectedModels,
  promptContent,
  isGenerating,
  isSaving,
  completedCount,
  activeGameId,
  onGenerate,
  onSave,
  onPlayGame,
}: WorkbenchHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editValue, setEditValue] = useState(promptTitle);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  // Fetch prompts list for the selected theme
  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ["prompts-for-selector", selectedTheme],
    queryFn: async (): Promise<PromptListItem[]> => {
      if (selectedTheme) {
        return await trpcClient.prompts.listMineByTheme.query({
          themeId: selectedTheme,
        });
      }
      return await trpcClient.prompts.listMine.query();
    },
  });

  const handleStartEdit = useCallback(() => {
    setEditValue(promptTitle);
    setIsEditingName(true);
  }, [promptTitle]);

  const handleSaveEdit = useCallback(() => {
    onPromptTitleChange(editValue.trim());
    setIsEditingName(false);
  }, [editValue, onPromptTitleChange]);

  const handleCancelEdit = useCallback(() => {
    setEditValue(promptTitle);
    setIsEditingName(false);
  }, [promptTitle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSaveEdit();
      } else if (e.key === "Escape") {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  const handleDeleteClick = useCallback((promptId: string) => {
    setPromptToDelete(promptId);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (promptToDelete) {
      onDeletePrompt(promptToDelete);
    }
    setDeleteDialogOpen(false);
    setPromptToDelete(null);
  }, [promptToDelete, onDeletePrompt]);

  const handleGenerateClick = useCallback(() => {
    // Commit any in-progress title edit before generating
    if (isEditingName) {
      onPromptTitleChange(editValue.trim());
      setIsEditingName(false);
    }
    onGenerate();
  }, [isEditingName, editValue, onPromptTitleChange, onGenerate]);

  const totalCredits = useMemo(
    () => selectedModels.reduce((sum, m) => sum + m.creditCost, 0),
    [selectedModels]
  );
  const hasByok = selectedModels.some((m) => m.isByok);

  const selectedPrompt = prompts?.find((p) => p.id === selectedPromptId);
  const selectedThemeOption = themes?.find((t) => t.id === selectedTheme);

  // Sort versions by version number
  const sortedVersions = useMemo(() => {
    if (!versions) return [];
    return [...versions].sort((a, b) => a.version - b.version);
  }, [versions]);

  const selectedVersion = sortedVersions.find((v) => v.id === selectedVersionId);

  // Determine badge variant for version
  const getVersionVariant = (v: PromptVersion): "neon" | "pixel" | "default" => {
    if (v.version === currentVersion) return "neon";
    if (v.id === selectedVersionId) return "pixel";
    return "default";
  };

  return (
    <header className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
      {/* 1. Theme Selector */}
      <Select
        value={selectedTheme}
        onValueChange={(value) => {
          if (value !== null) {
            onSelectTheme(value);
          }
        }}
        disabled={themesLoading}
      >
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue placeholder="Theme">
            {themesLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </span>
            ) : (
              selectedThemeOption?.title || "Select theme"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {themesLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : themes && themes.length > 0 ? (
            themes.map((theme) => (
              <SelectItem key={theme.id} value={theme.id}>
                {theme.title}
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-2 text-xs text-center text-[var(--muted-foreground)]">
              No themes
            </div>
          )}
        </SelectContent>
      </Select>

      {/* 2. Prompt Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors min-w-[100px] max-w-[160px] cursor-pointer outline-none data-[open]:bg-[var(--muted)]/50">
          <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
          <span className="truncate flex-1 text-left">
            {promptsLoading ? "Loading..." : selectedPrompt ? `v${selectedPrompt.version}` : "New"}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px] max-w-[300px]">
          <DropdownMenuItem onClick={onNewPrompt}>
            <Plus className="h-3.5 w-3.5 mr-2" />
            New Prompt
          </DropdownMenuItem>
          {prompts && prompts.length > 0 && <DropdownMenuSeparator />}
          {prompts?.map((prompt) => (
            <DropdownMenuItem
              key={prompt.id}
              onClick={() => onSelectPrompt(prompt.id)}
              className={prompt.id === selectedPromptId ? "bg-[var(--muted)]/50" : ""}
            >
              <span className="truncate">
                v{prompt.version}: {prompt.title || prompt.content.slice(0, 40)}
              </span>
            </DropdownMenuItem>
          ))}
          {selectedPromptId && prompts && prompts.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(selectedPromptId);
                }}
                disabled={deletingPromptId === selectedPromptId}
                variant="destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                {deletingPromptId === selectedPromptId ? "Deleting..." : "Delete Prompt"}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 3. Version Selector with + button (only show if there are versions) */}
      {sortedVersions.length > 0 && (
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors min-w-[70px] cursor-pointer outline-none data-[open]:bg-[var(--muted)]/50">
              <GitBranch className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
              <span className="truncate flex-1 text-left">
                v{selectedVersion?.version ?? sortedVersions[sortedVersions.length - 1]?.version}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[120px]">
              {sortedVersions.map((v) => (
                <DropdownMenuItem
                  key={v.id}
                  onClick={() => onSelectVersion(v.id)}
                  className={v.id === selectedVersionId ? "bg-[var(--muted)]/50" : ""}
                >
                  <div className="flex items-center gap-2">
                    <ArcadeBadge text={`v${v.version}`} variant={getVersionVariant(v)} className="text-[10px]" />
                    {v.version === currentVersion && (
                      <span className="text-[10px] text-[var(--muted-foreground)]">(latest)</span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ArcadeButton
            variant="outline"
            size="sm"
            onClick={onNewVersion}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-3 w-3" />
          </ArcadeButton>
        </div>
      )}

      {/* Prompt Name (Editable) */}
      <div className="min-w-0 flex-1 max-w-[180px]">
        {isEditingName ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-2 py-1 text-sm bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Prompt name..."
              maxLength={100}
            />
            <button
              type="button"
              onClick={handleSaveEdit}
              className="p-1 rounded hover:bg-[var(--muted)] text-green-500"
              aria-label="Save name"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="p-1 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
              aria-label="Cancel edit"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 text-sm font-medium hover:text-[var(--primary)] transition-colors truncate w-full"
          >
            <span className="truncate">{promptTitle || "Untitled Prompt"}</span>
            <Pencil className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
          </button>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Save Button */}
        <ArcadeButton
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={!promptContent.trim() || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-3 w-3 mr-1" />
              Save
            </>
          )}
        </ArcadeButton>

        {/* Generate Button */}
        <ArcadeButton
          size="sm"
          onClick={handleGenerateClick}
          disabled={isGenerating || !promptContent.trim() || selectedModels.length === 0}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {selectedModels.length > 1 ? `${completedCount}/${selectedModels.length}` : "Gen..."}
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-1" />
              Generate
              {selectedModels.length > 0 && (
                <span className="ml-0.5 opacity-70">({selectedModels.length})</span>
              )}
            </>
          )}
        </ArcadeButton>

        {/* Credits Display */}
        {selectedModels.length > 0 && (
          <div className="flex items-center gap-1">
            {hasByok && (
              <span className="text-[9px] text-[var(--muted-foreground)]">+BYOK</span>
            )}
            <ArcadeBadge text={`${totalCredits}cr`} variant="neon" className="text-[10px]" />
          </div>
        )}

        {/* Play Game Button */}
        {activeGameId && !isGenerating && (
          <ArcadeButton
            variant="glow"
            size="sm"
            onClick={onPlayGame}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Play
          </ArcadeButton>
        )}
      </div>

      {/* Credits Badge */}
      <div className="flex items-center shrink-0 border-l border-[var(--border)] pl-3">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
        ) : credits ? (
          <ArcadeBadge text={`${credits.balance} credits`} variant="neon" />
        ) : null}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prompt? Games created from it will remain visible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <ArcadeButton variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </ArcadeButton>
            <ArcadeButton
              onClick={handleConfirmDelete}
              disabled={deletingPromptId === promptToDelete}
              className="bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90"
            >
              {deletingPromptId === promptToDelete ? "Deleting..." : "Delete"}
            </ArcadeButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
