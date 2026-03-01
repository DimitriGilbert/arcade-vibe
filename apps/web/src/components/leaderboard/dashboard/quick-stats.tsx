"use client";

import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import { Gamepad2, Users, Clock, Cpu } from "lucide-react";

export function QuickStats({
	entries,
	uniquePlayers,
	topModel,
	timeRemaining,
}: {
	entries: number;
	uniquePlayers: number;
	topModel: string | null;
	timeRemaining: string;
}) {
	const stats = [
		{ value: entries, label: "entries", icon: <Gamepad2 className="h-4 w-4" /> },
		{ value: uniquePlayers, label: "players", icon: <Users className="h-4 w-4" /> },
		{ value: timeRemaining, label: "remaining", icon: <Clock className="h-4 w-4" /> },
	];

	return (
		<ArcadeCard className="p-3">
			<div className="grid grid-cols-3 gap-2">
				{stats.map((stat) => (
					<div key={stat.label + "-stat"} className="text-center">
						<div className="flex items-center justify-center gap-1 text-[var(--primary)] mb-1">
							{stat.icon}
						</div>
						<p className="text-lg font-bold leading-none">{stat.value}</p>
						<p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide mt-0.5">
							{stat.label}
						</p>
					</div>
				))}
			</div>
			{topModel && (
				<div className="mt-3 pt-3 border-t border-[var(--border)]">
					<div className="flex items-center justify-between text-xs">
						<span className="text-[var(--muted-foreground)]">Popular model</span>
						<div className="flex items-center gap-1">
							<Cpu className="h-3 w-3 text-[var(--accent)]" />
							<span className="font-medium">{topModel}</span>
						</div>
					</div>
				</div>
			)}
		</ArcadeCard>
	);
}
