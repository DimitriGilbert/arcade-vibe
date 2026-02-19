"use client";

import { useState, useEffect, type ReactNode } from "react";
import { ArcadeButton, ArcadeBadge } from "@/components/arcade";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, Plus, Loader2, Trash2, Eye, EyeOff, Globe, Lock } from "lucide-react";
import type { CodelabTheme, CodelabPrompt } from "./types";
import type { Visibility } from "@/lib/trpc-types";

interface CodelabSidebarProps {
  credits: number | null;
  themes: CodelabTheme[];
  themesLoading: boolean;
  selectedThemeId: string;
  onSelectTheme: (themeId: string) => void;
  prompts: CodelabPrompt[];
  promptsLoading: boolean;
  selectedPromptId: string | null;
  onSelectPrompt: (promptId: string) => void;
  onNewPrompt: () => void;
  onDeletePrompt?: (promptId: string) => void;
  onTogglePromptVisibility?: (promptId: string, visibility: Visibility) => void;
  deletingPromptId?: string | null;
  children?: ReactNode;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function VisibilityIcon({ visibility }: { visibility?: Visibility }) {
  if (!visibility) return null;
  switch (visibility) {
    case "public":
      return <Globe className="h-3 w-3 text-green-500" />;
    case "public_on_freeze":
      return <Eye className="h-3 w-3 text-yellow-500" />;
    case "private":
    default:
      return <Lock className="h-3 w-3 text-muted-foreground" />;
  }
}

export function CodelabSidebar({
  credits,
  themes,
  themesLoading,
  selectedThemeId,
  onSelectTheme,
  prompts,
  promptsLoading,
  selectedPromptId,
  onSelectPrompt,
  onNewPrompt,
  onDeletePrompt,
  onTogglePromptVisibility,
  deletingPromptId,
  children,
}: CodelabSidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDeleteClick = (promptId: string) => {
    setPromptToDelete(promptId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (promptToDelete && onDeletePrompt) {
      onDeletePrompt(promptToDelete);
    }
    setDeleteDialogOpen(false);
    setPromptToDelete(null);
  };

  const handleToggleVisibility = (prompt: CodelabPrompt) => {
    if (!onTogglePromptVisibility) return;
    const nextVisibility: Visibility =
      prompt.visibility === "private"
        ? "public"
        : prompt.visibility === "public"
          ? "public_on_freeze"
          : "private";
    onTogglePromptVisibility(prompt.id, nextVisibility);
  };

  return (
    <div className="h-full flex flex-col border-r border-[var(--border)] bg-[var(--card)]">
      {/* Credits Header */}
      <div className="shrink-0 p-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">Credits</span>
          <ArcadeBadge
            text={credits !== null ? `${credits}` : "..."}
            variant="neon"
            className="ml-auto"
          />
        </div>
      </div>

      {/* Theme Selector */}
      <div className="shrink-0 p-3 border-b border-[var(--border)]">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-2 block">
          Theme
        </span>
        <Select
          value={selectedThemeId}
          onValueChange={(value) => {
            if (value !== null && value !== "") {
              onSelectTheme(value);
            }
          }}
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="Select theme">
              {mounted && selectedThemeId
                ? themes.find((t) => t.id === selectedThemeId)?.title ?? "Select theme"
                : "Select theme"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {themesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : themes.length > 0 ? (
              themes.map((theme) => (
                <SelectItem key={theme.id} value={theme.id}>
                  {theme.title}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-4 text-xs text-center text-[var(--muted-foreground)]">
                No themes available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* My Prompts */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="shrink-0 p-3 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              My Prompts
            </span>
            <ArcadeButton
              variant="outline"
              size="sm"
              onClick={onNewPrompt}
              className="h-7 px-2"
            >
              <Plus className="h-3 w-3" />
            </ArcadeButton>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2">
            {promptsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-4 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : prompts.length > 0 ? (
              <div className="space-y-1">
                {prompts.map((prompt) => (
                  <button
                    type="button"
                    key={prompt.id}
                    className={[
                      "group flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors w-full text-left",
                      selectedPromptId === prompt.id
                        ? "bg-[var(--primary)]/10 border border-[var(--primary)]/30"
                        : "hover:bg-[var(--muted)]/50 border border-transparent",
                    ].join(" ")}
                    onClick={() => onSelectPrompt(prompt.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--foreground)] line-clamp-2">
                        {prompt.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <ArcadeBadge
                          text={`v${prompt.version}`}
                          variant="default"
                          className="text-[10px] px-1.5 py-0"
                        />
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {formatRelativeTime(prompt.updatedAt)}
                        </span>
                        <VisibilityIcon visibility={prompt.visibility} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {onTogglePromptVisibility && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVisibility(prompt);
                          }}
                          className="p-1 rounded hover:bg-[var(--muted)]"
                          title="Toggle visibility"
                        >
                          {prompt.visibility === "private" ? (
                            <Eye className="h-3 w-3 text-[var(--muted-foreground)]" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-[var(--muted-foreground)]" />
                          )}
                        </button>
                      )}
                      {onDeletePrompt && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(prompt.id);
                          }}
                          disabled={deletingPromptId === prompt.id}
                          className="p-1 rounded hover:bg-[var(--destructive)]/20 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                          title="Delete"
                        >
                          {deletingPromptId === prompt.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-[var(--muted-foreground)]">
                  No prompts yet
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Write your first prompt
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Extra children (model picker) */}
      {children && (
        <div className="shrink-0 border-t border-[var(--border)] p-3 max-h-[40%] overflow-y-auto">
          {children}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prompt? This will hide it from your list, but any games created from it will remain visible.
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
              {deletingPromptId === promptToDelete ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </ArcadeButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
