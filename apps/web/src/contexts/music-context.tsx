"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { MusicTrack, MusicState } from "@/lib/music-types";

type MusicContextType = {
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  tracks: MusicTrack[];
  isLoading: boolean;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setTrack: (id: string) => void;
};

const MusicContext = createContext<MusicContextType | null>(null);

const STORAGE_KEY = "arcade-vibe-music";

function loadStoredState(): MusicState {
  if (typeof window === "undefined") {
    return { isPlaying: false, currentTrackId: null };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as MusicState;
    }
  } catch {
    // ignore
  }
  return { isPlaying: false, currentTrackId: null };
}

function saveState(state: MusicState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const strudelReadyRef = useRef(false);
  const isPlayingRef = useRef(false);
  // Store the repl instance returned by initStrudel
  const replRef = useRef<{ scheduler: { stop: () => void }; setPattern: (p: unknown, play: boolean) => void; evaluate: (code: string) => Promise<void> } | null>(null);

  // Load Strudel web package once
  useEffect(() => {
    if (typeof window === "undefined") return;

    const existingScript = document.querySelector(
      'script[src="https://unpkg.com/@strudel/web@latest"]'
    );

    if (existingScript && strudelReadyRef.current) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@strudel/web@latest";
    script.async = true;

    script.onload = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;

        if (typeof win.initStrudel !== "function") {
          throw new Error("initStrudel not found");
        }

        // initStrudel returns the repl instance - we MUST use this for stop
        const repl = await win.initStrudel();
        replRef.current = repl;

        // Load samples
        if (typeof win.samples === "function") {
          try {
            await win.samples("github:tidalcycles/dirt-samples");
          } catch (e) {
            console.warn("Could not load dirt-samples:", e);
          }
          try {
            await win.samples("https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json");
          } catch (e) {
            console.warn("Could not load tidal-drum-machines:", e);
          }
        }

        strudelReadyRef.current = true;
      } catch (e) {
        console.error("Failed to init Strudel:", e);
      }
      setIsLoading(false);
    };

    script.onerror = () => {
      console.error("Failed to load Strudel script");
      setIsLoading(false);
    };

    document.head.appendChild(script);
  }, []);

  // Load tracks index
  useEffect(() => {
    fetch("/music/index.json")
      .then((res) => res.json())
      .then((data: { tracks: MusicTrack[] }) => {
        setTracks(data.tracks);

        const stored = loadStoredState();
        if (stored.currentTrackId) {
          const track = data.tracks.find((t) => t.id === stored.currentTrackId);
          if (track) {
            setCurrentTrack(track);
          }
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  // Save state when it changes
  useEffect(() => {
    if (!isLoading) {
      saveState({
        isPlaying,
        currentTrackId: currentTrack?.id ?? null,
      });
    }
  }, [isPlaying, currentTrack, isLoading]);

  const loadTrackCode = useCallback(async (track: MusicTrack): Promise<string | null> => {
    try {
      const res = await fetch(`/music/${track.file}`);
      return await res.text();
    } catch (error) {
      console.error("Failed to load track:", error);
      return null;
    }
  }, []);

  const playTrack = useCallback(async (track: MusicTrack) => {
    if (!strudelReadyRef.current || !replRef.current) return;

    const code = await loadTrackCode(track);
    if (!code) return;

    const repl = replRef.current;

    // Stop any existing playback using the SAME scheduler
    repl.scheduler.stop();

    // Evaluate new code on the SAME repl instance
    await repl.evaluate(code);
    isPlayingRef.current = true;
    setIsPlaying(true);
  }, [loadTrackCode]);

  const stopPlayback = useCallback(() => {
    if (!replRef.current) return;

    // Stop using the SAME scheduler that was used to play
    replRef.current.scheduler.stop();
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(async () => {
    if (!strudelReadyRef.current) return;

    if (isPlayingRef.current) {
      stopPlayback();
      return;
    }

    if (currentTrack) {
      await playTrack(currentTrack);
    } else if (tracks.length > 0) {
      const track = tracks[0]!;
      setCurrentTrack(track);
      await playTrack(track);
    }
  }, [currentTrack, tracks, playTrack, stopPlayback]);

  const setTrack = useCallback((id: string) => {
    const track = tracks.find((t) => t.id === id);
    if (track) {
      setCurrentTrack(track);
      if (isPlayingRef.current) {
        playTrack(track);
      }
    }
  }, [tracks, playTrack]);

  const playNext = useCallback(async () => {
    if (tracks.length === 0) return;
    const currentIndex = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : -1;
    const nextIndex = (currentIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIndex]!;
    setCurrentTrack(nextTrack);
    await playTrack(nextTrack);
  }, [tracks, currentTrack, playTrack]);

  const playPrevious = useCallback(async () => {
    if (tracks.length === 0) return;
    const currentIndex = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : 0;
    const prevIndex = currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;
    const prevTrack = tracks[prevIndex]!;
    setCurrentTrack(prevTrack);
    await playTrack(prevTrack);
  }, [tracks, currentTrack, playTrack]);

  return (
    <MusicContext.Provider
      value={{
        isPlaying,
        currentTrack,
        tracks,
        isLoading,
        togglePlay,
        playNext,
        playPrevious,
        setTrack,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic(): MusicContextType {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
