import { ArcadeButton, ArcadeBadge } from "@/components/arcade";
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
        <h1 className="text-2xl font-bold truncate max-w-md text-[var(--foreground)]">
          {promptContent.slice(0, 50)}...
        </h1>
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {playtimeDisplay}
          </span>
          {themeTitle && <ArcadeBadge text={themeTitle} variant="default" />}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <ArcadeButton variant="outline" onClick={onViewPrompt}>
          <Eye className="h-4 w-4" />
          View Prompt
        </ArcadeButton>

        <ArcadeButton variant="outline" onClick={onShare}>
          <Share2 className="h-4 w-4" />
          Share
        </ArcadeButton>

        <ArcadeButton
          variant="outline"
          onClick={onReport}
          className="border-[var(--destructive)]/50 bg-[var(--destructive)]/10 hover:bg-[var(--destructive)]/20 text-[var(--destructive)]"
        >
          <Flag className="h-4 w-4" />
          Report
        </ArcadeButton>

        {canRate && (
          <ArcadeButton variant="primary" onClick={onRate}>
            <Trophy className="h-4 w-4" />
            Rate Game
          </ArcadeButton>
        )}
      </div>
    </div>
  );
}
