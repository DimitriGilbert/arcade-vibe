import { Clock } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";

interface AccountAgeCardProps {
  /** Number of days since account creation */
  accountAge: number;
}

/**
 * Account age display card - Server Component
 * Shows how many days since the user joined
 */
export function AccountAgeCard({ accountAge }: AccountAgeCardProps) {
  return (
    <ArcadeCard>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-[var(--secondary)]/20 rounded-lg">
            <Clock className="h-4 w-4 text-[var(--secondary)]" />
          </div>
          <span className="font-medium">Account Age</span>
        </div>
        <p className="text-3xl font-bold text-[var(--secondary)]">
          {accountAge}
        </p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Days since joining
        </p>
      </div>
    </ArcadeCard>
  );
}
