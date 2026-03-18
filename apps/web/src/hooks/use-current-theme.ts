/**
 * @fileoverview Hook for managing the current theme state
 *
 * Provides access to the current active theme and optionally all themes.
 * Uses local React state for optimistic UI updates via setCurrentTheme.
 */

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import type { ThemeList } from "@/lib/trpc-types";

/**
 * Options for the useCurrentTheme hook
 */
export interface UseCurrentThemeOptions {
  /** Whether to fetch all themes in addition to the current one */
  includeAllThemes?: boolean;
  /** Server-provided current theme for SSR hydration */
  initialCurrentTheme?: ThemeList | null;
  /** Server-provided theme list for SSR hydration */
  initialAllThemes?: ThemeList[];
}

/**
 * Return type for the useCurrentTheme hook
 */
export interface UseCurrentThemeReturn {
  /** The current active theme, or null if none */
  currentTheme: ThemeList | null;
  /** All themes if includeAllThemes was true, otherwise undefined */
  allThemes?: ThemeList[];
  /** Whether the theme data is currently loading */
  isLoading: boolean;
  /** Whether there was an error loading the theme */
  isError: boolean;
  /** Update the current theme in local state */
  setCurrentTheme: (theme: ThemeList | null) => void;
}

/**
 * Hook for accessing and managing the current theme
 *
 * @param options - Configuration options
 * @param options.includeAllThemes - Set to true to also fetch all available themes
 * @returns Theme data and controls
 *
 * @example
 * ```tsx
 * // Basic usage - just get current theme
 * const { currentTheme, isLoading } = useCurrentTheme();
 *
 * // With all themes
 * const { currentTheme, allThemes, setCurrentTheme } = useCurrentTheme({ includeAllThemes: true });
 * ```
 */
export function useCurrentTheme(
  options?: UseCurrentThemeOptions,
): UseCurrentThemeReturn {
  const {
    includeAllThemes = false,
    initialCurrentTheme,
    initialAllThemes,
  } = options ?? {};

  // Local state for optimistic updates
  const [localCurrentTheme, setLocalCurrentTheme] = useState<ThemeList | null>(
    null,
  );

  // Fetch current theme
  const {
    data: currentThemeData,
    isLoading: currentLoading,
    isError: currentError,
  } = useQuery({
    queryKey: ["themes", "current"],
    queryFn: async (): Promise<ThemeList | null> => {
      try {
        const result = await trpcClient.themes.getCurrent.query();
        return result as ThemeList;
      } catch (error) {
        console.error("Error fetching current theme:", error);
        return null;
      }
    },
    initialData: initialCurrentTheme,
  });

  // Fetch all themes if requested
  const { data: allThemesData, isLoading: allLoading } = useQuery({
    queryKey: ["themes", "list"],
    queryFn: async (): Promise<ThemeList[]> => {
      try {
        const result = await trpcClient.themes.list.query();
        return result as ThemeList[];
      } catch (error) {
        console.error("Error fetching themes list:", error);
        return [];
      }
    },
    enabled: includeAllThemes,
    initialData: initialAllThemes,
  });

  // Use local state if set, otherwise use server data
  const currentTheme = localCurrentTheme ?? currentThemeData ?? null;

  // Callback to update local theme state
  const setCurrentTheme = useCallback((theme: ThemeList | null) => {
    setLocalCurrentTheme(theme);
  }, []);

  const isLoading = currentLoading || (includeAllThemes && allLoading);

  return {
    currentTheme,
    allThemes: includeAllThemes ? (allThemesData ?? []) : undefined,
    isLoading,
    isError: currentError,
    setCurrentTheme,
  };
}
