"use client";

import { memo, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { ArrowDown, AlertCircle, Check, Sparkles, Brain } from "lucide-react";
import { ArcadeButton } from "@/components/arcade";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import type { ModelSelection, GenerationStatus } from "./inbox-types";

interface GenerationEntry {
  modelSelectionId: string;
  modelKey: string;
  status: GenerationStatus;
  code: string;
  reasoning?: string;
  gameId: string | null;
  error?: string;
}

function OutputStatusCard({
  title,
  description,
  tone = "neutral",
  icon,
}: {
  title: string;
  description: string;
  tone?: "neutral" | "error";
  icon?: ReactNode;
}) {
  const toneClass =
    tone === "error"
      ? "border-[var(--destructive)]/40 bg-[var(--destructive)]/10"
      : "border-[var(--border)] bg-[var(--muted)]/10";

  return (
    <div
      className={`h-full min-h-0 rounded-xl border ${toneClass} flex items-center justify-center p-4`}
    >
      <div className="max-w-md text-center space-y-2">
        {icon ? <div className="mx-auto w-fit">{icon}</div> : null}
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
    </div>
  );
}

function WaitingState({ status }: { status: "reasoning" | "generating" }) {
  return (
    <div className="h-full min-h-0 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
      <div className="flex items-center gap-3">
        {status === "reasoning" ? (
          <Brain className="h-5 w-5 text-blue-400 animate-pulse" />
        ) : (
          <Sparkles className="h-5 w-5 text-cyan-400 animate-spin" />
        )}
        <span className="text-sm text-[var(--muted-foreground)]">
          {status === "reasoning" ? "Waiting for reasoning..." : "Waiting for code..."}
        </span>
      </div>
    </div>
  );
}

function ModelStatusIcon({ status }: { status: GenerationStatus }) {
  switch (status) {
    case "reasoning":
      return <Brain className="h-3.5 w-3.5 text-blue-400 animate-pulse" />;
    case "generating":
      return <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin" />;
    case "complete":
      return <Check className="h-3.5 w-3.5 text-emerald-400" />;
    case "error":
      return <AlertCircle className="h-3.5 w-3.5 text-[var(--destructive)]" />;
    default:
      return null;
  }
}

const ModelOutputTab = memo(function ModelOutputTab({
  modelId,
  modelName,
  isActive,
  onSelect,
  getGenerationStatus,
}: {
  modelId: string;
  modelName: string;
  isActive: boolean;
  onSelect: () => void;
  getGenerationStatus: (id: string) => GenerationStatus | undefined;
}) {
  const status = getGenerationStatus(modelId) ?? "idle";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors",
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--foreground)]"
          : "border-[var(--border)] bg-[var(--muted)]/30 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/60",
      ].join(" ")}
    >
      <ModelStatusIcon status={status} />
      <span className="truncate max-w-[10rem]">{modelName}</span>
    </button>
  );
});

export interface InboxOutputPanelProps {
  activeOutputTab: string | null | undefined;
  selectedModels: ModelSelection[];
  onOutputTabChange?: (id: string) => void;
  getGenerationById: (id: string | null | undefined) => GenerationEntry | undefined;
  getGenerationStatus: (id: string | null | undefined) => GenerationStatus | undefined;
}

export function InboxOutputPanel({
  activeOutputTab,
  selectedModels,
  onOutputTabChange,
  getGenerationById,
  getGenerationStatus,
}: InboxOutputPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const userScrollIntentRef = useRef(false);
  const isAutoScrollingRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const generation = getGenerationById(activeOutputTab);
  const hasMultipleModels = selectedModels.length > 1;
  const currentModel = selectedModels.find((model) => model.id === activeOutputTab);
  const isStreaming =
    generation?.status === "reasoning" || generation?.status === "generating";
  const codeLength = generation?.code.length ?? 0;
  const reasoningLength = generation?.reasoning?.length ?? 0;

  const getScrollElement = useCallback((): HTMLElement | null => {
    const root = panelRef.current;
    if (!root) return null;
    const scroller = root.querySelector(".streaming-code-viewer__scroll");
    return scroller instanceof HTMLElement ? scroller : null;
  }, []);

  useEffect(() => {
    const scroller = getScrollElement();
    if (!scroller) return;

    const markUserScrollIntent = () => {
      userScrollIntentRef.current = true;
    };

    const onScroll = () => {
      const isNearBottom =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 32;
      if (isAutoScrollingRef.current && userScrollIntentRef.current && !isNearBottom) {
        isAutoScrollingRef.current = false;
      }
      setShowScrollButton(!isNearBottom);
      if (isNearBottom) {
        userScrollIntentRef.current = false;
      }
    };

    scroller.addEventListener("wheel", markUserScrollIntent, { passive: true });
    scroller.addEventListener("touchstart", markUserScrollIntent, {
      passive: true,
    });
    scroller.addEventListener("mousedown", markUserScrollIntent);
    scroller.addEventListener("scroll", onScroll);
    return () => {
      scroller.removeEventListener("wheel", markUserScrollIntent);
      scroller.removeEventListener("touchstart", markUserScrollIntent);
      scroller.removeEventListener("mousedown", markUserScrollIntent);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [getScrollElement]);

  useEffect(() => {
    const scroller = getScrollElement();
    if (!scroller) return;
    scroller.scrollLeft = 0;
  }, [activeOutputTab, getScrollElement]);

  useEffect(() => {
    if (isStreaming) {
      isAutoScrollingRef.current = true;
      setShowScrollButton(false);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;
    if (!isAutoScrollingRef.current) return;

    const frameId = requestAnimationFrame(() => {
      const scroller = getScrollElement();
      if (scroller && isAutoScrollingRef.current) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isStreaming, codeLength, reasoningLength, getScrollElement]);

  const scrollToBottom = () => {
    const scroller = getScrollElement();
    if (!scroller) return;

    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    userScrollIntentRef.current = false;
    isAutoScrollingRef.current = true;
    setShowScrollButton(false);
  };

  if (selectedModels.length === 0) {
    return (
      <OutputStatusCard
        title="No models selected"
        description="Pick models from the selector above to start generating."
      />
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 overflow-hidden">
      {hasMultipleModels ? (
        <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {selectedModels.map((model) => (
              <ModelOutputTab
                key={model.id}
                modelId={model.id}
                modelName={model.modelName}
                isActive={model.id === activeOutputTab}
                onSelect={() => onOutputTabChange?.(model.id)}
                getGenerationStatus={getGenerationStatus}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex-1 h-0 min-h-0 overflow-hidden" ref={panelRef}>
        {generation?.code || generation?.reasoning ? (
          <div className="h-full min-h-0 overflow-hidden relative rounded-lg border border-[var(--border)] bg-[var(--card)] p-1.5">
            <div className="h-full min-h-0 flex flex-col gap-2">
              <div className="flex-1 h-0 min-h-0">
                <StreamingCodeViewerV2
                  key={activeOutputTab ?? "no-active-output-tab"}
                  code={generation.code ?? ""}
                  reasoning={generation.reasoning}
                  language="html"
                  isStreaming={isStreaming}
                  fileName="game.html"
                />
              </div>
            </div>

            {showScrollButton && isStreaming ? (
              <ArcadeButton
                variant="outline"
                size="sm"
                onClick={scrollToBottom}
                className="absolute bottom-4 right-4 shadow-md"
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Follow
              </ArcadeButton>
            ) : null}
          </div>
        ) : null}

        {generation?.status === "reasoning" && !generation?.reasoning && !generation?.code ? (
          <WaitingState status="reasoning" />
        ) : null}

        {generation?.status === "generating" && !generation?.code ? (
          <WaitingState status="generating" />
        ) : null}

        {generation?.status === "error" ? (
          <OutputStatusCard
            tone="error"
            icon={<AlertCircle className="h-8 w-8 text-[var(--destructive)]" />}
            title="Generation failed"
            description={generation.error ?? "An unknown error occurred."}
          />
        ) : null}

        {!generation?.code &&
        !generation?.reasoning &&
        generation?.status !== "error" &&
        generation?.status !== "reasoning" &&
        generation?.status !== "generating" ? (
          <OutputStatusCard
            title={
              currentModel
                ? `Ready for ${currentModel.modelName}`
                : "Ready"
            }
            description="Click Generate to create your game."
          />
        ) : null}
      </div>
    </div>
  );
}
