"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MoreHorizontal, Trash2, Globe, Lock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Visibility } from "@/lib/trpc-types";

interface InboxPrompt {
  id: string;
  title?: string | null;
  content: string;
  version: number;
  updatedAt: string;
  visibility?: Visibility;
}

interface InboxSidebarProps {
  prompts: InboxPrompt[] | undefined;
  promptsLoading: boolean;
  selectedPromptId: string | null;
  onSelectPrompt: (promptId: string) => void;
  onNewPrompt: () => void;
  onDeletePrompt: (promptId: string) => void;
  onTogglePromptVisibility: (promptId: string, visibility: Visibility) => void;
  deletingPromptId: string | null;
  themes: Array<{ id: string; title: string }> | undefined;
  themesLoading: boolean;
  selectedTheme: string;
  onSelectTheme: (themeId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength).trim()}...`;
}

export function InboxSidebar({
  prompts,
  promptsLoading,
  selectedPromptId,
  onSelectPrompt,
  onNewPrompt,
  onDeletePrompt,
  onTogglePromptVisibility,
  deletingPromptId,
  themes,
  themesLoading,
  selectedTheme,
  onSelectTheme,
  isCollapsed = false,
  onToggleCollapse,
}: InboxSidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  // Collapsed state - show minimal strip with expand button
  if (isCollapsed) {
    return (
      <div className="h-full w-[28px] bg-[var(--card)] border-r border-[var(--border)] flex flex-col items-center py-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-[var(--muted)]/50 transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
        </button>
      </div>
    );
  }

  const handleDeleteClick = (promptId: string) => {
    setPromptToDelete(promptId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (promptToDelete) {
      onDeletePrompt(promptToDelete);
    }
    setDeleteDialogOpen(false);
    setPromptToDelete(null);
  };

  const handleThemeChange = (value: string | null) => {
    if (value) {
      onSelectTheme(value);
    }
  };

  const selectedThemeOption = themes?.find((t) => t.id === selectedTheme);

  return (
    <div className="h-full w-[250px] flex flex-col bg-[var(--card)] border-r border-[var(--border)]">
      {/* Header with collapse button */}
      <div className="p-3 border-b border-[var(--border)] shrink-0 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Prompts
        </span>
        <div className="flex items-center gap-1">
          <ArcadeButton variant="outline" size="sm" onClick={onNewPrompt}>
            <Plus className="h-3 w-3" />
          </ArcadeButton>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-[var(--muted)]/50 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>
      </div>

      {/* Theme Selector */}
      <div className="p-3 border-b border-[var(--border)] shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-2 block">
          Theme
        </span>
        <Select value={selectedTheme} onValueChange={handleThemeChange}>
          <SelectTrigger className="w-full h-9" id="theme-select">
            {themesLoading ? (
              <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </span>
            ) : (
              selectedThemeOption?.title || "Select theme"
            )}
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
      </div>

      {/* Prompts List */}
      <ScrollArea className="flex-1 min-h-0">
        {promptsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : prompts && prompts.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {prompts.map((prompt) => {
              const isActive = selectedPromptId === prompt.id;
              const visibility = prompt.visibility ?? "private";

              return (
                <div
                  key={prompt.id}
                  className={cn(
                    "group relative p-3 transition-colors hover:bg-[var(--muted)]/30",
                    isActive && "bg-[var(--primary)]/10 border-l-2 border-[var(--primary)]"
                  )}
                >
                  <button
                    type="button"
                    className="w-full text-left focus:outline-none focus:ring-2 focus:ring-[var(--ring)] rounded"
                    onClick={() => onSelectPrompt(prompt.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectPrompt(prompt.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--foreground)] line-clamp-2">
                          {prompt.title ?? truncateContent(prompt.content, 50)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <ArcadeBadge
                            text={`v${prompt.version}`}
                            variant={isActive ? "neon" : "default"}
                          />
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {formatRelativeTime(prompt.updatedAt)}
                          </span>
                          {visibility === "public" || visibility === "public_on_freeze" ? (
                            <Globe className="h-3 w-3 text-green-500" />
                          ) : (
                            <Lock className="h-3 w-3 text-[var(--muted-foreground)]" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="absolute right-2 top-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--muted)] focus:opacity-100"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          const newVisibility: Visibility = 
                            visibility === "private" ? "public" : "private";
                          onTogglePromptVisibility(prompt.id, newVisibility);
                        }}
                        disabled={deletingPromptId === prompt.id}
                      >
                        {visibility === "private" ? (
                          <>
                            <Globe className="h-4 w-4 mr-2" />
                            Make Public
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Make Private
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDeleteClick(prompt.id);
                        }}
                        disabled={deletingPromptId === prompt.id}
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingPromptId === prompt.id ? "Deleting..." : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">No prompts yet</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Write your first prompt
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Delete Dialog */}
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
    </div>
  );
}
