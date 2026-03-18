"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, FileText, Code, Save, X } from "lucide-react";
import { StatusIcon } from "@/components/creator/shared";
import { useGenerationStatus } from "@/stores/generations-store";
import { cn } from "@/lib/utils";
import type { IDETab } from "./types";
import type { GenerationStatus } from "@/lib/trpc-types";

export interface EditorTabsProps {
  tabs: IDETab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  isDirty: boolean;
  onSave: () => void;
}

function mapGameStatusToGenerationStatus(status: IDETab["gameStatus"]): GenerationStatus | null {
  switch (status) {
    case "completed":
      return "complete";
    case "failed":
      return "error";
    case "generating":
      return "generating";
    default:
      return null;
  }
}

function EditorTabButton({
  tab,
  isActive,
  onTabClick,
  onTabClose,
  isDirty,
  onSave,
}: {
  tab: IDETab;
  isActive: boolean;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  isDirty: boolean;
  onSave: () => void;
}) {
  const liveStatus = useGenerationStatus(tab.modelSelectionId ?? tab.modelKey ?? tab.id);
  const fallbackStatus = mapGameStatusToGenerationStatus(tab.gameStatus);
  const status = liveStatus ?? fallbackStatus;

  return (
    <button
      type="button"
      key={tab.id}
      onClick={() => onTabClick(tab.id)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm border-r border-border",
        "hover:bg-muted/50 transition-colors whitespace-nowrap",
        isActive && "bg-background border-b-2 border-b-primary"
      )}
    >
      {tab.type === "prompt" ? (
        <FileText className="h-4 w-4" />
      ) : (
        <>
          {status ? <StatusIcon status={status} className="h-3.5 w-3.5" /> : <Code className="h-4 w-4" />}
        </>
      )}
      <span className="truncate max-w-32">{tab.label}</span>

      {tab.type === "prompt" && isDirty ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSave();
          }}
          className="p-0.5 hover:bg-sidebar-accent rounded shrink-0"
        >
          <Save className="h-3 w-3 text-primary" />
        </button>
      ) : null}

      {tab.type === "game" ? (
        <X
          className="h-3 w-3 hover:text-destructive cursor-pointer"
          onClick={(event) => {
            event.stopPropagation();
            onTabClose(tab.id);
          }}
        />
      ) : null}
    </button>
  );
}

export function EditorTabs({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  isDirty,
  onSave,
}: EditorTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <div className="flex items-center border-b border-border bg-card shrink-0">
      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="shrink-0 px-2 py-2 hover:bg-muted/50 border-r border-border"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
      ) : null}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map((tab) => (
          <EditorTabButton
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onTabClick={onTabClick}
            onTabClose={onTabClose}
            isDirty={isDirty}
            onSave={onSave}
          />
        ))}
      </div>

      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="shrink-0 px-2 py-2 hover:bg-muted/50 border-l border-border"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      ) : null}
    </div>
  );
}
