"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Check,
  X,
  Loader2,
  Save,
  Play,
  ExternalLink,
  ChevronDown,
  Plus,
  GitBranch,
  Trash2,
  FileText,
  Palette,
} from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import type { CreditBalanceInfo, ThemeList, Visibility, PromptVersion, PromptListMineOutput } from "@/lib/trpc-types";
import type { ModelSelection } from "./types";
import { cn } from "@/lib/utils";

interface PromptWithTheme {
  id: string;
  title: string | null;
  content: string;
  version: number;
  updatedAt: string;
  visibility?: Visibility;
  themeId: string;
  themeTitle: string;
}

interface WorkbenchHeaderProps {
  promptTitle: string;
  onPromptTitleChange: (title: string) => void;
  credits: CreditBalanceInfo | null | undefined;
  isLoading?: boolean;
  // Theme data (for selector grouping)
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
  // Optional game name override
  gameName?: string;
  onGameNameChange?: (name: string) => void;
}

export function WorkbenchHeader({
  promptTitle,
  onPromptTitleChange,
  credits,
  isLoading,
  themes,
  themesLoading,
  selectedTheme,
  onSelectTheme,
  selectedPromptId,
  onSelectPrompt,
  onNewPrompt,
  onDeletePrompt,
  deletingPromptId,
  versions,
  currentVersion,
  selectedVersionId,
  onSelectVersion,
  selectedModels,
  promptContent,
  isGenerating,
  isSaving,
  completedCount,
  activeGameId,
  onGenerate,
  onSave,
  onPlayGame,
  gameName = "",
  onGameNameChange,
}: WorkbenchHeaderProps) {
  // State for prompt selector popover
  const [promptSelectorOpen, setPromptSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for inline title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(promptTitle);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  // Fetch ALL prompts with theme info for the unified selector
  const { data: allPrompts, isLoading: promptsLoading } = useQuery({
    queryKey: ["all-prompts-for-selector"],
    queryFn: async (): Promise<PromptWithTheme[]> => {
      const prompts = await trpcClient.prompts.listMine.query();
      // Join with themes client-side
      return prompts.map((p: PromptListMineOutput[number]) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        version: p.version,
        updatedAt: p.updatedAt,
        visibility: p.visibility,
        themeId: p.themeId,
        themeTitle: themes?.find(t => t.id === p.themeId)?.title ?? "Unknown",
      }));
    },
    enabled: !!themes,
  });

  // Group prompts by theme
  const promptsByTheme = useMemo(() => {
    if (!allPrompts || !themes) return new Map<string, PromptWithTheme[]>();
    
    const grouped = new Map<string, PromptWithTheme[]>();
    
    // Initialize all themes (even empty ones)
    for (const theme of themes) {
      grouped.set(theme.id, []);
    }
    
    // Group prompts by theme
    for (const prompt of allPrompts) {
      const existing = grouped.get(prompt.themeId) ?? [];
      existing.push(prompt);
      grouped.set(prompt.themeId, existing);
    }
    
    return grouped;
  }, [allPrompts, themes]);

  // Filter prompts by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return promptsByTheme;
    
    const filtered = new Map<string, PromptWithTheme[]>();
    
    for (const [themeId, prompts] of promptsByTheme) {
      const matching = prompts.filter(p => 
        (p.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matching.length > 0) {
        filtered.set(themeId, matching);
      }
    }
    
    return filtered;
  }, [promptsByTheme, searchQuery]);

  // Get current theme info
  const currentTheme = useMemo(() =>
    themes?.find(t => t.id === selectedTheme),
    [themes, selectedTheme]
  );

  // Sort versions
  const sortedVersions = useMemo(() => {
    if (!versions) return [];
    return [...versions].sort((a, b) => b.version - a.version); // Newest first
  }, [versions]);

  const selectedVersion = sortedVersions.find(v => v.id === selectedVersionId);

  // Calculate credits
  const totalCredits = useMemo(
    () => selectedModels.reduce((sum, m) => sum + m.creditCost, 0),
    [selectedModels]
  );
  const hasByok = selectedModels.some((m) => m.isByok);

  // Title editing handlers
  useEffect(() => {
    setEditTitleValue(promptTitle);
  }, [promptTitle]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleStartEditTitle = useCallback(() => {
    if (isGenerating) return;
    setEditTitleValue(promptTitle);
    setIsEditingTitle(true);
  }, [promptTitle, isGenerating]);

  const handleSaveTitle = useCallback(() => {
    onPromptTitleChange(editTitleValue.trim());
    setIsEditingTitle(false);
  }, [editTitleValue, onPromptTitleChange]);

  const handleCancelEditTitle = useCallback(() => {
    setEditTitleValue(promptTitle);
    setIsEditingTitle(false);
  }, [promptTitle]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEditTitle();
    }
  }, [handleSaveTitle, handleCancelEditTitle]);

  // Prompt selection handler
  const handleSelectPrompt = useCallback((promptId: string) => {
    onSelectPrompt(promptId);
    setPromptSelectorOpen(false);
    setSearchQuery("");
  }, [onSelectPrompt]);

  // New prompt handler
  const handleNewPrompt = useCallback(() => {
    onNewPrompt();
    setPromptSelectorOpen(false);
    setSearchQuery("");
    // Open title editing mode immediately
    setIsEditingTitle(true);
    setEditTitleValue("");
  }, [onNewPrompt]);

  // Delete handlers
  const handleDeleteClick = useCallback((promptId: string) => {
    setPromptToDelete(promptId);
    setDeleteDialogOpen(true);
    setPromptSelectorOpen(false);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (promptToDelete) {
      onDeletePrompt(promptToDelete);
    }
    setDeleteDialogOpen(false);
    setPromptToDelete(null);
  }, [promptToDelete, onDeletePrompt]);

  // Generate handler
  const handleGenerateClick = useCallback(() => {
    if (isEditingTitle) {
      onPromptTitleChange(editTitleValue.trim());
      setIsEditingTitle(false);
    }
    onGenerate();
  }, [isEditingTitle, editTitleValue, onPromptTitleChange, onGenerate]);

  return (
    <header className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] shrink-0">
      {/* ===== 1. THEME SELECTOR (ALWAYS VISIBLE) ===== */}
      <Select
        value={selectedTheme}
        onValueChange={(value) => { if (value) onSelectTheme(value); }}
        disabled={themesLoading || isGenerating}
      >
        <SelectTrigger size="sm" className="w-[140px]">
          <Palette className="h-3.5 w-3.5 mr-1.5 text-[var(--muted-foreground)]" />
          <SelectValue placeholder="Select theme">
            {themesLoading ? "Loading..." : currentTheme?.title || "Select theme"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start">
          {themes?.map((theme) => (
            <SelectItem key={theme.id} value={theme.id}>
              {theme.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ===== 2. PROMPT SELECTOR ===== */}
      
      <Popover open={promptSelectorOpen} onOpenChange={setPromptSelectorOpen}>
        <PopoverTrigger
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors min-w-[160px] max-w-[240px] cursor-pointer text-left group"
          disabled={isGenerating}
        >
          {/* Prompt Icon */}
          <FileText className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          
          {/* Title Area */}
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-transparent border-none outline-none text-sm font-medium"
                placeholder="Untitled"
                maxLength={100}
              />
            ) : (
              <div className="truncate text-sm font-medium">
                {promptTitle || "New Prompt"}
              </div>
            )}
          </div>
          
          {/* Version badge (if versions exist) */}
          {sortedVersions.length > 0 && (
            <ArcadeBadge
              text={`v${selectedVersion?.version ?? currentVersion ?? 1}`}
              variant={isEditingTitle ? "default" : "neon"}
              className="shrink-0"
            />
          )}
          
          {/* Dropdown arrow */}
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] opacity-50 group-hover:opacity-100 transition-opacity" />
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[320px] p-0" 
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search prompts..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[300px]">
              {promptsLoading || themesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No prompts found.</CommandEmpty>
                  
                  {/* New Prompt Option */}
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleNewPrompt}
                      className="cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-2 text-[var(--primary)]" />
                      <span className="text-[var(--primary)]">New Prompt</span>
                    </CommandItem>
                  </CommandGroup>
                  
                  {/* Prompt groups by theme */}
                  {Array.from(filteredGroups.entries()).map(([themeId, prompts]) => {
                    const theme = themes?.find(t => t.id === themeId);
                    if (!theme || prompts.length === 0) return null;
                    
                    return (
                      <CommandGroup key={themeId} heading={theme.title}>
                        {prompts.map((prompt) => {
                          const isSelected = prompt.id === selectedPromptId;
                          return (
                            <CommandItem
                              key={prompt.id}
                              value={`${themeId}-${prompt.id}`}
                              onSelect={() => handleSelectPrompt(prompt.id)}
                              className={cn(
                                "cursor-pointer flex items-center justify-between",
                                isSelected && "bg-[var(--muted)]"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {isSelected && (
                                  <span className="text-[var(--primary)]">●</span>
                                )}
                                <span className="truncate">
                                  {prompt.title || "Untitled"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <ArcadeBadge text={`v${prompt.version}`} variant="pixel" />
                                {isSelected && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(prompt.id);
                                    }}
                                    disabled={deletingPromptId === prompt.id}
                                    className="p-1 hover:bg-[var(--destructive)]/20 rounded text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    );
                  })}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick Edit Title Button (when not editing) */}
      {!isEditingTitle && (
        <button
          type="button"
          onClick={handleStartEditTitle}
          disabled={isGenerating}
          className="p-1.5 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          title="Edit title"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Title Edit Actions (when editing) */}
      {isEditingTitle && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSaveTitle}
            className="p-1.5 rounded hover:bg-[var(--muted)] text-green-500"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCancelEditTitle}
            className="p-1.5 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Version Dropdown (separate from prompt selector) */}
      {sortedVersions.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors cursor-pointer"
            disabled={isGenerating}
          >
            <GitBranch className="h-3 w-3 text-[var(--muted-foreground)]" />
            <span>v{selectedVersion?.version ?? currentVersion ?? 1}</span>
            <ChevronDown className="h-3 w-3 text-[var(--muted-foreground)]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            {sortedVersions.map((v) => (
              <DropdownMenuItem
                key={v.id}
                onClick={() => onSelectVersion(v.id)}
                className={v.id === selectedVersionId ? "bg-[var(--muted)]/50" : ""}
              >
                <div className="flex items-center gap-2">
                  <ArcadeBadge 
                    text={`v${v.version}`} 
                    variant={v.version === currentVersion ? "neon" : "default"} 
                  />
                  {v.version === currentVersion && (
                    <span className="text-xs text-[var(--muted-foreground)]">(latest)</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* ===== RIGHT: GAME NAME + ACTIONS ===== */}
      
      {/* Game Name - defaults to prompt title */}
      {onGameNameChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted-foreground)]">Game:</span>
          <input
            type="text"
            value={gameName}
            onChange={(e) => onGameNameChange(e.target.value)}
            placeholder={promptTitle || "Game name"}
            maxLength={100}
            className="w-28 px-2 py-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            disabled={isGenerating}
          />
        </div>
      )}

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

      {/* Credits for generation */}
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

      {/* User Credits */}
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
