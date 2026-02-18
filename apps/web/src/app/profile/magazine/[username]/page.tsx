"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Trophy, Zap, Gamepad2, Star, Play, Crown, Medal, TrendingUp, Calendar, Clock } from "lucide-react";
import { ArcadeCard, ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { useProfileData } from "@/hooks/use-profile-data";
import LoadingPlaceholder from "@/components/reusable/loading-placeholder";
import { useRouter } from "next/navigation";
import type { GameWithRanking, Rating, Prompt } from "@/lib/trpc-types";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

function MagazineHeader({ user, stats, isOwnProfile }: { 
  user: NonNullable<ReturnType<typeof useProfileData>['user']>; 
  stats: ReturnType<typeof useProfileData>['stats'];
  isOwnProfile: boolean;
}) {
  return (
    <header className="mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-end gap-6 mb-6">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name ?? "User"}
                className="w-32 h-32 rounded-lg border-2 border-[var(--border)] shadow-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[var(--primary-foreground)] text-5xl font-bold shadow-lg">
                {(user.name ?? "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 pb-2">
              <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Prompt Engineer</p>
              <h1 className="text-5xl font-bold tracking-tight">{user.name}</h1>
              <p className="text-[var(--muted-foreground)] mt-1">Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
              {isOwnProfile 
                ? "This is your profile. Your games, prompts, and achievements are showcased here for the community to see."
                : `Explore ${user.name}'s contributions to Arcade Vibe - games created, prompts crafted, and the impact on the community.`
              }
            </p>
          </div>
        </div>

        <aside className="space-y-4">
          <ArcadeCard className="p-6">
            <h3 className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] mb-4">Reputation Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-[var(--primary)]">{stats?.reputation ?? 0}</span>
              <span className="text-sm text-[var(--muted-foreground)]">pts</span>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-[var(--muted-foreground)]">
              <TrendingUp className="w-4 h-4" />
              <span>Based on community engagement</span>
            </div>
          </ArcadeCard>
          
          {isOwnProfile && stats && (
            <ArcadeCard className="p-6 bg-gradient-to-br from-[var(--primary)]/10 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Credits</p>
                  <p className="text-2xl font-bold text-[var(--primary)]">{stats.credits}</p>
                </div>
                <Zap className="w-8 h-8 text-[var(--primary)]" />
              </div>
            </ArcadeCard>
          )}
        </aside>
      </div>
    </header>
  );
}

function StatBlock({ label, value, icon: Icon, trend }: { 
  label: string; 
  value: string | number; 
  icon?: React.ComponentType<{ className?: string }>;
  trend?: string;
}) {
  return (
    <div className="text-center p-4">
      {Icon && <Icon className="w-5 h-5 mx-auto text-[var(--primary)] mb-2" />}
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">{label}</div>
      {trend && <div className="text-xs text-[var(--accent)] mt-1">{trend}</div>}
    </div>
  );
}

function FeaturedGameCard({ game, featured = false }: { game: GameWithRanking; featured?: boolean }) {
  const router = useRouter();
  
  const handleClick = () => router.push(`/game/${game.id}`);
  
  return (
    <div 
      className={`group cursor-pointer ${featured ? 'col-span-2 row-span-2' : ''}`}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleClick(); }}}
      tabIndex={0}
      role="button"
      aria-label={`View game: ${game.name || 'Untitled'}`}
    >
      <ArcadeCard className={`h-full ${featured ? 'flex flex-col' : ''}`}>
        <div className={`relative bg-gradient-to-br from-[var(--muted)] to-[var(--card)] flex items-center justify-center overflow-hidden ${featured ? 'aspect-video' : 'aspect-square'}`}>
          <Gamepad2 className={`${featured ? 'w-24 h-24' : 'w-12 h-12'} text-[var(--primary)]/20 group-hover:text-[var(--primary)]/40 transition-colors`} />
          
          {game.ranking && game.ranking <= 3 && (
            <div className="absolute top-4 left-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold ${
                game.ranking === 1 ? 'bg-yellow-500 text-yellow-950' :
                game.ranking === 2 ? 'bg-slate-300 text-slate-800' :
                'bg-amber-600 text-amber-950'
              }`}>
                <Trophy className="w-4 h-4" />
                #{game.ranking}
              </div>
            </div>
          )}
          
          {game.tierCost?.slug && (
            <div className="absolute top-4 right-4">
              <ArcadeBadge text={game.tierCost.slug} variant="neon" />
            </div>
          )}
        </div>
        
        <div className={`p-4 ${featured ? 'flex-1' : ''}`}>
          <h3 className={`font-bold ${featured ? 'text-xl' : 'text-sm'} truncate group-hover:text-[var(--primary)] transition-colors`}>
            {game.name || game.theme?.title || "Untitled Game"}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
            {game.modelName && <span>{game.modelName}</span>}
            <span>{new Date(game.createdAt).toLocaleDateString()}</span>
          </div>
          {featured && game.theme?.title && (
            <p className="text-sm text-[var(--muted-foreground)] mt-3">
              Part of the <span className="text-[var(--primary)]">{game.theme.title}</span> theme
            </p>
          )}
        </div>
      </ArcadeCard>
    </div>
  );
}

function GamesSection({ games, isLoading }: { games: GameWithRanking[]; isLoading: boolean }) {
  if (isLoading) {
    return <LoadingPlaceholder />;
  }
  
  if (games.length === 0) {
    return (
      <ArcadeCard className="p-12 text-center col-span-full">
        <Gamepad2 className="w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Games Yet</h3>
        <p className="text-[var(--muted-foreground)]">Games will appear here once created.</p>
      </ArcadeCard>
    );
  }
  
  const rankedGames = games.filter(g => g.ranking !== null).sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));
  const otherGames = games.filter(g => g.ranking === null);
  
  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Gamepad2 className="w-6 h-6 text-[var(--primary)]" />
          Game Collection
        </h2>
        <ArcadeBadge text={`${games.length} total`} variant="default" />
      </div>
      
      {rankedGames.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm uppercase tracking-widest text-[var(--muted-foreground)] mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Ranked Entries
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rankedGames.slice(0, 5).map((game, idx) => (
              <FeaturedGameCard key={game.id} game={game} featured={idx === 0 && game.ranking === 1} />
            ))}
          </div>
        </div>
      )}
      
      {otherGames.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-widest text-[var(--muted-foreground)] mb-4">Other Games</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {otherGames.slice(0, 6).map(game => (
              <FeaturedGameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ActivityFeed({ ratings, prompts }: { ratings: Rating[]; prompts: Prompt[] }) {
  const recentActivity = [
    ...ratings.slice(0, 5).map(r => ({ 
      type: 'rating' as const, 
      date: new Date(r.createdAt), 
      data: r 
    })),
    ...prompts.slice(0, 5).map(p => ({ 
      type: 'prompt' as const, 
      date: new Date(p.createdAt), 
      data: p 
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Clock className="w-6 h-6 text-[var(--primary)]" />
        Recent Activity
      </h2>
      
      <ArcadeCard className="divide-y divide-[var(--border)]">
        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">
            No recent activity
          </div>
        ) : (
          recentActivity.map((activity, idx) => (
            <div key={`${activity.type}-${idx}`} className="p-4 flex items-center gap-4 hover:bg-[var(--muted)]/20 transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activity.type === 'rating' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--primary)]/20 text-[var(--primary)]'
              }`}>
                {activity.type === 'rating' ? <Star className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {activity.type === 'rating' 
                    ? `Rated "${activity.data.game?.name || 'a game'}" ${activity.data.overall}/5`
                    : `Created prompt v${activity.data.version}`
                  }
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {activity.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </ArcadeCard>
    </section>
  );
}

export default function MagazineLayoutProfile({ params }: ProfilePageProps) {
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
      <div className="container mx-auto py-12 px-4">
        <MagazineHeader user={user} stats={stats} isOwnProfile={isOwnProfile} />
        
        {stats && (
          <div className="mb-16">
            <div className="grid grid-cols-4 divide-x divide-[var(--border)] border border-[var(--border)] rounded-lg bg-[var(--card)]">
              <StatBlock label="Games" value={stats.gamesCreated} icon={Gamepad2} />
              <StatBlock label="Ratings" value={stats.totalRatings} icon={Star} />
              <StatBlock label="Prompts" value={stats.promptsCount} icon={Zap} />
              <StatBlock label="Runs" value={stats.promptRuns} icon={Play} />
            </div>
          </div>
        )}

        <GamesSection games={userGamesWithRankings} isLoading={gamesLoading} />
        
        <ActivityFeed ratings={ratings ?? []} prompts={prompts ?? []} />
      </div>
    </div>
  );
}
