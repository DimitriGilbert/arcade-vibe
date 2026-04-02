"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Globe, Package, Loader2 } from "lucide-react";
import { trpcClient } from "@/utils/trpc";
import {
  ArcadeDialog,
  ArcadeDialogContent,
  ArcadeDialogHeader,
  ArcadeDialogTitle,
  ArcadeDialogDescription,
} from "@/components/arcade/arcade-dialog";
import { ArcadeCard } from "@/components/arcade/arcade-card";
import { ArcadeButton } from "@/components/arcade/arcade-button";
import { ArcadeBadge } from "@/components/arcade/arcade-badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LibrariesDialogProps {
  themeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToPrompt: (text: string) => void;
}

type LibrarySource = {
  id: string;
  name: string;
  description: string;
  category: string;
  source: "global" | "theme";
};

const CATEGORY_ICONS: Record<string, string> = {
  game_engine: "🎮",
  physics: "⚡",
  audio: "🔊",
  graphics: "🎨",
  utility: "🔧",
  analytics: "📊",
  other: "📦",
};

const CATEGORY_LABELS: Record<string, string> = {
  game_engine: "Game Engine",
  physics: "Physics",
  audio: "Audio",
  graphics: "Graphics",
  utility: "Utility",
  analytics: "Analytics",
  other: "Other",
};

export function LibrariesDialog({
  themeId,
  open,
  onOpenChange,
  onAddToPrompt,
}: LibrariesDialogProps) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["libraries-by-theme", themeId],
    queryFn: async () => {
      if (!themeId) return { globalPatterns: [], themePatterns: [] };
      return await trpcClient.admin.libraryPatterns.getByTheme.query({
        themeId,
      });
    },
    enabled: !!themeId && open,
  });

  const allLibraries = useMemo<LibrarySource[]>(() => {
    const libs: LibrarySource[] = [
      ...(data?.globalPatterns ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        source: "global" as const,
      })),
      ...(data?.themePatterns ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        source: "theme" as const,
      })),
    ];
    return libs;
  }, [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allLibraries;
    const q = search.toLowerCase();
    return allLibraries.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        (CATEGORY_LABELS[l.category] ?? l.category).toLowerCase().includes(q),
    );
  }, [allLibraries, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, { label: string; libs: LibrarySource[] }> = {};
    for (const lib of filtered) {
      const cat = lib.category;
      if (!groups[cat]) {
        groups[cat] = {
          label: CATEGORY_LABELS[cat] ?? cat,
          libs: [],
        };
      }
      groups[cat].libs.push(lib);
    }
    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  }, [filtered]);

  return (
    <ArcadeDialog open={open} onOpenChange={onOpenChange}>
      <ArcadeDialogContent size="full" className="sm:max-w-7xl max-h-[85vh] flex flex-col overflow-hidden">
        <ArcadeDialogHeader>
          <ArcadeDialogTitle>Available Libraries</ArcadeDialogTitle>
          <ArcadeDialogDescription>
            All the libraries below are allowed for this theme. Click any library to add a recommendation to your prompt.
          </ArcadeDialogDescription>
          {allLibraries.length > 6 && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search libraries..."
                className="w-full h-9 pl-9 pr-3 rounded-[var(--radius)] border-2 border-[var(--border)] bg-[var(--input)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-all duration-200 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 hover:border-[var(--primary)]/50"
              />
            </div>
          )}
        </ArcadeDialogHeader>

        <ScrollArea className="h-[calc(85vh-12rem)]">
          <div className="px-1 pb-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="size-6 text-[var(--primary)] animate-spin" />
                <span className="text-sm text-[var(--muted-foreground)]">Loading libraries...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Package className="size-8 text-[var(--muted-foreground)]/40" />
                <span className="text-sm text-[var(--muted-foreground)]">
                  {search ? "No libraries match your search." : "No libraries available for this theme."}
                </span>
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map((group) => (
                  <div key={group.label}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3 flex items-center gap-2">
                      <span>{CATEGORY_ICONS[group.libs[0]?.category ?? "other"]}</span>
                      {group.label}
                      <span className="font-normal text-[var(--muted-foreground)]/60">
                        {group.libs.length}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.libs.map((lib) => (
                        <ArcadeCard
                          key={lib.id}
                          title={lib.name}
                          subtitle={lib.description || undefined}
                          icon={<span className="text-base">{CATEGORY_ICONS[lib.category] ?? "📦"}</span>}
                          className="cursor-pointer hover:border-[var(--primary)]/40 transition-colors"
                          onClick={() => {
                            onAddToPrompt(`you should use ${lib.name}`);
                            onOpenChange(false);
                          }}
                        >
                          <div className="flex items-center justify-between -mt-1">
                            {lib.source === "global" ? (
                              <ArcadeBadge
                                text="Global"
                                icon={<Globe className="size-3" />}
                              />
                            ) : (
                              <ArcadeBadge
                                text="Theme"
                                icon={<Package className="size-3" />}
                                variant="neon"
                              />
                            )}
                            <span className="inline-flex size-7 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] text-[var(--muted-foreground)] group-hover/arcade-card:border-[var(--primary)]/40 group-hover/arcade-card:text-[var(--primary)] transition-colors">
                              <Plus className="size-3.5" />
                            </span>
                          </div>
                        </ArcadeCard>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </ArcadeDialogContent>
    </ArcadeDialog>
  );
}
