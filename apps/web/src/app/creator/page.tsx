"use client";

import type { Route } from "next";
import Link from "next/link";
import { ArcadeCard } from "@/components/arcade/arcade-card";
import { ArcadeButton } from "@/components/arcade/arcade-button";
import { ArcadeBadge } from "@/components/arcade/arcade-badge";
import { FeedbackButton } from "@/components/feedback";
import { Layers, Inbox, FolderTree, type LucideIcon } from "lucide-react";
import {
  creatorPageFeedbackSchema,
  creatorPageFeedbackFields,
} from "@/lib/feedback-schemas";

interface EditorInfo {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href: Route;
  badge: string;
  badgeVariant: "neon" | "default" | "pixel";
}

const EDITORS: EditorInfo[] = [
  {
    id: "workbench",
    name: "Workbench",
    description:
      "Full-powered editor with split panels. Pick models, tweak settings, and watch games come to life side-by-side.",
    icon: Layers,
    href: "/creator/workbench" as Route,
    badge: "Full Featured",
    badgeVariant: "neon",
  },
  {
    id: "inbox",
    name: "Inbox",
    description:
      "Quick-fire workflow. Draft prompts fast, queue up generations, and cycle through your ideas without the clutter.",
    icon: Inbox,
    href: "/creator/inbox" as Route,
    badge: "Fast & Clean",
    badgeVariant: "default",
  },
  {
    id: "filebrowser",
    name: "File Browser",
    description:
      "VS Code vibes. Navigate your prompts and runs in a familiar tree structure. Great for power users.",
    icon: FolderTree,
    href: "/creator/filebrowser" as Route,
    badge: "Power User",
    badgeVariant: "pixel",
  },
];

export default function CreatorPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Choose Your Editor
          </h1>
          <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
            Three ways to create games. Pick the one that matches your workflow.
          </p>
        </div>

        {/* Editor Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {EDITORS.map((editor) => {
            const Icon = editor.icon;
            return (
              <ArcadeCard
                key={editor.id}
                variant="default"
                className="flex flex-col h-full hover:border-[var(--primary)] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArcadeBadge text={editor.badge} variant={editor.badgeVariant} />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  {editor.name}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] flex-1 mb-4">
                  {editor.description}
                </p>
                <Link href={editor.href}>
                  <ArcadeButton variant="primary" size="sm" className="w-full">
                    Try {editor.name}
                  </ArcadeButton>
                </Link>
              </ArcadeCard>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            All editors connect to the same prompts and games. Switch anytime.
          </p>
          <FeedbackButton
            schema={creatorPageFeedbackSchema}
            fields={creatorPageFeedbackFields}
            subject="Creator Page Feedback"
            label="Give Feedback"
            variant="outline"
            description="Help us improve the creator experience. Share your thoughts about the editors and what could be better."
          />
        </div>
      </div>
    </div>
  );
}
