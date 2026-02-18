"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Trophy, Zap, Gamepad2, Star, Play, Crown, Medal, Target, TrendingUp, BarChart3, PieChart, Activity } from "lucide-react";
import { ArcadeCard, ArcadeBadge, ArcadeButton, ArcadeStats } from "@/components/arcade";
import { useProfileData } from "@/hooks/use-profile-data";
import LoadingPlaceholder from "@/components/reusable/loading-placeholder";
import { useRouter } from "next/navigation";
import type { GameWithRanking, Rating, Prompt } from "@/lib/trpc-types";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

function PlayerCard({ user, stats, isOwnProfile }: { 
  user: NonNullable<ReturnType<typeof useProfileData>['user']>; 
  stats: ReturnType<typeof useProfileData>['stats'];
  isOwnProfile: boolean;
}) {
  return (
    <ArcadeCard className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full blur opacity-40" />
            {user.image ? (
              <img
                src={user.image}
                alt={user.name ?? "User"}
                className="relative w-16 h-16 rounded-full border-2 border-[var(--card)] object-cover"
              />
            ) : (
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[var(--primary-foreground)] text-2xl font-bold">
                {(user.name ?? "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{user.name}</h1>
              {stats && stats.reputation >= 100 && (
                <Crown className="w-5 h-5 text-[var(--accent)]" />
              )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Est. {new Date(user.createdAt).getFullYear()}
            </p>
          </div>
          
          {isOwnProfile && stats && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30">
              <Zap className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-sm font-bold text-[var(--primary)]">{stats.credits}</span>
            </div>
          )}
        </div>
      </div>
    </ArcadeCard>
  );
}

function MiniStat({ label, value, icon: Icon, highlight }: { 
  label: string; 
  value: string | number; 
  icon?: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${highlight ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/20' : 'bg-[var(--muted)]/30'}`}>
      {Icon && <Icon className={`w-4 h-4 ${highlight ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />}
      <div className="flex-1">
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      </div>
    </div>
  );
}

function GameRow({ game, rank }: { game: GameWithRanking; rank: number }) {
  const router = useRouter();
  
  return (
    <button
      type="button"
      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--muted)]/30 transition-colors text-left group"
      onClick={() => router.push(`/game/${game.id}`)}
    >
      <div className="w-8 text-center">
        {game.ranking && game.ranking <= 3 ? (
          <span className={`font-bold ${
            game.ranking === 1 ? 'text-yellow-500' :
            game.ranking === 2 ? 'text-slate-300' :
            'text-amber-600'
          }`}>
            #{game.ranking}
          </span>
        ) : (
          <span className="text-xs text-[var(--muted-foreground)]">#{rank}</span>
        )}
      </div>
      
      <div className="w-12 h-12 rounded-lg bg-[var(--muted)] flex items-center justify-center">
        <Gamepad2 className="w-6 h-6 text-[var(--primary)]/40 group-hover:text-[var(--primary)] transition-colors" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate group-hover:text-[var(--primary)] transition-colors">
          {game.name || game.theme?.title || "Untitled"}
        </p>
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          {game.modelName && <span className="truncate">{game.modelName}</span>}
          <span>{new Date(game.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {game.tierCost?.slug && (
          <ArcadeBadge text={game.tierCost.slug} variant="default" />
        )}
        <ArcadeBadge text={game.ranking ? `#${game.ranking}` : 'NR'} variant={game.ranking && game.ranking <= 3 ? 'neon' : 'default'} />
      </div>
    </button>
  );
}

function GamesPanel({ games, isLoading }: { games: GameWithRanking[]; isLoading: boolean }) {
  if (isLoading) {
    return <LoadingPlaceholder />;
  }
  
  const rankedGames = games.filter(g => g.ranking !== null).sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));
  const bestRank = rankedGames[0]?.ranking;
  
  return (
    <ArcadeCard className="h-full">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[var(--primary)]" />
            Games
          </h2>
          <ArcadeBadge text={String(games.length)} variant="default" />
        </div>
      </div>
      
      <div className="divide-y divide-[var(--border)] max-h-[400px] overflow-y-auto">
        {games.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">
            <Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No games yet</p>
          </div>
        ) : (
          games.slice(0, 10).map((game, idx) => (
            <GameRow key={game.id} game={game} rank={idx + 1} />
          ))
        )}
      </div>
      
      {games.length > 10 && (
        <div className="p-3 border-t border-[var(--border)] text-center">
          <span className="text-xs text-[var(--muted-foreground)]">+{games.length - 10} more games</span>
        </div>
      )}
    </ArcadeCard>
  );
}

function RatingsPanel({ ratings, isLoading }: { ratings: Rating[]; isLoading: boolean }) {
  if (isLoading) {
    return <LoadingPlaceholder />;
  }
  
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + r.overall, 0) / ratings.length).toFixed(1)
    : null;
  
  return (
    <ArcadeCard className="h-full">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-[var(--accent)]" />
            Ratings Given
          </h2>
          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-[var(--accent)] text-[var(--accent)]" />
              <span className="text-sm font-bold">{avgRating}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="divide-y divide-[var(--border)] max-h-[300px] overflow-y-auto">
        {ratings.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">
            <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No ratings yet</p>
          </div>
        ) : (
          ratings.slice(0, 8).map(rating => (
            <div key={rating.id} className="p-3 flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= rating.overall
                        ? 'fill-[var(--accent)] text-[var(--accent)]'
                        : 'text-[var(--muted-foreground)]/20'
                    }`}
                  />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{rating.game?.name || 'Unknown Game'}</p>
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">
                {new Date(rating.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </ArcadeCard>
  );
}

function PromptsPanel({ prompts, isLoading }: { prompts: Prompt[]; isLoading: boolean }) {
  if (isLoading) {
    return <LoadingPlaceholder />;
  }
  
  return (
    <ArcadeCard className="h-full">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--primary)]" />
            Prompts
          </h2>
          <ArcadeBadge text={String(prompts.length)} variant="default" />
        </div>
      </div>
      
      <div className="divide-y divide-[var(--border)] max-h-[300px] overflow-y-auto">
        {prompts.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">
            <Zap className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No prompts yet</p>
          </div>
        ) : (
          prompts.slice(0, 6).map(prompt => (
            <div key={prompt.id} className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <ArcadeBadge text={`v${prompt.version}`} variant="default" />
                <ArcadeBadge text={prompt.visibility} variant="default" />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                {prompt.content.slice(0, 100)}...
              </p>
              <p className="text-xs text-[var(--muted-foreground)]/60 mt-1">
                {new Date(prompt.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </ArcadeCard>
  );
}

function StatsOverview({ stats, games, ratings }: { 
  stats: NonNullable<ReturnType<typeof useProfileData>['stats']>;
  games: GameWithRanking[];
  ratings: Rating[];
}) {
  const rankedCount = games.filter(g => g.ranking !== null).length;
  const topRank = games.filter(g => g.ranking !== null).reduce(
    (best, g) => g.ranking && (!best || g.ranking < best) ? g.ranking : best, 
    null as number | null
  );
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <MiniStat label="Reputation" value={stats.reputation} icon={TrendingUp} highlight />
      <MiniStat label="Best Rank" value={topRank ? `#${topRank}` : 'NR'} icon={Trophy} highlight={topRank !== null && topRank <= 3} />
      <MiniStat label="Ranked Games" value={rankedCount} icon={Target} />
      <MiniStat label="Total Ratings" value={stats.totalRatings} icon={Star} />
    </div>
  );
}

export default function DashboardLayoutProfile({ params }: ProfilePageProps) {
  const [username, setUsername] = useState<string>("");
  const [isOwnProfile, setIsOwnProfile] = useState<boolean>(false);

  useEffect(() => {
    params.then((resolvedParams) => {
      setUsername(resolvedParams.username);
    });
  }, [params]);

  const {
    user,
    prompts,
    userGamesWithRankings,
    ratings,
    stats,
    userLoading,
    gamesLoading,
    ratingsLoading,
    promptsLoading,
  } = useProfileData(username, isOwnProfile);

  useEffect(() => {
    const checkOwnProfile = async () => {
      if (!user?.id) return;
      try {
        const sessionResponse = await fetch("/api/auth/getSession", { credentials: "include" });
        if (sessionResponse.ok) {
          const session = await sessionResponse.json();
          setIsOwnProfile(session?.user?.id === user.id);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    checkOwnProfile();
  }, [user?.id]);

  if (userLoading || (!user && !userLoading)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <LoadingPlaceholder />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <ArcadeCard className="p-20 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-[var(--destructive)] mb-4 opacity-70" />
            <h3 className="text-xl font-semibold mb-2">User Not Found</h3>
            <p className="text-[var(--muted-foreground)]">The profile could not be found.</p>
          </ArcadeCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <PlayerCard user={user} stats={stats} isOwnProfile={isOwnProfile} />
          </div>
          
          {stats && (
            <div className="lg:col-span-12">
              <StatsOverview stats={stats} games={userGamesWithRankings} ratings={ratings ?? []} />
            </div>
          )}
          
          <div className="lg:col-span-8">
            <GamesPanel games={userGamesWithRankings} isLoading={gamesLoading} />
          </div>
          
          <div className="lg:col-span-4 space-y-6">
            <RatingsPanel ratings={ratings ?? []} isLoading={ratingsLoading} />
            <PromptsPanel prompts={prompts ?? []} isLoading={promptsLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
