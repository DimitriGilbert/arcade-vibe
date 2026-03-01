"use client";

import Link from "next/link";
import { ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { Sparkles, Clock, TrendingUp, Gamepad2 } from "lucide-react";
import { formatTimeRemaining } from "@/lib/formatting";

export function ThemeHero({
	title,
	description,
	endDate,
	entryCount,
}: {
	title: string;
	description: string | null | undefined;
	endDate: string | null | undefined;
	entryCount: number;
}) {
	const timeRemaining = endDate ? formatTimeRemaining(new Date(endDate)) : null;

	return (
		<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)]/5 via-[var(--card)] to-[var(--card)] border border-[var(--border)]">
			<div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

			<div className="relative p-8 md:p-12">
				<div className="flex items-center gap-3 mb-4">
					<Sparkles className="h-5 w-5 text-[var(--primary)]" />
					<ArcadeBadge text="Current Theme" variant="neon" />
				</div>

				<h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{title.toUpperCase()}</h1>

				<p className="text-lg text-[var(--muted-foreground)] max-w-2xl mb-6">
					{description ?? "Games built for this theme."}
				</p>

				<div className="flex flex-wrap items-center gap-8">
					{timeRemaining && (
						<div className="flex items-center gap-2">
							<Clock className="h-5 w-5 text-[var(--muted-foreground)]" />
							<div>
								<p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Time Left</p>
								<p className="text-xl font-bold text-[var(--accent)]">{timeRemaining}</p>
							</div>
						</div>
					)}

					<div className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5 text-[var(--muted-foreground)]" />
						<div>
							<p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Entries</p>
							<p className="text-xl font-bold">{entryCount}</p>
						</div>
					</div>

					<Link href="/creator">
						<ArcadeButton variant="primary">
							<Gamepad2 className="h-4 w-4" />
							Create Game
						</ArcadeButton>
					</Link>
				</div>
			</div>
		</div>
	);
}
