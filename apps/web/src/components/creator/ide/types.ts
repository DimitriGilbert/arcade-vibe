import type { Dispatch, SetStateAction } from "react";
import type {
  Visibility,
  ModelSelection,
  GenerationStatus,
  ThemeNode,
  PromptNode,
} from "@/components/creator/filebrowser/types";
import type { GameStatus } from "@/lib/trpc-types";

export type {
  Visibility,
  ModelSelection,
  GenerationStatus,
  ThemeNode,
  PromptNode,
  GameStatus,
};

export interface GameNode {
  id: string;
  name: string | null;
  modelName: string | null;
  modelProvider: string | null;
  status: GameStatus;
  createdAt: string;
  gameId: string | null;
  isSubmitted: boolean;
  promptId: string;
  isTransient?: boolean;
  modelSelectionId?: string | null;
}

export type EditorTheme = "github-dark" | "github-light";

export interface IDETab {
  id: string;
  type: "prompt" | "game";
  label: string;
  modelKey?: string;
  modelName?: string;
  gameStatus?: GameStatus;
  modelSelectionId?: string;
  isTransient?: boolean;
}

export interface IDESelection {
  themeId: string | null;
  promptId: string | null;
  openTabs: IDETab[];
  activeTabId: string;
}

export interface ContextMenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

export interface ContextMenuDivider {
  type: "divider";
}

export type ContextMenuItemOrDivider = ContextMenuItem | ContextMenuDivider;

export interface ContextMenuState {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItemOrDivider[];
}

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  variant: "default" | "destructive";
  onConfirm: () => void;
}

export interface IDEState {
  selection: IDESelection;
  setSelection: Dispatch<SetStateAction<IDESelection>>;
  expandedThemes: string[];
  expandedPrompts: string[];
  promptContent: string;
  setPromptContent: (content: string) => void;
  promptTitle: string;
  setPromptTitle: (title: string) => void;
  gameName: string;
  setGameName: (name: string) => void;
  originalContent: string;
  originalTitle: string;
  originalVisibility: Visibility;
  visibility: Visibility;
  setVisibility: (visibility: Visibility) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  selectedModels: ModelSelection[];
  configPanelCollapsed: boolean;
  setConfigPanelCollapsed: (collapsed: boolean) => void;
  contextMenu: ContextMenuState;
  showContextMenu: (x: number, y: number, items: ContextMenuItemOrDivider[]) => void;
  hideContextMenu: () => void;
  confirmDialog: ConfirmDialogState;
  showConfirmDialog: (options: {
    title: string;
    message: string;
    confirmText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  }) => void;
  hideConfirmDialog: () => void;
  isGenerating: boolean;
  themesLoading: boolean;
  promptsLoading: boolean;
  gamesLoading: boolean;
  generationError: string | null;
  clearGenerationError: () => void;
  cursorPosition: { line: number; column: number };
  setCursorPosition: (line: number, column: number) => void;
}
