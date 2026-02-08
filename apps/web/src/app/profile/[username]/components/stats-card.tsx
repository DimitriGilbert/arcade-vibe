import { Gamepad2, Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import LoadingPlaceholder from "@/components/reusable/loading-placeholder";

interface StatsCardProps {
  gamesCreated: number;
  totalRatings: number;
  reputation: number;
  isLoading: boolean;
}

export function StatsCard({
  gamesCreated,
  totalRatings,
  reputation,
  isLoading,
}: StatsCardProps) {
  const stats = [
    {
      label: "Games Created",
      value: gamesCreated,
      icon: Gamepad2,
      tone: "primary",
    },
    {
      label: "Ratings Given",
      value: totalRatings,
      icon: Star,
      tone: "accent",
    },
    {
      label: "Reputation",
      value: reputation,
      icon: TrendingUp,
      tone: "secondary",
    },
  ] as const;

  const toneClasses = {
    primary: "bg-[var(--primary)]/15 text-[var(--primary)]",
    accent: "bg-[var(--accent)]/15 text-[var(--accent)]",
    secondary: "bg-[var(--secondary)]/15 text-[var(--secondary)]",
  } as const;

  if (isLoading) {
    return (
      <Card className="bg-[var(--card)]/60 backdrop-blur-sm border-[var(--border)]">
        <CardContent className="p-6">
          <LoadingPlaceholder />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--card)]/60 backdrop-blur-sm border-[var(--border)]">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 p-4 rounded-lg bg-[var(--muted)]/40"
            >
              <div className={`p-3 rounded-lg ${toneClasses[stat.tone]}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
