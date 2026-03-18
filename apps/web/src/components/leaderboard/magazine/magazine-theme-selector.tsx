"use client";

import { useCallback } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ThemeSelector } from "@/components/leaderboard/shared/theme-selector";
import type { ThemeList } from "@/lib/trpc-types";

interface MagazineThemeSelectorProps {
  currentTheme: ThemeList | null;
  themes: ThemeList[];
}

export function MagazineThemeSelector({
  currentTheme,
  themes,
}: MagazineThemeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelect = useCallback((theme: ThemeList | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (theme?.id) {
      params.set("themeId", theme.id);
    } else {
      params.delete("themeId");
    }

    params.delete("limit");

    const query = params.toString();
    router.push((query ? `${pathname}?${query}` : pathname) as Route);
  }, [pathname, router, searchParams]);

  return (
    <ThemeSelector
      currentTheme={currentTheme}
      themes={themes}
      onSelect={handleSelect}
      includeAllOption={false}
    />
  );
}
