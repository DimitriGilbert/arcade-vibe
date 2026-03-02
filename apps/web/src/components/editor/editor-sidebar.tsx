import { useState, useEffect, type ReactNode } from "react";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
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
import { ArcadeButton } from "@/components/arcade";
import { PromptListItem } from "./prompt-list-item";
import { Plus, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Visibility } from "@/lib/trpc-types";

interface Theme {
  id: string;
  title: string;
}

interface Prompt {
  id: string;
  title: string | null;
  content: string;
  version: number;
  updatedAt: string;
  visibility?: Visibility;
}

interface EditorSidebarProps {
  selectedTheme: string;
  onSelectTheme: (themeId: string) => void;
  themes: Array<Theme> | undefined;
  themesLoading: boolean;
  prompts: Array<Prompt> | undefined;
  promptsLoading: boolean;
  selectedPromptId: string | null;
  onSelectPrompt: (promptId: string) => void;
  onNewPrompt: () => void;
  onDeletePrompt?: (promptId: string) => void;
  onTogglePromptVisibility?: (promptId: string, visibility: Visibility) => void;
  deletingPromptId?: string | null;
  children: ReactNode;
}

function getThemeName(
  themes: Array<Theme> | undefined,
  themeId: string,
): string {
  return themes?.find((t) => t.id === themeId)?.title ?? "Select a theme";
}

export function EditorSidebar({
  selectedTheme,
  onSelectTheme,
  themes,
  themesLoading,
  prompts,
  promptsLoading,
  selectedPromptId,
  onSelectPrompt,
  onNewPrompt,
  onDeletePrompt,
  onTogglePromptVisibility,
  deletingPromptId,
  children,
}: EditorSidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayTheme = mounted && selectedTheme ? getThemeName(themes, selectedTheme) : "Select a theme";

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

  return (
    <div className="h-full border border-[var(--border)] bg-[var(--card)] rounded-[var(--radius)] overflow-hidden">
      <Accordion
        defaultValue={["theme", "prompts", "model"]}
        className="h-full flex flex-col"
      >
        {/* Theme Section */}
        <AccordionItem
          value="theme"
          className="border-b border-[var(--border)]"
        >
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Theme
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3">
              <Select
                value={selectedTheme}
                onValueChange={(value) => {
                  if (value !== null) {
                    onSelectTheme(value);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a theme">
                    {displayTheme}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {themesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="size-4 animate-spin text-[var(--muted-foreground)]" />
                    </div>
                  ) : themes && themes.length > 0 ? (
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
          </AccordionContent>
        </AccordionItem>

        {/* My Prompts Section */}
        <AccordionItem
          value="prompts"
          className="border-b border-[var(--border)]"
        >
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              My Prompts
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3">
              <ScrollArea className="h-[50vh]">
                {promptsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-4 animate-spin text-[var(--muted-foreground)]" />
                  </div>
                ) : prompts && prompts.length > 0 ? (
                  <div className="space-y-1">
                    {prompts.map((prompt) => (
                      <PromptListItem
                        key={prompt.id}
                        id={prompt.id}
                        title={prompt.title}
                        content={prompt.content}
                        version={prompt.version}
                        updatedAt={prompt.updatedAt}
                        visibility={prompt.visibility}
                        isActive={selectedPromptId === prompt.id}
                        onClick={() => onSelectPrompt(prompt.id)}
                        onDelete={onDeletePrompt ? handleDeleteClick : undefined}
                        onToggleVisibility={onTogglePromptVisibility}
                        isDeleting={deletingPromptId === prompt.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      No prompts yet
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      Create your first prompt
                    </p>
                  </div>
                )}
              </ScrollArea>
              <div className="pt-3">
                <ArcadeButton
                  variant="outline"
                  size="sm"
                  onClick={onNewPrompt}
                  className="w-full"
                >
                  <Plus className="size-4" />
                  <span>New Prompt</span>
                </ArcadeButton>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Model Section */}
        <AccordionItem
          value="model"
          className="border-b border-[var(--border)]"
        >
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Model
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3">{children}</div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prompt? This will hide it from your list, but any games created from it will remain visible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <ArcadeButton
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
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
