"use client";

import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, AlertCircle, Brain, Check, Sparkles } from "lucide-react";
import { ArcadeButton } from "@/components/arcade";
import { StreamingCodeViewer } from "@/components/streaming-code-viewer";
import type { ModelSelection, GenerationStatus } from "./model-types";
import { useGenerationById, useGenerationStatus } from "@/stores/generations-store";

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
              ? "The model is planning the structure before writing code."
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

export function EditorOutputPanel({
  activeOutputTab,
  selectedModels,
  onOutputTabChange,
}: {
  activeOutputTab: string | null | undefined;
  selectedModels: ModelSelection[];
  onOutputTabChange?: (id: string) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  const generation = useGenerationById(activeOutputTab);
  const hasMultipleModels = selectedModels.length > 1;
  const currentModel = selectedModels.find((model) => model.id === activeOutputTab);
  const isStreaming =
    generation?.status === "reasoning" || generation?.status === "generating";
  const code = generation?.code ?? "";

  useEffect(() => {
    const scroller = scrollContainerRef.current?.querySelector(
      ".streaming-code-viewer__scroll",
    );
    if (!scroller) return;

    const element = scroller as HTMLElement;
    const onScroll = () => {
      const isNearBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight < 32;
      if (isAutoScrolling && !isNearBottom) {
        setIsAutoScrolling(false);
      }
      setShowScrollButton(!isNearBottom);
    };

    element.addEventListener("scroll", onScroll);
    return () => element.removeEventListener("scroll", onScroll);
  }, [isAutoScrolling, activeOutputTab]);

  useEffect(() => {
    const scroller = scrollContainerRef.current?.querySelector(
      ".streaming-code-viewer__scroll",
    );
    if (!(scroller instanceof HTMLElement)) return;

    if (isStreaming && isAutoScrolling && code.length > 0) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [isStreaming, isAutoScrolling, code]);

  useEffect(() => {
    const scroller = scrollContainerRef.current?.querySelector(
      ".streaming-code-viewer__scroll",
    );
    if (!(scroller instanceof HTMLElement)) return;
    scroller.scrollLeft = 0;
  }, [activeOutputTab, isStreaming]);

  useEffect(() => {
    if (isStreaming) {
      setIsAutoScrolling(true);
      setShowScrollButton(false);
    }
  }, [isStreaming, activeOutputTab]);

  const scrollToBottom = () => {
    const scroller = scrollContainerRef.current?.querySelector(
      ".streaming-code-viewer__scroll",
    );
    if (!(scroller instanceof HTMLElement)) return;

    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
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

      <div className="flex-1 h-0 min-h-0 overflow-hidden" ref={scrollContainerRef}>
        {generation?.code ? (
          <div className="h-full min-h-0 overflow-hidden relative rounded-xl border border-[var(--border)] bg-[var(--card)] p-2">
            <div className="h-full min-h-0 [&_.streaming-code-viewer]:h-full [&_.streaming-code-viewer]:flex [&_.streaming-code-viewer]:flex-col [&_.streaming-code-viewer__scroll]:flex-1 [&_.streaming-code-viewer__scroll]:min-h-0 [&_.streaming-code-viewer__scroll]:!max-h-none">
              <StreamingCodeViewer
                code={generation.code}
                language="html"
                isStreaming={generation.status === "generating"}
                fileName="game.html"
              />
            </div>
            {showScrollButton && generation.status === "generating" ? (
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
