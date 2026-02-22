import { Calendar, Shield } from "lucide-react";
import { ArcadeCard } from "@/components/arcade";

interface AccountInfoCardProps {
  /** User's unique identifier */
  userId: string | undefined;
  /** Account creation timestamp */
  createdAt: Date | string | null | undefined;
}

/**
 * Account information card - Server Component
 * Displays user ID and account creation date
 */
export function AccountInfoCard({ userId, createdAt }: AccountInfoCardProps) {
  const createdDate = createdAt ? new Date(createdAt) : null;

  return (
    <ArcadeCard>
      <div className="p-4 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--foreground)]">
          Account Information
        </h3>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {/* User ID */}
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-[var(--muted-foreground)] mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                User ID
              </p>
              <p className="font-mono text-sm mt-1 bg-[var(--muted)] px-2 py-1 rounded">
                {userId}
              </p>
            </div>
          </div>

          {/* Account Creation Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-[var(--muted-foreground)] mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                Account Created
              </p>
              <p className="text-sm mt-1">
                {createdDate ? (
                  <span>
                    {createdDate.toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-[var(--muted-foreground)]">
                    Unknown
                  </span>
                )}
              </p>
              {createdDate && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  {createdDate.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ArcadeCard>
  );
}
