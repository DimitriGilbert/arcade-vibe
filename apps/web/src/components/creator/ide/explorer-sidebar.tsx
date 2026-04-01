import { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus,
  Save,
  Folder,
  FolderOpen,
  FileCode,
  Play,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { GuidanceBubble } from "./creator-guidance";
import type {
  ThemeNode,
  PromptNode,
  GameNode,
  GameStatus,
  ContextMenuItemOrDivider,
  IDESelection,
} from "./types";
import type { CreatorGuidanceState } from "./creator-guidance";

interface ExplorerSidebarProps {
  themes: ThemeNode[];
  selection: IDESelection;
  expandedThemes: string[];
  expandedPrompts: string[];
  themesLoading: boolean;
  isGenerating: boolean;
  isDirty: boolean;
  isNewPrompt: boolean;
  promptTitle: string;
  prompts: PromptNode[] | undefined;
  promptsLoading: boolean;
  games: GameNode[];
  gamesLoading: boolean;
  gamesByPromptId: Record<string, GameNode[]>;
  gamesLoadingByPromptId: Record<string, boolean>;
  onSelectTheme: (themeId: string) => void;
  onSelectPrompt: (promptId: string) => void;
  onSelectGame: (gameId: string) => void;
  onNewPrompt: () => void;
  onSave: () => void;
  onDiscardNewPrompt: () => void;
  onPromptTitleChange: (title: string) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  toggleThemeExpanded: (themeId: string) => void;
  togglePromptExpanded: (promptId: string) => void;
  showContextMenu: (x: number, y: number, items: ContextMenuItemOrDivider[]) => void;
  showConfirmDialog: (options: {
    title: string;
    message: string;
    confirmText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  }) => void;
  updatePromptMutation: {
    mutate: (input: { id: string; title: string }) => void;
    isPending: boolean;
  };
  deletePromptMutation: {
    mutate: (input: { id: string }) => void;
    isPending: boolean;
  };
  updateGameMutation: {
    mutate: (input: { id: string; name: string }) => void;
    isPending: boolean;
  };
  deleteGameMutation: {
    mutate: (input: { id: string }) => void;
    isPending: boolean;
  };
  toggleGamePublishedMutation: {
    mutate: (input: { id: string; isSubmitted: boolean }) => void;
    isPending: boolean;
  };
  guidance: CreatorGuidanceState | null;
  onDismissGuidance: () => void;
}

function getStatusIcon(status: GameStatus) {
  switch (status) {
    case "generating":
      return <Sparkles className="h-3 w-3 text-cyan-400 animate-spin" />;
    case "completed":
      return <CheckCircle className="h-3 w-3 text-green-400" />;
    case "failed":
      return <AlertCircle className="h-3 w-3 text-red-400" />;
    default:
      return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
}

function GameNodeComponent({
  game,
  isSelected,
  onSelect,
  onContextMenu,
  updateGameMutation,
  deleteGameMutation,
  toggleGamePublishedMutation,
  showConfirmDialog,
}: {
  game: GameNode;
  isSelected: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  updateGameMutation: ExplorerSidebarProps["updateGameMutation"];
  deleteGameMutation: ExplorerSidebarProps["deleteGameMutation"];
  toggleGamePublishedMutation: ExplorerSidebarProps["toggleGamePublishedMutation"];
  showConfirmDialog: ExplorerSidebarProps["showConfirmDialog"];
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(game.name ?? game.modelName ?? "");

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue.length < 1) {
      toast.error("Name cannot be empty");
      return;
    }
    updateGameMutation.mutate({ id: game.id, name: trimmedValue });
  };

  const handleTogglePublish = () => {
    toggleGamePublishedMutation.mutate({
      id: game.id,
      isSubmitted: !game.isSubmitted,
    });
  };

  const handleDelete = () => {
    showConfirmDialog({
      title: "Delete Game",
      message: `Are you sure you want to delete "${game.name ?? game.modelName ?? "this game"}"? This cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: () => {
        deleteGameMutation.mutate({ id: game.id });
      },
    });
  };

  const handleContextMenuInternal = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group flex items-center gap-2 px-2 py-1 pl-6 cursor-pointer w-full text-left",
        isSelected && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenuInternal}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect();
        }
      }}
    >
      <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />

      {isEditing ? (
        <input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => {
            handleSave();
            setIsEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSave();
              setIsEditing(false);
            }
            if (e.key === "Escape") {
              setIsEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
        />
      ) : (
        <>
          <span className="flex-1 truncate text-sm">
            {game.name ?? game.modelName ?? "Untitled"}
          </span>
          {getStatusIcon(game.status)}
          {isHovered && game.gameId && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`/game/${game.gameId}`, "_blank");
                }}
                className="p-0.5 hover:bg-sidebar-accent rounded shrink-0"
                title="Play"
              >
                <Play className="h-3 w-3 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePublish();
                }}
                className="p-0.5 hover:bg-sidebar-accent rounded shrink-0"
                title={game.isSubmitted ? "Unpublish" : "Publish"}
              >
                {game.isSubmitted ? (
                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Eye className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function PromptFolderComponent({
  prompt,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  promptsLoading,
  games,
  gamesLoading,
  selection,
  onSelectGame,
  showContextMenu,
  showConfirmDialog,
  updatePromptMutation,
  deletePromptMutation,
  updateGameMutation,
  deleteGameMutation,
  toggleGamePublishedMutation,
}: {
  prompt: PromptNode;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  promptsLoading: boolean;
  games: GameNode[];
  gamesLoading: boolean;
  selection: IDESelection;
  onSelectGame: (gameId: string) => void;
  showContextMenu: ExplorerSidebarProps["showContextMenu"];
  showConfirmDialog: ExplorerSidebarProps["showConfirmDialog"];
  updatePromptMutation: ExplorerSidebarProps["updatePromptMutation"];
  deletePromptMutation: ExplorerSidebarProps["deletePromptMutation"];
  updateGameMutation: ExplorerSidebarProps["updateGameMutation"];
  deleteGameMutation: ExplorerSidebarProps["deleteGameMutation"];
  toggleGamePublishedMutation: ExplorerSidebarProps["toggleGamePublishedMutation"];
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(prompt.title ?? "");

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue.length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }
    updatePromptMutation.mutate({ id: prompt.id, title: trimmedValue });
  };

  const handleDelete = () => {
    showConfirmDialog({
      title: "Delete Prompt",
      message: `Are you sure you want to delete "${prompt.title ?? "Untitled"}"? All associated games will also be deleted.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: () => {
        deletePromptMutation.mutate({ id: prompt.id });
      },
    });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
      {
        label: "Edit Name",
        icon: Pencil,
        onClick: () => setIsEditing(true),
      },
      {
        label: "Delete",
        icon: Trash2,
        onClick: handleDelete,
        variant: "destructive",
      },
    ]);
  };

  return (
    <div className="ml-2">
      <div
        className={cn(
          "group flex items-center gap-2 px-2 py-1 cursor-pointer",
          isSelected && "bg-sidebar-accent text-sidebar-accent-foreground"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={handleContextMenu}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-0.5 hover:bg-sidebar-accent rounded"
        >
          <ChevronRight
            className={cn("h-4 w-4 shrink-0 text-muted-foreground", isExpanded && "rotate-90")}
          />
        </button>
        <div
          role="button"
          tabIndex={0}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          onClick={onSelect}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onSelect();
            }
          }}
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}

          {isEditing ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => {
                handleSave();
                setIsEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                  setIsEditing(false);
                }
                if (e.key === "Escape") {
                  setIsEditing(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
            />
          ) : (
            <>
              <span className="flex-1 truncate text-sm">
                {prompt.title ?? "Untitled"}
              </span>
              {isHovered && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="p-0.5 hover:bg-sidebar-accent rounded shrink-0"
                  title="Edit name"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </>
          )}

          <span className="text-xs text-muted-foreground shrink-0">
            v{prompt.version}
          </span>
        </div>
      </div>
      {isExpanded && (
        <div className="ml-4 border-l border-border pl-1">
          {gamesLoading ? (
            <div className="flex items-center gap-2 px-2 py-1">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading games...</span>
            </div>
          ) : games.length > 0 ? (
            games.map((game) => (
              <GameNodeComponent
                key={game.id}
                game={game}
                isSelected={game.id === selection.activeTabId}
                onSelect={() => onSelectGame(game.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  showContextMenu(e.clientX, e.clientY, [
                    {
                      label: "Play",
                      icon: Play,
                      onClick: () => {
                        if (game.gameId) {
                          window.open(`/game/${game.gameId}`, "_blank");
                        }
                      },
                      disabled: !game.gameId,
                    },
                    { type: "divider" },
                    {
                      label: "Edit Name",
                      icon: Pencil,
                      onClick: () => {
                        // This would need to be handled differently
                        // For now, we'll just set a flag that the parent component can read
                      },
                    },
                    {
                      label: game.isSubmitted ? "Unpublish" : "Publish",
                      icon: game.isSubmitted ? EyeOff : Eye,
                      onClick: () => {
                        toggleGamePublishedMutation.mutate({
                          id: game.id,
                          isSubmitted: !game.isSubmitted,
                        });
                      },
                    },
                    {
                      label: "Delete",
                      icon: Trash2,
                      onClick: () => {
                        showConfirmDialog({
                          title: "Delete Game",
                          message: `Are you sure you want to delete "${game.name ?? game.modelName ?? "this game"}"? This cannot be undone.`,
                          confirmText: "Delete",
                          variant: "destructive",
                          onConfirm: () => {
                            deleteGameMutation.mutate({ id: game.id });
                          },
                        });
                      },
                      variant: "destructive",
                    },
                  ]);
                }}
                updateGameMutation={updateGameMutation}
                deleteGameMutation={deleteGameMutation}
                toggleGamePublishedMutation={toggleGamePublishedMutation}
                showConfirmDialog={showConfirmDialog}
              />
            ))
          ) : (
            <div className="px-2 py-1">
              <span className="text-xs text-muted-foreground">No games yet</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewPromptComponent({
  title,
  onTitleChange,
  onDiscard,
  onSave,
  showNameHint,
  onDismissGuidance,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  onDiscard: () => void;
  onSave: () => void;
  showNameHint: boolean;
  onDismissGuidance: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onDiscard();
    }
  };

  return (
    <div className="relative ml-2">
      {showNameHint ? (
        <div className="absolute left-0 top-full z-10 mt-2 max-w-52">
          <GuidanceBubble
            text="Name the prompt, then press Enter."
            onDismiss={onDismissGuidance}
          />
        </div>
      ) : null}
      <div className="group flex items-center gap-2 px-2 py-1 bg-primary/5 border border-primary/20 rounded">
        <FileText className="h-4 w-4 shrink-0 text-primary animate-pulse" />
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter prompt title..."
          className="flex-1 bg-transparent outline-none text-sm italic placeholder:text-muted-foreground/50"
        />
        <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded shrink-0 animate-pulse">
          new
        </span>
        <button
          type="button"
          onClick={onDiscard}
          className="p-0.5 hover:bg-sidebar-accent rounded shrink-0"
          title="Discard (Esc)"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function ThemeNodeComponent({
  theme,
  prompts,
  promptsLoading,
  games,
  gamesLoading,
  gamesByPromptId,
  gamesLoadingByPromptId,
  expandedPrompts,
  selection,
  isExpanded,
  isSelected,
  isNewPrompt,
  newPromptTitle,
  onToggle,
  onSelect,
  onTogglePrompt,
  onSelectPrompt,
  onSelectGame,
  onNewPromptTitleChange,
  onDiscardNewPrompt,
  onSave,
  showContextMenu,
  showConfirmDialog,
  updatePromptMutation,
  deletePromptMutation,
  updateGameMutation,
  deleteGameMutation,
  toggleGamePublishedMutation,
  guidance,
  onDismissGuidance,
}: {
  theme: ThemeNode;
  prompts: PromptNode[] | undefined;
  promptsLoading: boolean;
  games: GameNode[];
  gamesLoading: boolean;
  gamesByPromptId: Record<string, GameNode[]>;
  gamesLoadingByPromptId: Record<string, boolean>;
  expandedPrompts: string[];
  selection: IDESelection;
  isExpanded: boolean;
  isSelected: boolean;
  isNewPrompt: boolean;
  newPromptTitle: string;
  onToggle: () => void;
  onSelect: () => void;
  onTogglePrompt: (promptId: string) => void;
  onSelectPrompt: (promptId: string) => void;
  onSelectGame: (gameId: string) => void;
  onNewPromptTitleChange: (title: string) => void;
  onDiscardNewPrompt: () => void;
  onSave: () => void;
  showContextMenu: ExplorerSidebarProps["showContextMenu"];
  showConfirmDialog: ExplorerSidebarProps["showConfirmDialog"];
  updatePromptMutation: ExplorerSidebarProps["updatePromptMutation"];
  deletePromptMutation: ExplorerSidebarProps["deletePromptMutation"];
  updateGameMutation: ExplorerSidebarProps["updateGameMutation"];
  deleteGameMutation: ExplorerSidebarProps["deleteGameMutation"];
  toggleGamePublishedMutation: ExplorerSidebarProps["toggleGamePublishedMutation"];
  guidance: CreatorGuidanceState | null;
  onDismissGuidance: () => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <div
        className={cn(
          "group flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors",
          isSelected && "bg-sidebar-accent/50"
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-0.5 hover:bg-sidebar-accent rounded"
        >
          <ChevronRight
            className={cn("h-4 w-4 shrink-0 text-muted-foreground", isExpanded && "rotate-90")}
          />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
          onClick={onSelect}
        >
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-blue-500" />
          )}
          <span className="text-sm font-medium truncate flex-1">{theme.title}</span>
          {theme.isActive && (
            <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded shrink-0">
              Active
            </span>
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="ml-2 pb-2">
          {isNewPrompt && (
            <NewPromptComponent
              title={newPromptTitle}
              onTitleChange={onNewPromptTitleChange}
              onDiscard={onDiscardNewPrompt}
              onSave={onSave}
              showNameHint={guidance?.currentStep === "name"}
              onDismissGuidance={onDismissGuidance}
            />
          )}
          {promptsLoading ? (
            <div className="flex items-center gap-2 px-2 py-1">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading prompts...</span>
            </div>
          ) : prompts && prompts.length > 0 ? (
            prompts.map((prompt) => (
              <PromptFolderComponent
                key={prompt.id}
                prompt={prompt}
                isExpanded={expandedPrompts.includes(prompt.id)}
                isSelected={prompt.id === selection.promptId}
                onToggle={() => onTogglePrompt(prompt.id)}
                onSelect={() => onSelectPrompt(prompt.id)}
                promptsLoading={promptsLoading}
                games={gamesByPromptId[prompt.id] ?? (prompt.id === selection.promptId ? games : [])}
                gamesLoading={gamesLoadingByPromptId[prompt.id] ?? (prompt.id === selection.promptId && gamesLoading)}
                selection={selection}
                onSelectGame={onSelectGame}
                showContextMenu={showContextMenu}
                showConfirmDialog={showConfirmDialog}
                updatePromptMutation={updatePromptMutation}
                deletePromptMutation={deletePromptMutation}
                updateGameMutation={updateGameMutation}
                deleteGameMutation={deleteGameMutation}
                toggleGamePublishedMutation={toggleGamePublishedMutation}
              />
            ))
          ) : !isNewPrompt ? (
            <div className="px-2 py-1">
              <span className="text-xs text-muted-foreground">No prompts yet</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function ExplorerSidebar({
  themes,
  selection,
  expandedThemes,
  expandedPrompts,
  themesLoading,
  isGenerating,
  isDirty,
  isNewPrompt,
  promptTitle,
  prompts,
  promptsLoading,
  games,
  gamesLoading,
  gamesByPromptId,
  gamesLoadingByPromptId,
  onSelectTheme,
  onSelectPrompt,
  onSelectGame,
  onNewPrompt,
  onSave,
  onDiscardNewPrompt,
  onPromptTitleChange,
  onCollapseAll,
  onExpandAll,
  toggleThemeExpanded,
  togglePromptExpanded,
  showContextMenu,
  showConfirmDialog,
  updatePromptMutation,
  deletePromptMutation,
  updateGameMutation,
  deleteGameMutation,
  toggleGamePublishedMutation,
  guidance,
  onDismissGuidance,
}: ExplorerSidebarProps) {
  const hasExpandedItems = expandedThemes.length > 0 || expandedPrompts.length > 0;

  const themesForDisplay = useMemo(() => {
    if (!themes) return [];
    return themes;
  }, [themes]);

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="relative flex items-center gap-1 px-2 py-1.5 border-b border-border shrink-0">
        <button
          type="button"
          onClick={onNewPrompt}
          className="p-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground disabled:opacity-50"
          title="New Prompt (Ctrl+N)"
          disabled={isGenerating}
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onSave}
          className="p-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground disabled:opacity-50"
          title="Save (Ctrl+S)"
          disabled={(!isDirty && !isNewPrompt) || isGenerating}
        >
          <Save className="h-4 w-4" />
        </button>

        <div className="w-px h-4 bg-sidebar-border mx-1" />

        <button
          type="button"
          onClick={onCollapseAll}
          className="p-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground disabled:opacity-50"
          title="Collapse All"
          disabled={!hasExpandedItems}
        >
          <ChevronsDownUp className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onExpandAll}
          className="p-1.5 rounded hover:bg-sidebar-accent text-sidebar-foreground"
          title="Expand All"
        >
          <ChevronsUpDown className="h-4 w-4" />
        </button>

        {guidance?.currentStep === "create" ? (
          <div className="absolute left-2 top-full z-10 mt-2 max-w-52">
            <GuidanceBubble
              text={
                selection.themeId
                  ? "Start here: create a new prompt."
                  : "Select a theme, then create a new prompt."
              }
              onDismiss={onDismissGuidance}
            />
          </div>
        ) : null}
      </div>

      <ScrollArea className="flex-1">
        {themesLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : themesForDisplay.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No themes available
          </div>
        ) : (
          <div className="py-1">
            {themesForDisplay.map((theme) => (
              <ThemeNodeComponent
                key={theme.id}
                theme={theme}
                prompts={theme.id === selection.themeId ? prompts : undefined}
                promptsLoading={theme.id === selection.themeId && promptsLoading}
                games={games}
                gamesLoading={gamesLoading}
                gamesByPromptId={gamesByPromptId}
                gamesLoadingByPromptId={gamesLoadingByPromptId}
                expandedPrompts={expandedPrompts}
                selection={selection}
                isExpanded={expandedThemes.includes(theme.id)}
                isSelected={theme.id === selection.themeId}
                isNewPrompt={isNewPrompt && theme.id === selection.themeId}
                newPromptTitle={promptTitle}
                onToggle={() => toggleThemeExpanded(theme.id)}
                onSelect={() => onSelectTheme(theme.id)}
                onTogglePrompt={togglePromptExpanded}
                onSelectPrompt={onSelectPrompt}
                onSelectGame={onSelectGame}
                onNewPromptTitleChange={onPromptTitleChange}
                onDiscardNewPrompt={onDiscardNewPrompt}
                onSave={onSave}
                showContextMenu={showContextMenu}
                showConfirmDialog={showConfirmDialog}
                updatePromptMutation={updatePromptMutation}
                deletePromptMutation={deletePromptMutation}
                updateGameMutation={updateGameMutation}
                deleteGameMutation={deleteGameMutation}
                toggleGamePublishedMutation={toggleGamePublishedMutation}
                guidance={guidance}
                onDismissGuidance={onDismissGuidance}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
