"use client";

import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from "react";

const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000;

interface PersistedData<T> {
  data: T;
  timestamp: number;
}

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  expiryMs: number = DEFAULT_EXPIRY_MS,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const [state, setState] = useState<T>(defaultValue);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        setMounted(true);
        return;
      }

      const parsed = JSON.parse(stored) as PersistedData<T>;
      if (Date.now() - parsed.timestamp > expiryMs) {
        localStorage.removeItem(key);
        setMounted(true);
        return;
      }

      setState(parsed.data);
    } catch {
      // Invalid JSON or storage error
    }

    setMounted(true);
  }, [key, expiryMs]);

  const setPersistedState: Dispatch<SetStateAction<T>> = useCallback(
    (action) => {
      setState((prevState) => {
        const newState = action instanceof Function ? action(prevState) : action;

        if (typeof window !== "undefined") {
          try {
            const toStore: PersistedData<T> = {
              data: newState,
              timestamp: Date.now(),
            };
            localStorage.setItem(key, JSON.stringify(toStore));
          } catch {
            // Storage might be full or disabled
          }
        }

        return newState;
      });
    },
    [key],
  );

  const clearState = useCallback(() => {
    setState(defaultValue);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
    }
  }, [key, defaultValue]);

  return [state, setPersistedState, clearState];
}
