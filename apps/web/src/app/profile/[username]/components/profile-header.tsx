import { Badge } from "@/components/ui/badge";
import type { User } from "@/types/entities";

interface ProfileHeaderProps {
  user: User;
  userEmail: string;
  credits: { balance: number } | null;
  isOwnProfile: boolean;
}

export function ProfileHeader({
  user,
  userEmail,
  credits,
  isOwnProfile,
}: ProfileHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start gap-4">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || user.email}
            className="w-20 h-20 rounded-full border-4 border-border shadow-lg"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {user.name || user.email}
          </h1>
          <p className="text-muted-foreground mb-3">{user.email}</p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              Member since {new Date(user.createdAt).getFullYear()}
            </Badge>
            {isOwnProfile && credits && (
              <Badge variant="default" className="bg-primary">
                {credits.balance} credits
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
