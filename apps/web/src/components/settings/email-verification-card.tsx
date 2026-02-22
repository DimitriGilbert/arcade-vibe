import { AlertCircle, CheckCircle, Mail } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";

interface EmailVerificationCardProps {
  /** Whether the user's email has been verified */
  emailVerified: boolean | null | undefined;
}

/**
 * Email verification status card - Server Component
 * Shows whether the user's email has been verified
 */
export function EmailVerificationCard({ emailVerified }: EmailVerificationCardProps) {
  return (
    <ArcadeCard>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-[var(--primary)]/20 rounded-lg">
            <Mail className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <span className="font-medium">Email Verified</span>
        </div>
        <div className="flex items-center gap-2">
          {emailVerified ? (
            <>
              <CheckCircle className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-[var(--accent)] font-medium text-sm">
                Verified
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-[var(--muted-foreground)]" />
              <span className="text-[var(--muted-foreground)] font-medium text-sm">
                Not Verified
              </span>
            </>
          )}
        </div>
      </div>
    </ArcadeCard>
  );
}
