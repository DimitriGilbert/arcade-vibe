"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * Returns true when the viewport is below the `lg` breakpoint (1024px).
 * Uses `useSyncExternalStore` under the hood for hydration safety.
 *
 * Must match Tailwind's `lg` boundary exactly so JS and CSS agree.
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}
