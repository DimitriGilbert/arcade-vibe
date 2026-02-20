import type { Metadata } from "next";
import type { Route } from "next";

import Link from "next/link";
import { Swords, BarChart3, BookOpen } from "lucide-react";

import { ArcadeCard, ArcadeButton, ArcadeBadge } from "@/components/arcade";

export const metadata: Metadata = {
  title: "Leaderboard - Arcade Vibe",
  description: "Explore the leaderboard. Check out games in Arena, Dashboard, or Magazine view.",
};

const LEADERBOARD_VIEWS = [
  {
    id: "arena",
    title: "Arena",
    description: "Head-to-head competitive view. See who's winning in real-time.",
    icon: Swords,
    badge: "Competitive",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Stats-focused view with charts, metrics, and detailed analytics.",
    icon: BarChart3,
    badge: "Analytics",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "magazine",
    title: "Magazine",
    description: "Curated editorial style. Featured content and spotlight stories.",
    icon: BookOpen,
    badge: "Curated",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
] as const;

export default function LeaderboardLandingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
            LEADERBOARD
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-xl mx-auto">
            Pick your vibe. See the top games, track your progress, or browse curated highlights.
          </p>
        </div>

        {/* View Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LEADERBOARD_VIEWS.map((view) => {
            const IconComponent = view.icon;
            return (
              <Link key={view.id} href={`/leaderboard/${view.id}` as Route}>
                <ArcadeCard
                  variant="default"
                  className="group h-full cursor-pointer hover:border-[var(--primary)]/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="p-6 flex flex-col h-full">
                    {/* Icon & Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${view.bgColor}`}>
                        <IconComponent className={`h-6 w-6 ${view.color}`} />
                      </div>
                      <ArcadeBadge text={view.badge} variant="default" />
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">
                      {view.title}
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-[var(--muted-foreground)] flex-1 mb-4">
                      {view.description}
                    </p>

                    {/* CTA */}
                    <ArcadeButton variant="outline" className="w-full group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] group-hover:border-[var(--primary)] transition-all">
                      Open {view.title}
                    </ArcadeButton>
                  </div>
                </ArcadeCard>
              </Link>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Just want to play? Jump straight into the action.
          </p>
          <Link href="/login">
            <ArcadeButton variant="primary">
              Start Creating
            </ArcadeButton>
          </Link>
        </div>
      </div>
    </main>
  );
}
