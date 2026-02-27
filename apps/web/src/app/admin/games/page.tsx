"use client";

import type { Route } from "next";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Search,
  Eye,
  EyeOff,
  ExternalLink,
  Filter,
} from "lucide-react";
import {
  ArcadeCard,
  ArcadeButton,
  ArcadeInput,
  ArcadeBadge,
} from "@/components/arcade";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { LoadingState } from "@/components/reusable";
import { EmptyState } from "@/components/reusable";
import UserAvatar from "@/components/reusable/user-avatar";
import { trpcClient } from "@/utils/trpc";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import type { GameAdminView, GameStatus } from "@/lib/trpc-types";

export default function AdminGamesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<GameStatus | "all">("all");
  const [isSubmittedFilter, setIsSubmittedFilter] = useState<"all" | boolean>(
    "all"
  );
  const [isHiddenFilter, setIsHiddenFilter] = useState<"all" | boolean>("all");
  const [hideDialog, setHideDialog] = useState<{
    open: boolean;
    game: GameAdminView | null;
  }>({
    open: false,
    game: null,
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const queryClient = useQueryClient();

  const { data: games, isLoading } = useQuery({
    queryKey: ["admin-games", page, statusFilter, isSubmittedFilter, isHiddenFilter],
    queryFn: async () => {
      return await trpcClient.admin.direct.getGames.query({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        isSubmitted: isSubmittedFilter === "all" ? undefined : isSubmittedFilter,
        isHidden: isHiddenFilter === "all" ? undefined : isHiddenFilter,
      });
    },
  });

  const hideGameMutation = useMutation({
    mutationFn: async (input: { gameId: string; reason: string }) => {
      return await trpcClient.admin.direct.hideGame.mutate(input);
    },
    onSuccess: () => {
      toast.success("Game hidden successfully!");
      setHideDialog({ open: false, game: null });
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to hide game");
    },
  });

  const unhideGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      return await trpcClient.admin.direct.unhideGame.mutate({ gameId });
    },
    onSuccess: () => {
      toast.success("Game unhidden successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-games"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unhide game");
    },
  });

  const filteredGames = (games || []).filter((game) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      game.name?.toLowerCase().includes(query) ||
      game.prompt?.user?.name?.toLowerCase().includes(query) ||
      game.prompt?.user?.email.toLowerCase().includes(query) ||
      game.theme?.title.toLowerCase().includes(query)
    );
  });

  const HideGameForm = () => {
    const schema = z.object({
      reason: z.string().min(10).max(500),
    });

    const { Form } = useFormedible({
      schema,
      fields: [
        {
          name: "reason",
          type: "textarea",
          label: "Reason for Hiding",
          textareaConfig: { rows: 3, maxLength: 500 },
        },
      ],
      formOptions: {
        defaultValues: {
          reason: "",
        },
        onSubmit: async ({ value }) => {
          if (hideDialog.game) {
            await hideGameMutation.mutateAsync({
              gameId: hideDialog.game.id,
              reason: value.reason,
            });
          }
        },
      },
    });

    return <Form className="space-y-4" />;
  };

  const getStatusBadge = (status: GameStatus) => {
    switch (status) {
      case "completed":
        return <ArcadeBadge text="Completed" variant="neon" />;
      case "generating":
        return <ArcadeBadge text="Generating" variant="default" />;
      case "failed":
        return <ArcadeBadge text="Failed" variant="pixel" />;
      case "hidden":
        return <ArcadeBadge text="Hidden" variant="pixel" />;
      default:
        return <ArcadeBadge text={status} variant="default" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingState
          size="lg"
          message="Loading games..."
          variant="accent"
          centered
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Game Management
        </h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          View and manage all games on the platform
        </p>
      </div>

      <ArcadeCard>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <ArcadeInput
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--muted-foreground)]" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as GameStatus | "all")
                }
                className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="generating">Generating</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="hidden">Hidden</option>
              </select>
              <select
                value={isSubmittedFilter.toString()}
                onChange={(e) =>
                  setIsSubmittedFilter(
                    e.target.value === "all" ? "all" : e.target.value === "true"
                  )
                }
                className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
              >
                <option value="all">All Submission</option>
                <option value="true">Submitted</option>
                <option value="false">Not Submitted</option>
              </select>
              <select
                value={isHiddenFilter.toString()}
                onChange={(e) =>
                  setIsHiddenFilter(
                    e.target.value === "all" ? "all" : e.target.value === "true"
                  )
                }
                className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm"
              >
                <option value="all">All Visibility</option>
                <option value="true">Hidden</option>
                <option value="false">Visible</option>
              </select>
            </div>
          </div>
        </div>
      </ArcadeCard>

      <ArcadeCard>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                    Game
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                    Author
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                    Theme
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--muted-foreground)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.length === 0 ? (
                  <tr>
                    <EmptyState
                      variant="table"
                      colSpan={7}
                      message="No games found"
                    />
                  </tr>
                ) : (
                  filteredGames.map((game) => (
                    <tr
                      key={game.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {game.name || "Untitled"}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate max-w-[200px]">
                          {game.prompt?.content?.slice(0, 50)}...
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {game.prompt?.user ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={game.prompt.user} size="xs" />
                            <div>
                              <div className="text-sm">
                                {game.prompt.user.name || "Unknown"}
                              </div>
                              <div className="text-xs text-[var(--muted-foreground)]">
                                {game.prompt.user.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">
                            Unknown
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {game.theme ? (
                          <span className="text-sm">{game.theme.title}</span>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">
                            No theme
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(game.status)}</td>
                      <td className="px-4 py-3">
                        {game.isSubmitted ? (
                          <ArcadeBadge text="Submitted" variant="neon" />
                        ) : (
                          <ArcadeBadge text="Draft" variant="default" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--muted-foreground)]">
                          {new Date(game.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/game/${game.id}` as Route}
                            target="_blank"
                          >
                            <ArcadeButton variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </ArcadeButton>
                          </Link>
                          {game.isHidden ? (
                            <ArcadeButton
                              variant="outline"
                              size="sm"
                              onClick={() => unhideGameMutation.mutate(game.id)}
                              disabled={unhideGameMutation.isPending}
                            >
                              {unhideGameMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </ArcadeButton>
                          ) : (
                            <ArcadeButton
                              variant="outline"
                              size="sm"
                              onClick={() => setHideDialog({ open: true, game })}
                            >
                              <EyeOff className="h-4 w-4" />
                            </ArcadeButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border)]">
            <ArcadeButton
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </ArcadeButton>
            <span className="text-sm text-[var(--muted-foreground)]">
              Page {page}
            </span>
            <ArcadeButton
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={!games || games.length < pageSize}
            >
              Next
            </ArcadeButton>
          </div>
        </div>
      </ArcadeCard>

      <Dialog
        open={hideDialog.open}
        onOpenChange={(open) =>
          !open && setHideDialog({ open: false, game: null })
        }
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Hide Game</DialogTitle>
            <DialogDescription>
              Hide &quot;{hideDialog.game?.name || "Untitled"}&quot; from the
              platform
            </DialogDescription>
          </DialogHeader>
          <HideGameForm />
          <DialogFooter>
            <ArcadeButton
              variant="outline"
              onClick={() => setHideDialog({ open: false, game: null })}
            >
              Cancel
            </ArcadeButton>
            <ArcadeButton
              variant="primary"
              onClick={() => {}}
              disabled={hideGameMutation.isPending}
            >
              {hideGameMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Hiding...
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Game
                </>
              )}
            </ArcadeButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
