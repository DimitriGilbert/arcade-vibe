export function ChampionSkeleton() {
	return (
		<div className="animate-pulse text-center py-12">
			<div className="w-24 h-24 mx-auto bg-[var(--muted)] rounded-full mb-4" />
			<div className="h-8 w-48 mx-auto bg-[var(--muted)] rounded mb-2" />
			<div className="h-4 w-32 mx-auto bg-[var(--muted)] rounded" />
		</div>
	);
}
