"use client";

import Link from "next/link";
import { ArcadeCard, ArcadeButton } from "@/components/arcade";
import { Trophy, ChevronDown, Loader2, Play } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/trpc-types";
import { formatScore, formatDateShort } from "@/lib/formatting";
import { getRankStyle } from "@/lib/leaderboard-utils";
import { getModelDetailRoute } from "@/lib/model-routes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EntryActions } from "@/components/leaderboard/shared/entry-actions";

export function LeaderboardTable({
	entries,
	isLoading,
	hasMore,
	onLoadMore,
	isLoadingMore,
}: {
	entries: LeaderboardEntry[];
	isLoading: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
	isLoadingMore: boolean;
}) {
	if (isLoading) {
		const skeletonIds = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6", "sk-7", "sk-8", "sk-9", "sk-10"];
		return (
			<div className="animate-pulse">
				{skeletonIds.map((id) => (
					<div key={id} className="flex items-center gap-3 p-3 border-b border-[var(--border)]">
						<div className="w-8 h-8 bg-[var(--muted)] rounded" />
						<div className="flex-1 space-y-1.5">
							<div className="h-3.5 w-1/3 bg-[var(--muted)] rounded" />
							<div className="h-2.5 w-1/4 bg-[var(--muted)] rounded" />
						</div>
						<div className="w-16 h-5 bg-[var(--muted)] rounded" />
					</div>
				))}
			</div>
		);
	}

	if (entries.length === 0) {
		return (
			<div className="p-12 text-center">
				<Trophy className="h-12 w-12 mx-auto mb-3 text-[var(--muted-foreground)] opacity-30" />
				<p className="text-[var(--muted-foreground)]">No games yet - be the first to play!</p>
				<Link href="/login">
					<ArcadeButton variant="primary" size="sm" className="mt-4">
						Start Playing
					</ArcadeButton>
				</Link>
			</div>
		);
	}

	return (
		<>
			<ScrollArea className="h-[calc(100vh-280px)]">
				<table className="w-full">
					<thead className="sticky top-0 bg-[var(--card)] z-10">
						<tr className="border-b border-[var(--border)]">
							<th className="text-left text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] p-3 w-12">
								#
							</th>
							<th className="text-left text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] p-3">
								Game
							</th>
							<th className="text-right text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] p-3 w-24">
								Score
							</th>
							<th className="text-right text-[10px] uppercase tracking-wide text-[var(--muted-foreground)] p-3 w-20">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[var(--border)]">
						{entries.map((entry, idx) => {
							const rank = idx + 1;
							const playerName = entry.creator?.name ?? "Anonymous";
							const playerSlug = entry.creator?.name;
							const score = parseFloat(entry.finalScore) || 0;
							const rankStyle = getRankStyle(rank);

							return (
								<tr
									key={entry.gameId}
									className="hover:bg-[var(--muted)]/20 transition-colors group"
								>
									<td className="p-3">
										<span
											className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}
										>
											{rank}
										</span>
									</td>
									<td className="p-3">
										<div className="flex items-center gap-3">
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<Link
														href={`/game/${entry.gameId}`}
														className="font-medium text-sm hover:text-[var(--primary)] transition-colors truncate"
													>
														{entry.gameName || "Untitled"}
													</Link>
													<Link
														href={`/game/${entry.gameId}`}
														className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
													>
														<Play className="h-3.5 w-3.5 text-[var(--primary)]" />
													</Link>
												</div>
												<div className="flex items-center gap-3 mt-0.5">
													{playerSlug ? (
														<Link
															href={`/profile/${encodeURIComponent(playerSlug)}`}
															className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors truncate max-w-[120px]"
														>
															{playerName}
														</Link>
													) : (
														<span className="text-xs text-[var(--muted-foreground)] truncate max-w-[120px]">
															{playerName}
														</span>
													)}
													{entry.modelName && entry.modelId && (
														<>
															<span className="text-[var(--border)]">•</span>
															<Link
																href={getModelDetailRoute(entry.modelName, entry.modelId)}
																className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors truncate max-w-[80px]"
															>
																{entry.modelName}
															</Link>
														</>
													)}
													{entry.modelName && !entry.modelId && (
														<>
															<span className="text-[var(--border)]">•</span>
															<span className="text-[10px] text-[var(--muted-foreground)] truncate max-w-[80px]">
																{entry.modelName}
															</span>
														</>
													)}
												</div>
											</div>
										</div>
									</td>
									<td className="p-3 text-right">
										<div className="font-bold text-sm text-[var(--accent)]">
											{formatScore(score)}
										</div>
										<div className="text-[10px] text-[var(--muted-foreground)]">
											{formatDateShort(entry.submittedAt ?? entry.createdAt)}
										</div>
									</td>
									<td className="p-3 text-right">
										<EntryActions
											entry={entry}
											variant="hover"
											showFork={false}
											showEmbed={true}
											showPrompt={true}
										/>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</ScrollArea>

			{hasMore && (
				<div className="p-3 border-t border-[var(--border)]">
					<ArcadeButton
						variant="outline"
						size="sm"
						onClick={onLoadMore}
						disabled={isLoadingMore}
						className="w-full gap-1.5"
					>
						{isLoadingMore ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Loading...
							</>
						) : (
							<>
								<ChevronDown className="h-4 w-4" />
								Load More
							</>
						)}
					</ArcadeButton>
				</div>
			)}
		</>
	);
}
