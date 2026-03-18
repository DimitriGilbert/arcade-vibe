"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { trpcClient } from "@/utils/trpc";
import { ArcadeCard, ArcadeButton, ArcadeBadge } from "@/components/arcade";
import { EmptyState } from "@/components/reusable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Swords,
	RefreshCw,
	Loader2,
	Flame,
	Sparkles,
	Gamepad2,
} from "lucide-react";
import type { LeaderboardEntry, ThemeList } from "@/lib/trpc-types";
import { useCurrentTheme } from "@/hooks/use-current-theme";
import { ThemeSelector } from "@/components/leaderboard/shared/theme-selector";
import {
	ChampionSkeleton,
	ChampionCard,
	RankedCard,
	ChallengerRow,
} from "@/components/leaderboard/arena";

const PAGE_SIZE = 50;

export default function ArenaClient() {
	const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
	const [cursor, setCursor] = useState<string | undefined>(undefined);
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [selectedTheme, setSelectedTheme] = useState<ThemeList | null>(null);

	const {
		currentTheme: serverTheme,
		allThemes: themes,
		isLoading: themesLoading,
		isError: themesError,
		setCurrentTheme,
	} = useCurrentTheme({ includeAllThemes: true });

	const currentTheme = selectedTheme ?? serverTheme;

	const handleThemeSelect = useCallback((theme: ThemeList | null) => {
		setSelectedTheme(theme);
		setCurrentTheme(theme);
		setAllEntries([]);
		setCursor(undefined);
		setHasMore(true);
	}, [setCurrentTheme]);

	const { isLoading: leaderboardLoading } = useQuery({
		queryKey: ["leaderboard-arena", currentTheme?.id],
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
		enabled: !!themes,
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

	const champion = allEntries[0];
	const second = allEntries[1];
	const third = allEntries[2];
	const fourth = allEntries[3];
	const fifth = allEntries[4];
	const challengers = allEntries.slice(5);
	const isLoading = themesLoading || leaderboardLoading;

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto py-8 px-4">
				<div className="mb-8">
					<div className="flex items-center justify-between gap-3 mb-2">
						<div className="flex items-center gap-3">
							<div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg shadow-purple-500/20">
								<Swords className="h-8 w-8 text-white" />
							</div>
							<div>
								<h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">
									THE ARENA
								</h1>
								<p className="text-[var(--muted-foreground)] font-medium">
									Who&apos;s holding it down today?
								</p>
							</div>
						</div>
						{themes && themes.length > 0 && (
							<ThemeSelector
								currentTheme={currentTheme}
								themes={themes}
								onSelect={handleThemeSelect}
								includeAllOption
							/>
						)}
					</div>
				</div>

				{currentTheme && (
					<ArcadeCard className="mb-6 overflow-hidden" variant="glow">
						<div className="p-4 bg-gradient-to-r from-[var(--primary)]/10 via-[var(--accent)]/10 to-[var(--primary)]/10">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-[var(--primary)]/20 rounded-lg">
										<Flame className="h-5 w-5 text-[var(--primary)]" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<h2 className="font-bold text-lg">{currentTheme.title}</h2>
											<ArcadeBadge text="Live" variant="neon" icon={<Sparkles className="h-3 w-3" />} />
										</div>
										<p className="text-sm text-[var(--muted-foreground)]">
											{currentTheme.description || "Jump in and make your mark!"}
										</p>
									</div>
								</div>
								<div className="hidden sm:flex items-center gap-4">
									<div className="text-sm text-[var(--muted-foreground)]">
										<span className="font-bold text-[var(--foreground)]">{allEntries.length}</span> players
									</div>
									<Link href="/creator">
										<ArcadeButton variant="primary" size="sm" className="gap-1">
											<Gamepad2 className="h-4 w-4" />
											Create Game
										</ArcadeButton>
									</Link>
								</div>
							</div>
						</div>
					</ArcadeCard>
				)}

				{themesError && (
					<ArcadeCard className="mb-6 border-destructive/50 bg-destructive/5">
						<div className="p-6">
							<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
								<div className="text-center sm:text-left">
									<h3 className="font-semibold text-destructive">
										Something went wrong
									</h3>
									<p className="text-sm text-muted-foreground">
										Couldn&apos;t load the arena data. Let&apos;s try again.
									</p>
								</div>
								<ArcadeButton
									variant="outline"
									onClick={() => window.location.reload()}
									className="gap-2"
								>
									<RefreshCw className="h-4 w-4" />
									Retry
								</ArcadeButton>
							</div>
						</div>
					</ArcadeCard>
				)}

				{isLoading ? (
					<div className="space-y-6">
						<ArcadeCard>
							<ChampionSkeleton />
						</ArcadeCard>
					</div>
				) : allEntries.length === 0 ? (
					<ArcadeCard>
						<div className="p-20">
							<EmptyState
								variant="card"
								icon={<Swords className="h-16 w-16 opacity-50" />}
								title="The arena is quiet..."
								message={
									currentTheme
										? `No one's stepped up for ${currentTheme.title} yet. Be the first!`
										: "Waiting for contenders. Pick a theme and get in there!"
								}
							/>
							<div className="text-center mt-6">
								<Link href="/creator">
									<ArcadeButton variant="primary" className="gap-2">
										<Gamepad2 className="h-5 w-5" />
										Start Creating
									</ArcadeButton>
								</Link>
							</div>
						</div>
					</ArcadeCard>
				) : (
					<div className="space-y-6">
						<div className="grid grid-cols-1 lg:grid-cols-4 grid-rows-3 gap-4" style={{ gridAutoRows: "minmax(180px, auto)" }}>
							{champion && (
								<div className="col-span-1 lg:col-span-2 row-span-3">
									<ChampionCard entry={champion} />
								</div>
							)}
							{second && (
								<div className="col-span-1 row-span-2">
									<RankedCard entry={second} rank={2} variant="tall" />
								</div>
							)}
							{third && (
								<div className="col-span-1 row-span-2">
									<RankedCard entry={third} rank={3} variant="tall" />
								</div>
							)}
							{fourth && (
								<div className="col-span-1 row-span-1">
									<RankedCard entry={fourth} rank={4} variant="compact" />
								</div>
							)}
							{fifth && (
								<div className="col-span-1 row-span-1">
									<RankedCard entry={fifth} rank={5} variant="compact" />
								</div>
							)}
						</div>

						{challengers.length > 0 && (
							<ArcadeCard>
								<div className="p-4 border-b border-[var(--border)]">
									<div className="flex items-center gap-2">
										<Swords className="h-5 w-5 text-[var(--accent)]" />
										<h2 className="text-lg font-bold">Challengers</h2>
										<span className="text-sm text-[var(--muted-foreground)]">
											({challengers.length} in the ring)
										</span>
									</div>
								</div>

								<ScrollArea className="max-h-[600px]">
									<div className="divide-y divide-[var(--border)]">
										{challengers.map((entry, index) => (
											<ChallengerRow key={entry.gameId} entry={entry} rank={index + 6} />
										))}
									</div>
								</ScrollArea>

								{hasMore && (
									<div className="p-4 border-t border-[var(--border)]">
										<ArcadeButton
											variant="outline"
											onClick={loadMore}
											disabled={isLoadingMore}
											className="w-full gap-2"
										>
											{isLoadingMore ? (
												<>
													<Loader2 className="h-4 w-4 animate-spin" />
													Loading...
												</>
											) : (
												<>
													<Swords className="h-4 w-4" />
													See More Challengers
												</>
											)}
										</ArcadeButton>
									</div>
								)}
							</ArcadeCard>
						)}

						<div className="text-center text-sm text-[var(--muted-foreground)]">
							{allEntries.length} {allEntries.length === 1 ? "player" : "players"} in the arena
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
