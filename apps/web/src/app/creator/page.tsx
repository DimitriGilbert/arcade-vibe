import type { Route } from "next";

import { auth } from "@arcade-vibe/auth";
import { db } from "@arcade-vibe/db";
import {
  DEFAULT_CREATOR_IMPLEMENTATION_PREFERENCE,
  userPreferences,
} from "@arcade-vibe/db/schema/user-preferences";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArcadeCard } from "@/components/arcade/arcade-card";
import { ArcadeButton } from "@/components/arcade/arcade-button";
import { ArcadeBadge } from "@/components/arcade/arcade-badge";
import { Layers, Inbox, FolderTree, Info, type LucideIcon } from "lucide-react";
import { CreatorFeedbackButton } from "@/components/feedback/CreatorFeedbackButton";

interface EditorInfo {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href: Route;
  badge: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const EDITORS: EditorInfo[] = [
  {
    id: "inbox",
    name: "Inbox",
    description:
      "Quick-fire workflow. Draft prompts fast, queue up generations, and cycle through your ideas without the clutter.",
    icon: Inbox,
    href: "/creator/inbox" as Route,
    badge: "Fast & Clean",
    color: "text-lime-400",
    bgColor: "bg-lime-400/10",
    borderColor: "hover:border-lime-400/50",
  },
  {
    id: "filebrowser",
    name: "File Browser",
    description:
      "VS Code vibes. Navigate your prompts and runs in a familiar tree structure. Great for power users.",
    icon: FolderTree,
    href: "/creator/filebrowser" as Route,
    badge: "Power User",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "hover:border-orange-400/50",
  },
  {
    id: "workbench",
    name: "Workbench",
    description:
      "Full-powered editor with split panels. Pick models, tweak settings, and watch games come to life side-by-side.",
    icon: Layers,
    href: "/creator/workbench" as Route,
    badge: "Full Featured",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    borderColor: "hover:border-cyan-400/50",
  },
];

export default async function CreatorPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user.id) {
    const preferences = await db.query.userPreferences.findFirst({
      where: and(
        eq(userPreferences.userId, session.user.id),
        eq(userPreferences.name, DEFAULT_CREATOR_IMPLEMENTATION_PREFERENCE),
      ),
      columns: {
        value: true,
      },
    });

    if (preferences?.value) {
      redirect(`/creator/${preferences.value}` as Route);
    }
  }

  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--muted)] text-xs font-medium text-[var(--muted-foreground)] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            CHOOSE YOUR EDITOR
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-5 bg-gradient-to-r from-cyan-400 via-lime-400 to-orange-400 bg-clip-text text-transparent">
            CREATOR
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-xl mx-auto leading-relaxed">
            Three ways to create games. Pick the one that matches your workflow—we're curious which wins your heart.
          </p>
        </div>

        <div className="mb-10 opacity-0 animate-fade-in-up animate-delay-200" style={{ animationFillMode: "forwards" }}>
          <ArcadeCard 
            variant="default" 
            className="border-[var(--primary)]/30 bg-[var(--primary)]/5"
            icon={<Info className="h-5 w-5" />}
            title="Same Power, Different Vibes"
          >
            <p className="text-sm text-[var(--foreground)] leading-relaxed">
              All three editors have <strong>identical functionality</strong>—they're just different interfaces for the same tools. 
              Whether you draft a prompt in Inbox, organize in File Browser, or use the full Workbench, you get the same results. 
              Pick what feels right for you, and switch anytime.
            </p>
          </ArcadeCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 opacity-0 animate-fade-in-up animate-delay-500" style={{ animationFillMode: "forwards" }}>
          {EDITORS.map((editor) => {
            const Icon = editor.icon;
            return (
              <Link key={editor.id} href={editor.href}>
                <ArcadeCard
                  variant="default"
                  className={`group h-full cursor-pointer ${editor.borderColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-5">
                      <div className={`p-3 rounded-xl ${editor.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className={`h-6 w-6 ${editor.color}`} />
                      </div>
                      <ArcadeBadge text={editor.badge} variant="default" />
                    </div>

                    <h2 className="text-xl font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">
                      {editor.name}
                    </h2>

                    <p className="text-sm text-[var(--muted-foreground)] flex-1 mb-5 leading-relaxed">
                      {editor.description}
                    </p>

                    <ArcadeButton variant="outline" className="w-full group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] group-hover:border-[var(--primary)] transition-all">
                      Try {editor.name}
                    </ArcadeButton>
                  </div>
                </ArcadeCard>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <CreatorFeedbackButton />
        </div>
      </div>
    </main>
  );
}
