import { CheckCircle, Shield } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";

/**
 * Account status display card - Server Component
 * Shows the current account status (active/inactive)
 */
export function AccountStatusCard() {
  return (
    <ArcadeCard>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[var(--accent)]/20 rounded-lg">
            <Shield className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <span className="font-medium">Account Status</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--accent)]/15 text-[var(--accent)]">
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Active
          </span>
        </div>
      </div>
    </ArcadeCard>
  );
}
