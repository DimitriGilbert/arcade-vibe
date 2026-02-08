"use client";

import { authClient } from "@/lib/auth-client";
import { ArcadeCard } from "@/components/arcade";

export default function Dashboard({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  return (
    <ArcadeCard>
      <div className="p-6">
        <p className="text-[var(--card-foreground)]">
          Dashboard: User {session.user?.name}
        </p>
      </div>
    </ArcadeCard>
  );
}
