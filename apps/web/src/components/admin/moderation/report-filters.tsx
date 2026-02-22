"use client";

import { Search } from "lucide-react";
import { ArcadeCard, ArcadeInput } from "@/components/arcade";
import type {
  ModerationFilters,
  ReportStatus,
  ReportTargetType,
} from "./types";

export interface ReportFiltersProps {
  filters: ModerationFilters;
  onFiltersChange: (filters: ModerationFilters) => void;
}

/**
 * Filter controls for moderation queue
 * Client component - has interactive state for search and filters
 */
export function ReportFilters({ filters, onFiltersChange }: ReportFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      searchQuery: e.target.value,
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      statusFilter: e.target.value as ReportStatus | "all",
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      typeFilter: e.target.value as ReportTargetType | "all",
    });
  };

  return (
    <ArcadeCard>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <ArcadeInput
              placeholder="Search reports..."
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <select
            value={filters.statusFilter}
            onChange={handleStatusChange}
            className="px-3 py-2 border rounded-md bg-[var(--background)]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select
            value={filters.typeFilter}
            onChange={handleTypeChange}
            className="px-3 py-2 border rounded-md bg-[var(--background)]"
          >
            <option value="all">All Types</option>
            <option value="prompt">Prompts</option>
            <option value="game">Games</option>
            <option value="user">Users</option>
            <option value="review">Reviews</option>
          </select>
        </div>
      </div>
    </ArcadeCard>
  );
}
