"use client";

import { useSyncExternalStore } from "react";

function getServerSnapshot(): boolean {
  return false;
}

function getSnapshot(query: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(query).matches;
}

function subscribe(query: string, onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const media = window.matchMedia(query);
  const listener = () => {
    onStoreChange();
  };

  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(query, onStoreChange),
    () => getSnapshot(query),
    getServerSnapshot,
  );
}
