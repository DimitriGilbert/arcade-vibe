"use client";

import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useMusic } from "@/contexts/music-context";
import { cn } from "@/lib/utils";

export function MusicPlayer() {
  const { isPlaying, togglePlay, playNext, playPrevious, isLoading, currentTrack } = useMusic();

  if (isLoading) {
    return (
      <div className="inline-flex items-center justify-center w-8 h-8">
        <div className="w-4 h-4 border-2 border-[var(--muted-foreground)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const Icon = isPlaying ? Pause : Play;

  return (
    <div className="group inline-flex items-center overflow-hidden transition-all duration-300 ease-out">
      {/* Previous - hidden when collapsed, shown on hover (left of play) */}
      <button
        type="button"
        onClick={playPrevious}
        className={cn(
          "inline-flex items-center justify-center w-8 h-8 rounded-[calc(var(--radius)-4px)]",
          "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          "w-0 opacity-0 group-hover:w-8 group-hover:opacity-100 overflow-hidden"
        )}
        aria-label="Previous track"
      >
        <SkipBack className="h-4 w-4" />
      </button>

      {/* Play/Pause - always visible in center */}
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "inline-flex items-center justify-center w-8 h-8 rounded-[calc(var(--radius)-4px)]",
          "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        )}
        aria-label={isPlaying ? "Pause music" : "Play music"}
        title={currentTrack ? currentTrack.name : "Play music"}
      >
        <Icon className="h-4 w-4" />
      </button>

      {/* Next - hidden when collapsed, shown on hover (right of play) */}
      <button
        type="button"
        onClick={playNext}
        className={cn(
          "inline-flex items-center justify-center w-8 h-8 rounded-[calc(var(--radius)-4px)]",
          "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          "w-0 opacity-0 group-hover:w-8 group-hover:opacity-100 overflow-hidden"
        )}
        aria-label="Next track"
      >
        <SkipForward className="h-4 w-4" />
      </button>
    </div>
  );
}
