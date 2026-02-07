import { Gamepad2, Star, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

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
      color: "from-purple-500 to-pink-500",
    },
    {
      label: "Ratings Given",
      value: totalRatings,
      icon: Star,
      color: "from-yellow-500 to-orange-500",
    },
    {
      label: "Reputation",
      value: reputation,
      icon: TrendingUp,
      color: "from-green-500 to-teal-500",
    },
  ];

  if (isLoading) {
    return (
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 p-4 rounded-lg bg-white/50 dark:bg-gray-700/50"
            >
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}
              >
                <stat.icon className="h-6 w-6 text-white" />
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
