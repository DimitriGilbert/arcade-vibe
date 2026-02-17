"use client";

import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, AlertCircle, Brain, Check, Sparkles } from "lucide-react";
import { ArcadeButton } from "@/components/arcade";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import type { ModelSelection, GenerationStatus } from "./model-types";
import {
  useGenerationById,
  useGenerationStatus,
} from "@/stores/generations-store";

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
      className={`h-full min-h-0 rounded-xl border ${toneClass} flex items-center justify-center p-6`}
    >
      <div className="max-w-md text-center space-y-2">
        {icon ? <div className="mx-auto w-fit">{icon}</div> : null}
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
    </div>
  );
}

function StreamingReasoningBanner({
  modelName,
  reasoningMaxTokens,
}: {
  modelName: string;
  reasoningMaxTokens: number;
}) {
  return (
    <div className="shrink-0 rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-2">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-blue-400 animate-pulse" />
        <p className="text-xs text-blue-100">
          <span className="font-medium">Reasoning</span> active for {modelName}.
          Token budget: {reasoningMaxTokens.toLocaleString()}.
        </p>
      </div>
    </div>
  );
}

function GeneratingState({ status }: { status: GenerationStatus }) {
  const isReasoning = status === "reasoning";

  return (
    <div className="h-full min-h-0 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 relative flex items-center justify-center">
          {isReasoning ? (
            <Brain className="h-10 w-10 text-blue-400 animate-pulse" />
          ) : (
            <div className="h-10 w-10 rounded-full border-[3px] border-[var(--primary)] border-t-transparent animate-spin" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {isReasoning ? "Reasoning about your prompt" : "Generating output"}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {isReasoning
              ? "Reasoning is visible above this pane while the model plans output."
              : "Streaming code is in progress."}
          </p>
        </div>
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
}: {
  modelId: string;
  modelName: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  const status = useGenerationStatus(modelId) ?? "idle";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
        isActive
          ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--foreground)]"
          : "border-[var(--border)] bg-[var(--muted)]/30 text-[var(--muted-foreground)] hover:bg-[var(--muted)]/60",
      ].join(" ")}
    >
      <ModelStatusIcon status={status} />
      <span className="truncate max-w-[11rem]">{modelName}</span>
    </button>
  );
});

export function EditorOutputPanelV2({
  activeOutputTab,
  selectedModels,
  onOutputTabChange,
}: {
  activeOutputTab: string | null | undefined;
  selectedModels: ModelSelection[];
  onOutputTabChange?: (id: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const userScrollIntentRef = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  const generation = useGenerationById(activeOutputTab);
  const hasMultipleModels = selectedModels.length > 1;
  const currentModel = selectedModels.find((model) => model.id === activeOutputTab);
  const isStreaming =
    generation?.status === "reasoning" || generation?.status === "generating";
  const code = generation?.code ?? "";

  const getScrollElement = (): HTMLElement | null => {
    const root = panelRef.current;
    if (!root) return null;
    const scroller = root.querySelector(".streaming-code-viewer__scroll");
    return scroller instanceof HTMLElement ? scroller : null;
  };

  useEffect(() => {
    const scroller = getScrollElement();
    if (!scroller) return;

    const markUserScrollIntent = () => {
      userScrollIntentRef.current = true;
    };

    const onScroll = () => {
      const isNearBottom =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 32;
      if (isAutoScrolling && userScrollIntentRef.current && !isNearBottom) {
        setIsAutoScrolling(false);
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
  }, [isAutoScrolling, activeOutputTab]);

  useEffect(() => {
    const scroller = getScrollElement();
    if (!scroller) return;

    if (isStreaming && isAutoScrolling && code.length > 0) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [isStreaming, isAutoScrolling, code]);

  useEffect(() => {
    const scroller = getScrollElement();
    if (!scroller) return;

    scroller.scrollLeft = 0;
  }, [activeOutputTab]);

  useEffect(() => {
    if (isStreaming) {
      setIsAutoScrolling(true);
      setShowScrollButton(false);
    }
  }, [isStreaming, activeOutputTab]);

  const scrollToBottom = () => {
    const scroller = getScrollElement();
    if (!scroller) return;

    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    userScrollIntentRef.current = false;
    setIsAutoScrolling(true);
    setShowScrollButton(false);
  };

  if (selectedModels.length === 0) {
    return (
      <OutputStatusCard
        title="No model selected"
        description="Pick one or more models in the sidebar to start generating."
      />
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-3 overflow-hidden">
      {hasMultipleModels ? (
        <div className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {selectedModels.map((model) => (
              <ModelOutputTab
                key={model.id}
                modelId={model.id}
                modelName={model.modelName}
                isActive={model.id === activeOutputTab}
                onSelect={() => onOutputTabChange?.(model.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex-1 h-0 min-h-0 overflow-hidden" ref={panelRef}>
        {generation?.code ? (
          <div className="h-full min-h-0 overflow-hidden relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-2">
            <div className="h-full min-h-0 flex flex-col gap-2">
              {generation.status === "reasoning" && currentModel ? (
                <StreamingReasoningBanner
                  modelName={currentModel.modelName}
                  reasoningMaxTokens={currentModel.reasoningMaxTokens}
                />
              ) : null}

              <div className="flex-1 min-h-0">
                <StreamingCodeViewerV2
                  code={generation.code}
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
                Follow stream
              </ArcadeButton>
            ) : null}
          </div>
        ) : null}

        {!generation?.code && generation?.status === "reasoning" ? (
          <GeneratingState status="reasoning" />
        ) : null}

        {!generation?.code && generation?.status === "generating" ? (
          <GeneratingState status="generating" />
        ) : null}

        {generation?.status === "error" ? (
          <OutputStatusCard
            tone="error"
            icon={<AlertCircle className="h-8 w-8 text-[var(--destructive)]" />}
            title="Generation failed"
            description={generation.error ?? "An unknown error occurred during generation."}
          />
        ) : null}

        {!generation?.code &&
        generation?.status !== "error" &&
        generation?.status !== "reasoning" &&
        generation?.status !== "generating" ? (
          <OutputStatusCard
            title={
              currentModel
                ? `No output yet for ${currentModel.modelName}`
                : "No output yet"
            }
            description="Run generation to see code stream here."
          />
        ) : null}
      </div>
    </div>
  );
}
