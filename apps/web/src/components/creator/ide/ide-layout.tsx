"use client";

import { useState, useEffect } from "react";
import { useIDEState } from "./use-ide-state";
import { ContextMenu } from "./context-menu";
import { ConfirmDialog } from "./confirm-dialog";
import { DiscoveryDialog } from "@/components/creator/shared";
import { useDiscoveryDialog } from "@/components/creator/shared/use-discovery-dialog";
import { cn } from "@/lib/utils";

function IDESkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-1 min-h-0 flex">
        <aside className="w-64 border-r border-border bg-sidebar shrink-0">
          <div className="h-10 border-b border-border" />
          <div className="p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-muted/50 animate-pulse rounded" />
            ))}
          </div>
        </aside>

        <main className="flex-1 bg-background">
          <div className="h-10 border-b border-border" />
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-4 bg-muted/50 animate-pulse rounded"
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            ))}
          </div>
        </main>

        <aside className="w-80 border-l border-border bg-card shrink-0">
          <div className="h-10 border-b border-border" />
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-muted/50 animate-pulse rounded" />
                <div className="h-8 bg-muted/50 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </aside>
      </div>

      <footer className="h-6 border-t border-border bg-muted" />
    </div>
  );
}

interface ForkBannerProps {
  originalPromptId: string;
  onClearFork: () => void;
}

function ForkBanner({ originalPromptId, onClearFork }: ForkBannerProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/20 text-sm">
      <span className="text-primary">
        Forking from prompt: {originalPromptId.slice(0, 8)}...
      </span>
      <button
        type="button"
        onClick={onClearFork}
        className="text-primary hover:text-primary/80 text-xs underline"
      >
        Clear
      </button>
    </div>
  );
}

interface ExplorerSidebarProps {
  className?: string;
}

function ExplorerSidebar({ className }: ExplorerSidebarProps) {
  return (
    <aside
      className={cn(
        "w-64 border-r border-border bg-sidebar shrink-0 flex flex-col",
        className
      )}
    >
      <div className="h-10 border-b border-border flex items-center px-3 text-sm font-medium text-muted-foreground">
        Explorer
      </div>
      <div className="flex-1 overflow-auto p-2">
        <div className="text-xs text-muted-foreground text-center py-8">
          Explorer content placeholder
        </div>
      </div>
    </aside>
  );
}

interface EditorAreaProps {
  className?: string;
}

function EditorArea({ className }: EditorAreaProps) {
  return (
    <main className={cn("flex-1 bg-background flex flex-col min-w-0", className)}>
      <div className="h-10 border-b border-border flex items-center px-3 text-sm font-medium text-muted-foreground">
        Editor
      </div>
      <div className="flex-1 overflow-auto">
        <div className="text-xs text-muted-foreground text-center py-8">
          Editor content placeholder
        </div>
      </div>
    </main>
  );
}

interface ConfigPanelProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

function ConfigPanel({ collapsed, onToggleCollapse, className }: ConfigPanelProps) {
  if (collapsed) {
    return (
      <aside
        className={cn(
          "w-10 border-l border-border bg-card shrink-0 flex flex-col items-center py-2",
          className
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
          aria-label="Expand panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
          >
            <title>Expand panel</title>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={cn("w-80 border-l border-border bg-card shrink-0 flex flex-col", className)}
    >
      <div className="h-10 border-b border-border flex items-center justify-between px-3">
        <span className="text-sm font-medium text-muted-foreground">Config</span>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
          title="Collapse panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
          >
            <title>Collapse panel</title>
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="text-xs text-muted-foreground text-center py-8">
          Config content placeholder
        </div>
      </div>
    </aside>
  );
}

interface StatusBarProps {
  cursorPosition?: { line: number; column: number };
  isDirty?: boolean;
  isGenerating?: boolean;
  className?: string;
}

function StatusBar({ cursorPosition, isDirty, isGenerating, className }: StatusBarProps) {
  return (
    <footer
      className={cn(
        "h-6 border-t border-border bg-muted flex items-center justify-between px-3 text-xs text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {isGenerating && (
          <span className="text-primary animate-pulse">Generating...</span>
        )}
        {isDirty && <span className="text-yellow-500">Unsaved</span>}
      </div>
      <div className="flex items-center gap-4">
        {cursorPosition && (
          <span>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
        )}
        <span>UTF-8</span>
      </div>
    </footer>
  );
}

interface FeedbackButtonProps {
  className?: string;
}

function FeedbackButton({ className }: FeedbackButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "fixed bottom-4 right-4 px-3 py-1.5 text-xs rounded-md",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "shadow-md transition-colors",
        className
      )}
    >
      Feedback
    </button>
  );
}

interface IDELayoutProps {
  urlPromptId?: string;
  urlForkId?: string;
}

export function IDELayout({ urlPromptId, urlForkId }: IDELayoutProps) {
  const [mounted, setMounted] = useState(false);
  const state = useIDEState({ urlPromptId, urlForkId });
  const discoveryDialog = useDiscoveryDialog();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <IDESkeleton />;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {state.isForking && state.forkOriginalPromptId && (
        <ForkBanner
          originalPromptId={state.forkOriginalPromptId}
          onClearFork={state.clearFork}
        />
      )}

      <div className="flex-1 min-h-0 flex">
        <ExplorerSidebar />
        <EditorArea />
        <ConfigPanel
          collapsed={state.configPanelCollapsed}
          onToggleCollapse={() => state.setConfigPanelCollapsed(!state.configPanelCollapsed)}
        />
      </div>

      <StatusBar
        cursorPosition={state.cursorPosition}
        isDirty={state.isDirty}
        isGenerating={state.isGenerating}
      />

      {state.contextMenu.open && (
        <ContextMenu
          x={state.contextMenu.x}
          y={state.contextMenu.y}
          items={state.contextMenu.items}
          onClose={state.hideContextMenu}
        />
      )}

      <ConfirmDialog
        open={state.confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) state.hideConfirmDialog();
        }}
        title={state.confirmDialog.title}
        message={state.confirmDialog.message}
        confirmText={state.confirmDialog.confirmText}
        variant={state.confirmDialog.variant}
        onConfirm={state.confirmDialog.onConfirm}
      />

      <DiscoveryDialog {...discoveryDialog.dialogProps} />

      <FeedbackButton />
    </div>
  );
}
