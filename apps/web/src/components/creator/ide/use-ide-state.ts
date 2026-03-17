import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";
import type {
  IDESelection,
  IDETab,
  GameNode,
  ContextMenuState,
  ContextMenuItemOrDivider,
  ConfirmDialogState,
  ThemeNode,
  PromptNode,
  Visibility,
  ModelSelection,
} from "./types";
import type { GameListItem } from "@/lib/trpc-types";

const PROMPT_TAB_ID = "prompt.md";

function createPromptTab(): IDETab {
  return {
    id: PROMPT_TAB_ID,
    type: "prompt",
    label: "prompt.md",
  };
}

function createGameTab(game: GameNode): IDETab {
  return {
    id: game.id,
    type: "game",
    label: game.name ?? `Game ${game.id.slice(0, 8)}`,
    modelKey: game.modelProvider ?? undefined,
  };
}

export interface UseIDEStateOptions {
  urlPromptId?: string;
  urlForkId?: string;
}

export interface UseIDEStateReturn {
  selection: IDESelection;
  setSelection: React.Dispatch<React.SetStateAction<IDESelection>>;
  expandedThemes: string[];
  setExpandedThemes: React.Dispatch<React.SetStateAction<string[]>>;
  expandedPrompts: string[];
  setExpandedPrompts: React.Dispatch<React.SetStateAction<string[]>>;
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
  selectedModels: ModelSelection[];
  setSelectedModels: React.Dispatch<React.SetStateAction<ModelSelection[]>>;
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
  themes: ThemeNode[] | undefined;
  prompts: PromptNode[] | undefined;
  games: GameNode[];
  gamesByPromptId: Record<string, GameNode[]>;
  gamesLoadingByPromptId: Record<string, boolean>;
  handleSelectTheme: (themeId: string) => void;
  handleSelectPrompt: (promptId: string) => Promise<void>;
  handleSelectGame: (gameId: string) => void;
  handleNewPrompt: () => void;
  handleSave: () => Promise<void>;
  switchToTab: (tabId: string) => void;
  closeGameTab: (gameId: string) => void;
  openPromptTabs: (promptId: string, games: GameNode[]) => void;
  handleToggleThemeExpand: (themeId: string) => void;
  handleTogglePromptExpand: (promptId: string) => void;
  currentPromptId: string | null;
  isForking: boolean;
  forkOriginalPromptId: string | null;
  clearFork: () => void;
}

export function useIDEState(options?: UseIDEStateOptions): UseIDEStateReturn {
  const { urlPromptId, urlForkId } = options ?? {};
  const queryClient = useQueryClient();

  const [selection, setSelection] = useState<IDESelection>({
    themeId: null,
    promptId: null,
    openTabs: [],
    activeTabId: PROMPT_TAB_ID,
  });

  const [expandedThemes, setExpandedThemes] = useState<string[]>([]);
  const [expandedPrompts, setExpandedPrompts] = useState<string[]>([]);
  const [promptContent, setPromptContentState] = useState("");
  const [promptTitle, setPromptTitleState] = useState("");
  const [gameName, setGameName] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalVisibility, setOriginalVisibility] = useState<Visibility>("private");
  const [visibility, setVisibilityState] = useState<Visibility>("private");
  const [selectedModels, setSelectedModels] = useState<ModelSelection[]>([]);
  const [configPanelCollapsed, setConfigPanelCollapsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [cursorPosition, setCursorPositionState] = useState({ line: 1, column: 1 });
  const [isForking, setIsForking] = useState(!!urlForkId);
  const [forkOriginalPromptId, setForkOriginalPromptId] = useState<string | null>(urlForkId ?? null);

  const setCursorPosition = useCallback((line: number, column: number) => {
    setCursorPositionState({ line, column });
  }, []);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    open: false,
    x: 0,
    y: 0,
    items: [],
  });

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    variant: "default",
    onConfirm: () => {},
  });

  const confirmDialogRef = useRef(confirmDialog);
  confirmDialogRef.current = confirmDialog;

  const isDirty = useMemo(() => {
    return (
      promptContent !== originalContent ||
      promptTitle !== originalTitle ||
      visibility !== originalVisibility
    );
  }, [promptContent, promptTitle, visibility, originalContent, originalTitle, originalVisibility]);

  const { data: themesData, isLoading: themesLoading } = useQuery({
    queryKey: ["themes"],
    queryFn: () => trpcClient.themes.list.query(),
  });

  const themes = useMemo(() => {
    return themesData?.map((t): ThemeNode => ({
      id: t.id,
      title: t.title,
      status: t.status,
      isActive: t.status === "active",
    }));
  }, [themesData]);

  const { data: promptsData, isLoading: promptsLoading } = useQuery({
    queryKey: ["prompts-by-theme", selection.themeId],
    queryFn: async () => {
      if (!selection.themeId) return [];
      return await trpcClient.prompts.listMineByTheme.query({
        themeId: selection.themeId,
      });
    },
    enabled: !!selection.themeId,
  });

  const prompts = useMemo(() => {
    if (!promptsData || !selection.themeId) return undefined;
    const themeId = selection.themeId;
    return promptsData.map((p): PromptNode => ({
      id: p.id,
      title: p.title,
      content: p.content,
      version: p.version,
      visibility: p.visibility ?? "private",
      updatedAt: p.updatedAt,
      themeId,
    }));
  }, [promptsData, selection.themeId]);

  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ["games-by-prompt", selection.promptId],
    queryFn: async () => {
      if (!selection.promptId) return [];
      const result = await trpcClient.games.listByPrompt.query({ promptId: selection.promptId });
      return result ?? [];
    },
    enabled: !!selection.promptId,
  });

  const games = useMemo(() => {
    if (!gamesData) return [];
    return gamesData.map((g: GameListItem): GameNode => ({
      id: g.id,
      name: g.name,
      modelName: g.modelName,
      modelProvider: g.modelProvider,
      status: g.status,
      createdAt: g.createdAt,
      gameId: g.id,
      isSubmitted: g.isSubmitted,
      promptId: g.promptId ?? "",
    }));
  }, [gamesData]);

  const gamesByPromptIdRef = useRef<Record<string, GameNode[]>>({});
  const gamesLoadingByPromptIdRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (themes && expandedThemes.length === 0) {
      const firstActive = themes.find((t) => t.isActive);
      if (firstActive) {
        setExpandedThemes([firstActive.id]);
        setSelection((prev) => ({ ...prev, themeId: firstActive.id }));
      }
    }
  }, [themes, expandedThemes.length]);

  useEffect(() => {
    if (games.length > 0 && selection.promptId) {
      const currentTabs = selection.openTabs;
      const hasPromptTab = currentTabs.some((t) => t.id === PROMPT_TAB_ID);
      const gameIds = new Set(games.map((g) => g.id));
      const existingGameTabIds = new Set(
        currentTabs.filter((t) => t.type === "game").map((t) => t.id)
      );

      const needsUpdate = !hasPromptTab || 
        games.some((g) => !existingGameTabIds.has(g.id));

      if (needsUpdate && hasPromptTab) {
        const newGameTabs = games
          .filter((g) => !existingGameTabIds.has(g.id))
          .map(createGameTab);
        if (newGameTabs.length > 0) {
          setSelection((prev) => ({
            ...prev,
            openTabs: [...prev.openTabs, ...newGameTabs],
          }));
        }
      }
    }
  }, [games, selection.promptId, selection.openTabs]);

  const setPromptContent = useCallback((content: string) => {
    setPromptContentState(content);
  }, []);

  const setPromptTitle = useCallback((title: string) => void setPromptTitleState(title), []);

  const setVisibility = useCallback((newVisibility: Visibility) => {
    setVisibilityState(newVisibility);
  }, []);

  const showContextMenu = useCallback((x: number, y: number, items: ContextMenuItemOrDivider[]) => {
    setContextMenu({ open: true, x, y, items });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, open: false }));
  }, []);

  const showConfirmDialog = useCallback((options: {
    title: string;
    message: string;
    confirmText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      open: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText ?? "Confirm",
      variant: options.variant ?? "default",
      onConfirm: options.onConfirm,
    });
  }, []);

  const hideConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const clearGenerationError = useCallback(() => {
    setGenerationError(null);
  }, []);

  const clearFork = useCallback(() => {
    setIsForking(false);
    setForkOriginalPromptId(null);
  }, []);

  const updatePromptMutation = useMutation({
    mutationFn: async (input: { id: string; content: string; title?: string; visibility: Visibility }) => {
      return await trpcClient.prompts.update.mutate({
        id: input.id,
        content: input.content,
        title: input.title,
        tokenizer: "gpt-4",
      });
    },
    onSuccess: () => {
      toast.success("Prompt saved!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save prompt");
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async (input: { id: string; visibility: Visibility }) => {
      return await trpcClient.prompts.updateVisibility.mutate({
        id: input.id,
        visibility: input.visibility,
      });
    },
    onSuccess: () => {
      toast.success("Visibility updated!");
      void queryClient.invalidateQueries({ queryKey: ["prompts-by-theme"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update visibility");
    },
  });

  const handleSave = useCallback(async () => {
    if (!selection.promptId) {
      toast.error("No prompt selected");
      return;
    }
    if (!promptTitle.trim() || promptTitle.trim().length < 3) {
      toast.error("Please enter a title (minimum 3 characters)");
      return;
    }
    if (!promptContent.trim()) {
      toast.error("Please enter prompt content");
      return;
    }

    if (visibility !== originalVisibility) {
      await updateVisibilityMutation.mutateAsync({
        id: selection.promptId,
        visibility,
      });
    }

    await updatePromptMutation.mutateAsync({
      id: selection.promptId,
      content: promptContent,
      title: promptTitle.trim(),
      visibility,
    });

    setOriginalContent(promptContent);
    setOriginalTitle(promptTitle.trim());
    setOriginalVisibility(visibility);
  }, [
    selection.promptId,
    promptTitle,
    promptContent,
    visibility,
    originalVisibility,
    updatePromptMutation,
    updateVisibilityMutation,
  ]);

  const openPromptTabs = useCallback((promptId: string, gamesList: GameNode[]) => {
    const promptTab = createPromptTab();
    const gameTabs = gamesList.map(createGameTab);
    
    setSelection((prev) => ({
      ...prev,
      promptId,
      openTabs: [promptTab, ...gameTabs],
      activeTabId: PROMPT_TAB_ID,
    }));
  }, []);

  const switchToTab = useCallback((tabId: string) => {
    setSelection((prev) => {
      const tabExists = prev.openTabs.some((t) => t.id === tabId);
      if (!tabExists) return prev;
      return { ...prev, activeTabId: tabId };
    });
  }, []);

  const closeGameTab = useCallback((gameId: string) => {
    setSelection((prev) => {
      const tabIndex = prev.openTabs.findIndex((t) => t.id === gameId);
      if (tabIndex === -1) return prev;
      
      const tab = prev.openTabs[tabIndex];
      if (!tab || tab.type === "prompt") return prev;

      const newTabs = prev.openTabs.filter((t) => t.id !== gameId);
      let newActiveTabId = prev.activeTabId;

      if (prev.activeTabId === gameId) {
        if (newTabs.length > 0) {
          const newIndex = Math.min(tabIndex, newTabs.length - 1);
          const newActiveTab = newTabs[newIndex];
          newActiveTabId = newActiveTab ? newActiveTab.id : PROMPT_TAB_ID;
        } else {
          newActiveTabId = PROMPT_TAB_ID;
        }
      }

      return {
        ...prev,
        openTabs: newTabs,
        activeTabId: newActiveTabId,
      };
    });
  }, []);

  const handleSelectTheme = useCallback((themeId: string) => {
    setSelection((prev) => ({
      ...prev,
      themeId,
      promptId: null,
      openTabs: [],
      activeTabId: PROMPT_TAB_ID,
    }));
    setExpandedThemes((prev) => {
      if (!prev.includes(themeId)) {
        return [...prev, themeId];
      }
      return prev;
    });
  }, []);

  const handleSelectPrompt = useCallback(async (promptId: string) => {
    try {
      const prompt = await trpcClient.prompts.getById.query({ id: promptId });
      if (!prompt) {
        toast.error("Prompt not found");
        return;
      }

      setPromptContentState(prompt.content);
      setPromptTitleState(prompt.title ?? "");
      setOriginalContent(prompt.content);
      setOriginalTitle(prompt.title ?? "");
      
      const promptVisibility = prompt.visibility ?? "private";
      setVisibilityState(promptVisibility);
      setOriginalVisibility(promptVisibility);

      const gamesResult = await trpcClient.games.listByPrompt.query({ promptId });
      const gamesList: GameNode[] = (gamesResult ?? []).map((g: GameListItem) => ({
        id: g.id,
        name: g.name,
        modelName: g.modelName,
        modelProvider: g.modelProvider,
        status: g.status,
        createdAt: g.createdAt,
        gameId: g.id,
        isSubmitted: g.isSubmitted,
        promptId: g.promptId ?? "",
      }));

      setSelection((prev) => {
        const promptTab = createPromptTab();
        const gameTabs = gamesList.map(createGameTab);
        
        return {
          ...prev,
          themeId: prompt.themeId,
          promptId: prompt.id,
          openTabs: [promptTab, ...gameTabs],
          activeTabId: PROMPT_TAB_ID,
        };
      });

      setExpandedThemes((prev) => {
        if (!prev.includes(prompt.themeId)) {
          return [...prev, prompt.themeId];
        }
        return prev;
      });

      setExpandedPrompts((prev) => {
        if (!prev.includes(prompt.id)) {
          return [...prev, prompt.id];
        }
        return prev;
      });

      setSelectedModels([]);
    } catch {
      toast.error("Failed to load prompt");
    }
  }, []);

  const handleSelectGame = useCallback((gameId: string) => {
    setSelection((prev) => {
      const gameTab = prev.openTabs.find((t) => t.id === gameId);
      if (!gameTab) {
        const game = games.find((g) => g.id === gameId);
        if (game) {
          const newTab = createGameTab(game);
          return {
            ...prev,
            openTabs: [...prev.openTabs, newTab],
            activeTabId: gameId,
          };
        }
        return prev;
      }
      return { ...prev, activeTabId: gameId };
    });
  }, [games]);

  const handleNewPrompt = useCallback(() => {
    if (!selection.themeId) {
      toast.error("Please select a theme first");
      return;
    }

    setPromptContentState("");
    setPromptTitleState("");
    setOriginalContent("");
    setOriginalTitle("");
    setVisibilityState("private");
    setOriginalVisibility("private");
    setSelectedModels([]);
    setGameName("");
    
    const promptTab = createPromptTab();
    
    setSelection((prev) => ({
      ...prev,
      promptId: null,
      openTabs: [promptTab],
      activeTabId: PROMPT_TAB_ID,
    }));
  }, [selection.themeId]);

  const handleToggleThemeExpand = useCallback((themeId: string) => {
    setExpandedThemes((prev) => {
      if (prev.includes(themeId)) {
        return prev.filter((id) => id !== themeId);
      }
      return [...prev, themeId];
    });
  }, []);

  const handleTogglePromptExpand = useCallback((promptId: string) => {
    setExpandedPrompts((prev) => {
      if (prev.includes(promptId)) {
        return prev.filter((id) => id !== promptId);
      }
      return [...prev, promptId];
    });
  }, []);

  const initialPromptLoadedRef = useRef(false);
  useEffect(() => {
    if (urlPromptId && !initialPromptLoadedRef.current && !selection.promptId) {
      initialPromptLoadedRef.current = true;
      void handleSelectPrompt(urlPromptId);
    }
  }, [urlPromptId, selection.promptId, handleSelectPrompt]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? event.metaKey : event.ctrlKey;

      if (cmdKey && event.key === "s") {
        event.preventDefault();
        if (selection.promptId && isDirty) {
          void handleSave();
        }
        return;
      }

      if (cmdKey && event.key === "n") {
        event.preventDefault();
        handleNewPrompt();
        return;
      }

      if (cmdKey && event.key === "Tab") {
        event.preventDefault();
        const tabs = selection.openTabs;
        if (tabs.length <= 1) return;

        const currentIndex = tabs.findIndex((t) => t.id === selection.activeTabId);
        let newIndex: number;

        if (event.shiftKey) {
          newIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
        } else {
          newIndex = currentIndex >= tabs.length - 1 ? 0 : currentIndex + 1;
        }

        const newTab = tabs[newIndex];
        if (newTab) {
          switchToTab(newTab.id);
        }
        return;
      }

      if (cmdKey && event.key === "w") {
        event.preventDefault();
        if (selection.activeTabId !== PROMPT_TAB_ID) {
          closeGameTab(selection.activeTabId);
        }
        return;
      }

      if (event.key === "Escape") {
        if (contextMenu.open) {
          hideContextMenu();
          return;
        }
        if (confirmDialogRef.current.open) {
          hideConfirmDialog();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selection.promptId,
    selection.openTabs,
    selection.activeTabId,
    isDirty,
    contextMenu.open,
    handleSave,
    handleNewPrompt,
    switchToTab,
    closeGameTab,
    hideContextMenu,
    hideConfirmDialog,
  ]);

  return {
    selection,
    setSelection,
    expandedThemes,
    setExpandedThemes,
    expandedPrompts,
    setExpandedPrompts,
    promptContent,
    setPromptContent,
    promptTitle,
    setPromptTitle,
    gameName,
    setGameName,
    originalContent,
    originalTitle,
    originalVisibility,
    visibility,
    setVisibility,
    isDirty,
    selectedModels,
    setSelectedModels,
    configPanelCollapsed,
    setConfigPanelCollapsed,
    contextMenu,
    showContextMenu,
    hideContextMenu,
    confirmDialog,
    showConfirmDialog,
    hideConfirmDialog,
    isGenerating,
    themesLoading,
    promptsLoading,
    gamesLoading,
    generationError,
    clearGenerationError,
    cursorPosition,
    setCursorPosition,
    themes,
    prompts,
    games,
    gamesByPromptId: gamesByPromptIdRef.current,
    gamesLoadingByPromptId: gamesLoadingByPromptIdRef.current,
    handleSelectTheme,
    handleSelectPrompt,
    handleSelectGame,
    handleNewPrompt,
    handleSave,
    switchToTab,
    closeGameTab,
    openPromptTabs,
    handleToggleThemeExpand,
    handleTogglePromptExpand,
    currentPromptId: selection.promptId,
    isForking,
    forkOriginalPromptId,
    clearFork,
  };
}
