import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, Share2, Flag, Trophy } from "lucide-react";

interface GameHeaderProps {
  promptContent: string;
  playtime: number;
  canRate: boolean;
  themeTitle?: string;
  onViewPrompt: () => void;
  onShare: () => void;
  onReport: () => void;
  onRate: () => void;
}

export function GameHeader({
  promptContent,
  playtime,
  canRate,
  themeTitle,
  onViewPrompt,
  onShare,
  onReport,
  onRate,
}: GameHeaderProps) {
  const playtimeDisplay = `${Math.floor(playtime / 60)}:${(playtime % 60).toString().padStart(2, "0")}`;

  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold truncate max-w-md text-foreground">
          {promptContent.slice(0, 50)}...
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {playtimeDisplay}
          </span>
          {themeTitle && <Badge variant="secondary">{themeTitle}</Badge>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onViewPrompt}
          className="inline-flex items-center gap-2 px-3 py-2 border border-border bg-background hover:bg-muted rounded-none text-xs font-medium transition-colors"
        >
          <Eye className="h-4 w-4" />
          View Prompt
        </button>

        <Button variant="outline" size="sm" onClick={onShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>

        <button
          type="button"
          onClick={onReport}
          className="inline-flex items-center gap-2 px-3 py-2 border border-destructive/50 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-none text-xs font-medium transition-colors"
        >
          <Flag className="h-4 w-4" />
          Report
        </button>

        {canRate && (
          <Button size="sm" onClick={onRate} className="gap-2">
            <Trophy className="h-4 w-4" />
            Rate Game
          </Button>
        )}
      </div>
    </div>
  );
}
