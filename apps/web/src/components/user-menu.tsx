"use client";

import { useRouter } from "next/navigation";
import { Settings, User, LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)]">
        ...
      </div>
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-[calc(var(--radius)-4px)] bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
      >
        Sign In
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-[calc(var(--radius)-4px)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
        aria-label="User menu"
      >
        <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-xs font-medium">
          {session.user.name?.[0] ?? "U"}
        </div>
        <span className="hidden sm:inline">{session.user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[var(--card)] border-[var(--border)]"
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push(`/profile/${session.user.name}`)}
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/");
                  },
                },
              });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
