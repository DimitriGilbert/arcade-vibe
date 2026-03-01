"use client";

import Link from "next/link";
import { ArcadeButton } from "@/components/arcade";
import { Trophy, Cpu, Gamepad2 } from "lucide-react";
import { formatTimeRemaining } from "@/lib/formatting";

export function DashboardHeader({
	theme,
	entriesCount,
	topModel,
}: {
	theme: { title: string; endDate: string | null } | null;
	entriesCount: number;
	topModel: string | null;
}) {
	const timeRemaining = theme?.endDate ? formatTimeRemaining(theme.endDate) : "Ongoing";

	return (
		<div className="border-b border-[var(--border)] bg-[var(--card)]">
			<div className="px-4 py-3">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3 min-w-0">
						<div className="p-2 bg-[var(--primary)]/10 rounded-lg shrink-0">
							<Trophy className="h-5 w-5 text-[var(--primary)]" />
						</div>
						<div className="min-w-0">
							<h1 className="text-lg font-bold truncate">
								{theme?.title ?? "All Games"}
							</h1>
							<p className="text-xs text-[var(--muted-foreground)]">
								{entriesCount} entries • {timeRemaining}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						{topModel && (
							<div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--muted)]/50 rounded-lg text-xs">
								<Cpu className="h-3.5 w-3.5 text-[var(--primary)]" />
								<span className="text-[var(--muted-foreground)]">Top model:</span>
								<span className="font-medium truncate max-w-[100px]">{topModel}</span>
							</div>
						)}
						<Link href="/login">
							<ArcadeButton variant="primary" size="sm" className="gap-1.5">
								<Gamepad2 className="h-4 w-4" />
								<span className="hidden sm:inline">Play</span>
							</ArcadeButton>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
