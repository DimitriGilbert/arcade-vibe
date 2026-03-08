"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard, ArcadeButton } from "@/components/arcade";
import { RefreshCw, Zap } from "lucide-react";
import type { Theme, LeaderboardEntry } from "@/lib/trpc-types";
import { formatTimeRemaining } from "@/lib/formatting";
import { useCurrentTheme } from "@/hooks/use-current-theme";
import { ThemeSelector } from "@/components/leaderboard/shared/theme-selector";
import {
	DashboardHeader,
	QuickStats,
	LeaderboardTable,
	TopPerformersCard,
	ModelStatsCard,
} from "@/components/leaderboard/dashboard";

const PAGE_SIZE = 30;

export default function LeaderboardDashboardPage() {
	const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
	const [cursor, setCursor] = useState<string | undefined>(undefined);
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const { 
		currentTheme, 
		allThemes, 
		isLoading: themeLoading, 
		setCurrentTheme 
	} = useCurrentTheme({ includeAllThemes: true });

	const { isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useQuery({
		queryKey: ["leaderboard-dashboard", currentTheme?.id],
		queryFn: async () => {
			const result = await trpcClient.leaderboard.getTop.query({
				themeId: currentTheme?.id,
				limit: PAGE_SIZE,
			});

			if (result) {
				setAllEntries(result.entries);
				setCursor(result.nextCursor ?? undefined);
				setHasMore(result.hasMore);
			} else {
				setAllEntries([]);
				setHasMore(false);
			}

			return result;
		},
		enabled: !themeLoading,
	});

	const loadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore) return;

		setIsLoadingMore(true);
		try {
			const result = await trpcClient.leaderboard.getTop.query({
				themeId: currentTheme?.id,
				limit: PAGE_SIZE,
				cursor,
			});

			if (result) {
				setAllEntries((prev) => [...prev, ...result.entries]);
				setCursor(result.nextCursor ?? undefined);
				setHasMore(result.hasMore);
			}
		} finally {
			setIsLoadingMore(false);
		}
	}, [cursor, hasMore, isLoadingMore, currentTheme?.id]);

	const uniquePlayers = useMemo(() => {
		const players = new Set(allEntries.map((e) => e.creator?.id).filter(Boolean));
		return players.size;
	}, [allEntries]);

	const topModel = useMemo(() => {
		const counts: Record<string, number> = {};
		allEntries.forEach((entry) => {
			if (entry.modelName) {
				counts[entry.modelName] = (counts[entry.modelName] ?? 0) + 1;
			}
		});
		const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
		return sorted[0]?.[0] ?? null;
	}, [allEntries]);

	const timeRemaining = currentTheme?.endDate
		? formatTimeRemaining(currentTheme.endDate)
		: "Ongoing";

	const isLoading = themeLoading || leaderboardLoading;

	const handleThemeSelect = useCallback((theme: Theme | null) => {
		setCurrentTheme(theme);
	}, [setCurrentTheme]);

	return (
		<div className="min-h-screen bg-background">
			<DashboardHeader
				theme={currentTheme ? { title: currentTheme.title ?? "Current Theme", endDate: currentTheme.endDate } : null}
				entriesCount={allEntries.length}
				topModel={topModel}
			/>

			<div className="container mx-auto py-4">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
					<div className="lg:col-span-9">
						<ArcadeCard className="overflow-hidden">
							<div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
								<div className="flex items-center gap-3">
									<Zap className="h-4 w-4 text-[var(--accent)]" />
									<span className="text-sm font-semibold">Leaderboard</span>
									{allThemes && allThemes.length > 0 && (
										<ThemeSelector
											currentTheme={currentTheme}
											themes={allThemes}
											onSelect={handleThemeSelect}
											includeAllOption={true}
										/>
									)}
								</div>
								<div className="flex items-center gap-2">
								<ArcadeButton
									variant="outline"
									size="sm"
									onClick={() => refetchLeaderboard()}
									disabled={isLoading}
									className="gap-1"
								>
									<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
									Refresh
								</ArcadeButton>
							</div>
							</div>
							<LeaderboardTable
								entries={allEntries}
								isLoading={isLoading}
								hasMore={hasMore}
								onLoadMore={loadMore}
								isLoadingMore={isLoadingMore}
							/>
						</ArcadeCard>
					</div>

					<div className="lg:col-span-3 space-y-4">
						<QuickStats
							entries={allEntries.length}
							uniquePlayers={uniquePlayers}
							topModel={topModel}
							timeRemaining={timeRemaining}
						/>
						<TopPerformersCard entries={allEntries} />
						<ModelStatsCard entries={allEntries} />
					</div>
				</div>

				{allEntries.length > 0 && (
					<div className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
						{allEntries.length} entries loaded
						{hasMore && " • scroll down for more"}
					</div>
				)}
			</div>
		</div>
	);
}
