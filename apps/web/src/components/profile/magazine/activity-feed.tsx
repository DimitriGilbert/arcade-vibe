"use client";

import { Clock, Star, Zap } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";
import type { Prompt, Rating } from "@/lib/trpc-types";

export interface ActivityFeedProps {
  ratings: Rating[];
  prompts: Prompt[];
}

interface ActivityItem {
  type: 'rating' | 'prompt';
  date: Date;
  data: Rating | Prompt;
}

export function ActivityFeed({ ratings, prompts }: ActivityFeedProps) {
  const recentActivity: ActivityItem[] = [
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
          recentActivity.map((activity, idx) => {
            const game = activity.type === 'rating' ? (activity.data as Rating).game : null;
            const prompt = activity.type === 'prompt' ? (activity.data as Prompt) : null;
            
            return (
              <div key={`${activity.type}-${idx}`} className="p-4 flex items-center gap-4 hover:bg-[var(--muted)]/20 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === 'rating' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--primary)]/20 text-[var(--primary)]'
                }`}>
                  {activity.type === 'rating' ? <Star className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {activity.type === 'rating'
                      ? `Rated "${game?.name ?? 'a game'}" ${(activity.data as Rating).overall}/5`
                      : `Created prompt v${prompt?.version}`
                    }
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {activity.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </ArcadeCard>
    </section>
  );
}
