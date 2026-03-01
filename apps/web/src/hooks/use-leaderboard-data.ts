import { useInfiniteQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import type { LeaderboardEntry } from "@/lib/trpc-types";

export interface UseLeaderboardDataOptions {
  themeId?: string;
  pageSize?: number;
}

export interface UseLeaderboardDataReturn {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => void;
}

const DEFAULT_PAGE_SIZE = 50;

export function useLeaderboardData(
  options?: UseLeaderboardDataOptions,
): UseLeaderboardDataReturn {
  const { themeId, pageSize = DEFAULT_PAGE_SIZE } = options ?? {};

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["leaderboard", "getTop", { themeId, pageSize }],
    queryFn: async ({ pageParam }) => {
      const result = await trpcClient.leaderboard.getTop.query({
        themeId,
        limit: pageSize,
        cursor: pageParam as string | undefined,
      });
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.hasMore || !lastPage.nextCursor) {
        return undefined;
      }
      return lastPage.nextCursor;
    },
    enabled: true,
  });

  const entries: LeaderboardEntry[] =
    data?.pages.flatMap((page) => (page?.entries ?? [])) ?? [];

  const loadMore = async (): Promise<void> => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  };

  return {
    entries,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    hasMore: hasNextPage ?? false,
    loadMore,
    refetch: () => {
      refetch();
    },
  };
}
