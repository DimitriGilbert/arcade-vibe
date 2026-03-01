import { Skeleton } from "@/components/ui/skeleton";

export interface LeaderboardSkeletonProps {
  /** Number of skeleton items to render. Default: 10 */
  count?: number;
  /** Visual variant of the skeleton. Default: "table" */
  variant?: "table" | "cards" | "podium";
}

function TableSkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4">
      {/* Rank circle */}
      <div className="w-12 flex-shrink-0 flex justify-center">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>

      {/* Game icon */}
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />

      {/* Content area */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-5 w-3/4 max-w-[200px]" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Badge */}
      <Skeleton className="h-6 w-16 rounded-full shrink-0" />

      {/* Score */}
      <div className="text-right shrink-0 space-y-1">
        <Skeleton className="h-5 w-16 ml-auto" />
        <Skeleton className="h-3 w-8 ml-auto" />
      </div>

      {/* Action button */}
      <Skeleton className="w-9 h-9 rounded-md shrink-0" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] h-full">
      <div className="p-4 h-full flex flex-col">
        {/* Rank and badge row */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Game name */}
        <Skeleton className="h-6 w-3/4 mb-2" />

        {/* Creator */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Model */}
        <div className="flex items-center gap-1 mb-3">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-3 w-8" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 mb-3 mt-auto">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-8" />
        </div>

        {/* Action buttons */}
        <div className="flex gap-1">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="w-8 h-8 rounded-md" />
          <Skeleton className="w-8 h-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function PodiumChampionSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] h-full">
      <div className="p-6 h-full flex flex-col">
        {/* Center stage badge */}
        <div className="text-center mb-4">
          <Skeleton className="h-7 w-28 rounded-full mx-auto" />
        </div>

        {/* Trophy circle */}
        <div className="text-center flex-1 flex flex-col justify-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />

          {/* Game name */}
          <Skeleton className="h-7 w-40 mx-auto mb-3" />

          {/* Creator row */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-1 mb-3">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>

          {/* Model and date */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 justify-center mt-auto">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function PodiumRankedSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] h-full">
      <div className="p-4 h-full flex flex-col">
        {/* Rank and badge */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>

        {/* Game name */}
        <Skeleton className="h-5 w-3/4 mb-2" />

        {/* Creator */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Model */}
        <div className="flex items-center gap-1 mb-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-3 w-6" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-3 w-6" />
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 mb-3 mt-auto">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-6" />
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <Skeleton className="h-7 flex-1 rounded-md" />
          <Skeleton className="w-7 h-7 rounded-md" />
          <Skeleton className="w-7 h-7 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function PodiumCompactSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] h-full">
      <div className="p-3 h-full flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />

        <div className="flex-1 min-w-0 space-y-1">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>

        <Skeleton className="w-9 h-9 rounded-md shrink-0" />
      </div>
    </div>
  );
}

function TableSkeleton({ count }: { count: number }) {
  const items = Array.from({ length: count }, (_, i) => `skeleton-table-${i}`);
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] divide-y divide-[var(--border)]">
      {items.map((key) => (
        <TableSkeletonRow key={key} />
      ))}
    </div>
  );
}

function CardsSkeleton({ count }: { count: number }) {
  const items = Array.from({ length: count }, (_, i) => `skeleton-card-${i}`);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((key) => (
        <CardSkeleton key={key} />
      ))}
    </div>
  );
}

function PodiumSkeleton({ count }: { count: number }) {
  // Podium layout: champion takes 2 cols + 2 rows, next 2 take 1 col + 2 rows each,
  // next 2 take 1 col + 1 row each
  // Grid is 4 columns

  const items = Math.min(count, 10); // Cap at 10 for podium view
  const challengerCount = Math.max(0, items - 5);

  return (
    <div className="space-y-6">
      {/* Podium grid - always show the structure */}
      <div
        className="grid grid-cols-1 lg:grid-cols-4 gap-4"
        style={{ gridAutoRows: "minmax(180px, auto)" }}
      >
        {/* Champion - 2 cols, spans 3 rows worth */}
        <div className="col-span-1 lg:col-span-2 row-span-3">
          <PodiumChampionSkeleton />
        </div>

        {/* 2nd place - 1 col, 2 rows */}
        <div className="col-span-1 row-span-2">
          <PodiumRankedSkeleton />
        </div>

        {/* 3rd place - 1 col, 2 rows */}
        <div className="col-span-1 row-span-2">
          <PodiumRankedSkeleton />
        </div>

        {/* 4th place - 1 col, 1 row */}
        <div className="col-span-1 row-span-1">
          <PodiumCompactSkeleton />
        </div>

        {/* 5th place - 1 col, 1 row */}
        <div className="col-span-1 row-span-1">
          <PodiumCompactSkeleton />
        </div>
      </div>

      {/* Challengers section */}
      {challengerCount > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {Array.from({ length: challengerCount }, (_, i) => `skeleton-challenger-${i}`).map((key) => (
              <TableSkeletonRow key={key} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function LeaderboardSkeleton({ count = 10, variant = "table" }: LeaderboardSkeletonProps) {
  switch (variant) {
    case "cards":
      return <CardsSkeleton count={count} />;
    case "podium":
      return <PodiumSkeleton count={count} />;
    case "table":
    default:
      return <TableSkeleton count={count} />;
  }
}
