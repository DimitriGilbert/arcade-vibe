"use client";

import { Search, Filter } from "lucide-react";
import { ArcadeInput } from "@/components/arcade";
import type { GameStatus } from "@/lib/trpc-types";

export interface GameFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: GameStatus | "all";
  onStatusChange: (value: GameStatus | "all") => void;
  isSubmittedFilter: "all" | boolean;
  onIsSubmittedChange: (value: "all" | boolean) => void;
  isHiddenFilter: "all" | boolean;
  onIsHiddenChange: (value: "all" | boolean) => void;
}

export function GameFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  isSubmittedFilter,
  onIsSubmittedChange,
  isHiddenFilter,
  onIsHiddenChange,
}: GameFiltersProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
        <ArcadeInput
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-[var(--muted-foreground)]" />
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as GameStatus | "all")}
          className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="generating">Generating</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="hidden">Hidden</option>
        </select>
        <select
          value={isSubmittedFilter.toString()}
          onChange={(e) =>
            onIsSubmittedChange(
              e.target.value === "all" ? "all" : e.target.value === "true"
            )
          }
          className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
        >
          <option value="all">All Submission</option>
          <option value="true">Submitted</option>
          <option value="false">Not Submitted</option>
        </select>
        <select
          value={isHiddenFilter.toString()}
          onChange={(e) =>
            onIsHiddenChange(
              e.target.value === "all" ? "all" : e.target.value === "true"
            )
          }
          className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
        >
          <option value="all">All Visibility</option>
          <option value="true">Hidden</option>
          <option value="false">Visible</option>
        </select>
      </div>
    </div>
  );
}
