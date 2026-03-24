"use client";

import Link from "next/link";
import { ArcadeCard, ArcadeButton } from "@/components/arcade";
import { LoadingState } from "@/components/reusable";
import { Trophy, Calendar, Gamepad2, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrentTheme } from "@/hooks/use-current-theme";
import { useLeaderboardData } from "@/hooks/use-leaderboard-data";
import { ThemeSelector } from "@/components/leaderboard/shared/theme-selector";
import type { LeaderboardResult, ThemeList } from "@/lib/trpc-types";
import {
	CoverStoryCard,
	CompactLeaderboardRow,
	ThemeHero,
} from "@/components/leaderboard/magazine";

interface LeaderboardMagazineClientProps {
	initialCurrentTheme: ThemeList | null;
	initialThemes: ThemeList[];
	initialLeaderboardResult: LeaderboardResult | null;
}

export default function LeaderboardMagazineClient({
	initialCurrentTheme,
	initialThemes,
	initialLeaderboardResult,
}: LeaderboardMagazineClientProps) {
	const { currentTheme, allThemes, isLoading: themeLoading, setCurrentTheme } = useCurrentTheme({
		includeAllThemes: true,
		initialCurrentTheme,
		initialAllThemes: initialThemes,
	});

	const {
		entries,
		isLoading: leaderboardLoading,
		isLoadingMore,
		hasMore,
		loadMore,
	} = useLeaderboardData({
		themeId: currentTheme?.id,
		pageSize: 50,
		initialResult: initialLeaderboardResult,
		initialThemeId: initialCurrentTheme?.id,
	});

	const shouldShowBlockingLoading =
		(themeLoading && !currentTheme && initialThemes.length === 0) ||
		(leaderboardLoading && !initialLeaderboardResult && entries.length === 0);
	const top3 = entries.slice(0, 3);
	const rest = entries.slice(3);

	if (shouldShowBlockingLoading) {
		return (
			<main className="min-h-screen bg-background py-12">
				<div className="container mx-auto">
					<LoadingState size="lg" message="Loading leaderboard" />
				</div>
			</main>
		);
	}

	if (!currentTheme) {
		return (
			<main className="min-h-screen bg-background py-12">
				<div className="container mx-auto">
					<ArcadeCard className="p-12 text-center">
						<Calendar className="h-16 w-16 mx-auto text-[var(--muted-foreground)] mb-6 opacity-50" />
						<h1 className="text-2xl font-bold mb-4">No Active Theme</h1>
						<p className="text-[var(--muted-foreground)] mb-8">Check back for the next theme.</p>
						<Link href="/creator/ide">
							<ArcadeButton variant="primary">
								<Gamepad2 className="h-4 w-4" />
								Browse Games
							</ArcadeButton>
						</Link>
					</ArcadeCard>
				</div>
			</main>
		);
	}

	return (
<main className="min-h-screen bg-background py-12 px-4 md:px-6">
				<div className="container mx-auto space-y-12">
				<ThemeHero
					title={currentTheme.title}
					description={currentTheme.description}
					endDate={currentTheme.endDate}
					entryCount={entries.length}
				/>

				{allThemes && allThemes.length > 1 && (
					<div className="flex items-center gap-4">
						<span className="text-sm text-[var(--muted-foreground)]">Theme:</span>
						<ThemeSelector
							currentTheme={currentTheme}
							themes={allThemes}
							onSelect={setCurrentTheme}
							includeAllOption={false}
						/>
					</div>
				)}

				{entries.length === 0 ? (
					<ArcadeCard className="p-12 text-center">
						<Trophy className="h-16 w-16 mx-auto text-[var(--muted-foreground)] mb-6 opacity-50" />
						<h2 className="text-2xl font-bold mb-4">No Games Yet</h2>
						<p className="text-[var(--muted-foreground)] mb-8">
							Be the first to submit a game for this theme.
						</p>
						<Link href="/creator/ide">
							<ArcadeButton variant="glow">
								<Gamepad2 className="h-4 w-4" />
								Create a Game
							</ArcadeButton>
						</Link>
					</ArcadeCard>
				) : (
					<>
						<section>
							<div className="flex items-center gap-3 mb-6">
								<Trophy className="h-6 w-6 text-[var(--accent)]" />
								<h2 className="text-2xl font-bold">Top 3</h2>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{top3.map((entry, idx) => (
									<CoverStoryCard key={entry.gameId} entry={entry} rank={idx + 1} />
								))}
							</div>
						</section>

						{rest.length > 0 && (
							<section>
								<div className="flex items-center gap-3 mb-6">
									<TrendingUp className="h-5 w-5 text-[var(--muted-foreground)]" />
									<h2 className="text-xl font-bold">Rankings</h2>
								</div>

								<ArcadeCard>
									<ScrollArea className="max-h-[600px]">
										<div className="divide-y divide-[var(--border)]">
											{rest.map((entry, idx) => (
												<CompactLeaderboardRow key={entry.gameId} entry={entry} rank={idx + 4} />
											))}
										</div>
									</ScrollArea>
								</ArcadeCard>

								{hasMore && (
									<div className="flex justify-center mt-6">
										<ArcadeButton
											variant="outline"
											onClick={() => void loadMore()}
											disabled={isLoadingMore}
										>
											{isLoadingMore ? "Loading..." : "Load More"}
										</ArcadeButton>
									</div>
								)}
							</section>
						)}
					</>
				)}

				<section className="pb-12">
					<ArcadeCard className="p-8 text-center bg-gradient-to-br from-[var(--primary)]/5 to-transparent">
						<h3 className="text-xl font-bold mb-3">Create a Game</h3>
						<p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
							Write a prompt, pick your AI model, and generate a game.
						</p>
						<Link href="/creator/ide">
							<ArcadeButton variant="glow" size="lg">
								<Gamepad2 className="h-5 w-5" />
								Start Creating
							</ArcadeButton>
						</Link>
					</ArcadeCard>
				</section>
			</div>
		</main>
	);
}
