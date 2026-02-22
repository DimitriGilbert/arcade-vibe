"use client";

import { useRouter } from "next/navigation";
import { Trophy, Zap, Gamepad2, Star, Crown, Medal, Target } from "lucide-react";
import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import type { GameWithRanking, Rating, UserProfile } from "@/lib/trpc-types";
import type { ProfileStats } from "@/lib/profile-data";

interface ArcadeProfileClientProps {
  user: UserProfile;
  gamesWithRankings: GameWithRanking[];
  ratings: Rating[];
  stats: ProfileStats | null;
  isOwnProfile: boolean;
}

function ProfileHero({ user, stats, isOwnProfile }: {
  user: UserProfile;
  stats: ProfileStats | null;
  isOwnProfile: boolean;
}) {
  return (
    <div className="relative mb-12">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/10 via-transparent to-transparent rounded-3xl" />

      <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 p-8">
        <div className="relative">
          <div className="absolute -inset-2 bg-[var(--primary)]/20 rounded-full blur-xl" />
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? "User"}
              className="relative w-28 h-28 rounded-full border-4 border-[var(--primary)] shadow-2xl object-cover"
            />
          ) : (
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[var(--primary-foreground)] text-4xl font-bold shadow-2xl">
              {(user.name ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
          {stats && stats.reputation >= 100 && (
            <div className="absolute -bottom-1 -right-1 bg-[var(--accent)] rounded-full p-2 shadow-lg">
              <Crown className="w-5 h-5 text-[var(--accent-foreground)]" />
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--foreground)] to-[var(--muted-foreground)] bg-clip-text text-transparent">
              {user.name}
            </h1>
            <div className="flex justify-center md:justify-start gap-2">
              <ArcadeBadge text={`Est. ${new Date(user.createdAt).getFullYear()}`} variant="default" />
              {stats && stats.reputation >= 50 && (
                <ArcadeBadge text="Veteran" variant="neon" icon={<Medal className="w-3 h-3" />} />
              )}
              {isOwnProfile && stats && (
                <ArcadeBadge text={`${stats.credits} credits`} variant="neon" />
              )}
            </div>
          </div>

          {stats && (
            <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--primary)]">{stats.gamesCreated}</div>
                <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Games</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--accent)]">{stats.reputation}</div>
                <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Rep</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--secondary)]">{stats.totalRatings}</div>
                <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Ratings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--foreground)]">{stats.promptRuns}</div>
                <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Runs</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GameCabinet({ game }: { game: GameWithRanking }) {
  const router = useRouter();

  return (
    <ArcadeCard
      className="group cursor-pointer hover:scale-[1.02] transition-transform"
      onClick={() => router.push(`/game/${game.id}`)}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[var(--muted)] to-[var(--card)] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[var(--primary)]/5" />
        <Gamepad2 className="w-16 h-16 text-[var(--primary)]/30 group-hover:text-[var(--primary)]/50 transition-colors" />

        {game.ranking && game.ranking <= 3 && (
          <div className="absolute top-3 left-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
              game.ranking === 1 ? 'bg-yellow-500 text-yellow-950' :
              game.ranking === 2 ? 'bg-slate-300 text-slate-800' :
              'bg-amber-600 text-amber-950'
            }`}>
              {game.ranking}
            </div>
          </div>
        )}

        {game.tierCost?.slug && (
          <div className="absolute top-3 right-3">
            <ArcadeBadge text={game.tierCost.slug} variant="neon" />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg truncate group-hover:text-[var(--primary)] transition-colors">
          {game.name || game.theme?.title || "Untitled"}
        </h3>
        <div className="flex items-center gap-2 mt-2 text-xs text-[var(--muted-foreground)]">
          {game.modelName && <span className="truncate">{game.modelName}</span>}
          {game.ranking && game.ranking > 3 && (
            <ArcadeBadge text={`#${game.ranking}`} variant="default" />
          )}
        </div>
      </div>
    </ArcadeCard>
  );
}

function TrophyCase({ games }: { games: GameWithRanking[] }) {
  const rankedGames = games.filter(g => g.ranking !== null).sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));

  if (rankedGames.length === 0) {
    return (
      <ArcadeCard className="p-8 text-center">
        <Trophy className="w-12 h-12 mx-auto text-[var(--muted-foreground)]/30 mb-3" />
        <p className="text-[var(--muted-foreground)]">No ranked games yet</p>
        <p className="text-xs text-[var(--muted-foreground)]/60 mt-1">Submit games to compete on the leaderboard!</p>
      </ArcadeCard>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {rankedGames.slice(0, 8).map(game => (
        <GameCabinet key={game.id} game={game} />
      ))}
    </div>
  );
}

function QuickStats({ stats, games, ratings }: {
  stats: ProfileStats;
  games: GameWithRanking[];
  ratings: Rating[];
}) {
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.overall, 0) / ratings.length).toFixed(1)
    : null;

  const topRank = games.filter(g => g.ranking !== null).reduce(
    (best, g) => g.ranking && (!best || g.ranking < best) ? g.ranking : best,
    null as number | null
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <ArcadeCard className="p-4 text-center">
        <Target className="w-8 h-8 mx-auto text-[var(--primary)] mb-2" />
        <div className="text-2xl font-bold">{topRank ? `#${topRank}` : '-'}</div>
        <div className="text-xs text-[var(--muted-foreground)]">Best Rank</div>
      </ArcadeCard>
      <ArcadeCard className="p-4 text-center">
        <Star className="w-8 h-8 mx-auto text-[var(--accent)] mb-2" />
        <div className="text-2xl font-bold">{avgRating || '-'}</div>
        <div className="text-xs text-[var(--muted-foreground)]">Avg Rating Given</div>
      </ArcadeCard>
      <ArcadeCard className="p-4 text-center">
        <Gamepad2 className="w-8 h-8 mx-auto text-[var(--secondary)] mb-2" />
        <div className="text-2xl font-bold">{stats.gamesCreated}</div>
        <div className="text-xs text-[var(--muted-foreground)]">Games Created</div>
      </ArcadeCard>
      <ArcadeCard className="p-4 text-center">
        <Zap className="w-8 h-8 mx-auto text-[var(--primary)] mb-2" />
        <div className="text-2xl font-bold">{stats.promptRuns}</div>
        <div className="text-xs text-[var(--muted-foreground)]">Prompt Runs</div>
      </ArcadeCard>
    </div>
  );
}

function AllGamesGrid({ games }: { games: GameWithRanking[] }) {
  if (games.length === 0) {
    return (
      <ArcadeCard className="p-8 text-center">
        <Gamepad2 className="w-12 h-12 mx-auto text-[var(--muted-foreground)]/30 mb-3" />
        <p className="text-[var(--muted-foreground)]">No games yet</p>
      </ArcadeCard>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map(game => (
        <GameCabinet key={game.id} game={game} />
      ))}
    </div>
  );
}

export default function ArcadeProfileClient({
  user,
  gamesWithRankings,
  ratings,
  stats,
  isOwnProfile,
}: ArcadeProfileClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <ProfileHero user={user} stats={stats} isOwnProfile={isOwnProfile} />

        {stats && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--primary)]" />
              Quick Stats
            </h2>
            <QuickStats stats={stats} games={gamesWithRankings} ratings={ratings} />
          </section>
        )}

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--accent)]" />
            Trophy Case
            <ArcadeBadge text={`${gamesWithRankings.filter(g => g.ranking).length} ranked`} variant="default" />
          </h2>
          <TrophyCase games={gamesWithRankings} />
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[var(--primary)]" />
            All Games
            <ArcadeBadge text={String(gamesWithRankings.length)} variant="default" />
          </h2>
          <AllGamesGrid games={gamesWithRankings} />
        </section>
      </div>
    </div>
  );
}
