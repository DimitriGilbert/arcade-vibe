import type { Metadata } from "next";
import type { Route } from "next";

import { auth } from "@arcade-vibe/auth";
import { db } from "@arcade-vibe/db";
import { userPreferences } from "@arcade-vibe/db/schema/user-preferences";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Swords, BarChart3, BookOpen } from "lucide-react";

import { ArcadeCard, ArcadeButton, ArcadeBadge } from "@/components/arcade";
import { LeaderboardFeedback } from "@/components/feedback";

export const metadata: Metadata = {
  title: "Leaderboard - Arcade Vibe",
  description: "Explore the leaderboard. Check out games in Arena, Dashboard, or Magazine view.",
};

const LEADERBOARD_VIEWS = [
  {
    id: "arena",
    title: "Arena",
    description: "Head-to-head competitive view. See who's winning in real-time battles.",
    icon: Swords,
    badge: "Competitive",
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    borderColor: "hover:border-rose-400/50",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Stats-focused view with charts, metrics, and detailed analytics.",
    icon: BarChart3,
    badge: "Analytics",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "hover:border-amber-400/50",
  },
  {
    id: "magazine",
    title: "Magazine",
    description: "Curated editorial style. Featured content and spotlight stories.",
    icon: BookOpen,
    badge: "Curated",
    color: "text-fuchsia-400",
    bgColor: "bg-fuchsia-400/10",
    borderColor: "hover:border-fuchsia-400/50",
  },
] as const;

export default async function LeaderboardLandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.id) {
    const preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, session.user.id),
      columns: {
        defaultLeaderboardImplementation: true,
      },
    });

    if (preferences?.defaultLeaderboardImplementation) {
      redirect(
        `/leaderboard/${preferences.defaultLeaderboardImplementation}` as Route,
      );
    }
  }

  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--muted)] text-xs font-medium text-[var(--muted-foreground)] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400"></span>
            </span>
            CHOOSE YOUR VIEW
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-5 bg-gradient-to-r from-rose-400 via-amber-400 to-fuchsia-400 bg-clip-text text-transparent">
            LEADERBOARD
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-xl mx-auto leading-relaxed">
            Three ways to see who's on top. Pick your favorite—we're tracking which views get the most love.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {LEADERBOARD_VIEWS.map((view) => {
            const IconComponent = view.icon;
            return (
              <Link key={view.id} href={`/leaderboard/${view.id}` as Route}>
                <ArcadeCard
                  variant="default"
                  className={`group h-full cursor-pointer ${view.borderColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-5">
                      <div className={`p-3 rounded-xl ${view.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                        <IconComponent className={`h-6 w-6 ${view.color}`} />
                      </div>
                      <ArcadeBadge text={view.badge} variant="default" />
                    </div>

                    <h2 className="text-xl font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">
                      {view.title}
                    </h2>

                    <p className="text-sm text-[var(--muted-foreground)] flex-1 mb-5 leading-relaxed">
                      {view.description}
                    </p>

                    <ArcadeButton variant="outline" className="w-full group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] group-hover:border-[var(--primary)] transition-all">
                      Open {view.title}
                    </ArcadeButton>
                  </div>
                </ArcadeCard>
              </Link>
            );
          })}
        </div>

        <LeaderboardFeedback />
      </div>
    </main>
  );
}
