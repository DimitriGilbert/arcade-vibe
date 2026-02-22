import type { Metadata } from "next";
import type { Route } from "next";

import Link from "next/link";
import { FileText, LayoutGrid, SplitSquareHorizontal } from "lucide-react";

import { ArcadeCard, ArcadeButton, ArcadeBadge } from "@/components/arcade";
import { PromptsFeedback } from "@/components/feedback";

export const metadata: Metadata = {
  title: "Prompts - Arcade Vibe",
  description: "Browse and explore public prompts. Choose your preferred view style.",
};

const PROMPT_VIEWS = [
  {
    id: "document",
    title: "Document Editor",
    description: "Classic document-style view. Read and edit prompts in a focused, distraction-free environment.",
    icon: FileText,
    badge: "Default",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "hover:border-emerald-400/50",
    href: "/prompts/document",
  },
  {
    id: "gallery",
    title: "Gallery Showcase",
    description: "Visual card-based display. Browse prompts as beautiful cards with rich previews.",
    icon: LayoutGrid,
    badge: "Visual",
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    borderColor: "hover:border-violet-400/50",
    href: "/prompts/gallery",
  },
  {
    id: "dashboard",
    title: "Split Panel",
    description: "Split-view dashboard. See prompt details and metadata side by side.",
    icon: SplitSquareHorizontal,
    badge: "Power User",
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    borderColor: "hover:border-sky-400/50",
    href: "/prompts/dashboard",
  },
] as const;

export default function PromptsHubPage() {
  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--muted)] text-xs font-medium text-[var(--muted-foreground)] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            CHOOSE YOUR VIEW
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-5 bg-gradient-to-r from-emerald-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
            PROMPTS
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-xl mx-auto leading-relaxed">
            Three ways to explore. Pick the one that matches your vibe—we're curious which you'll love most.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PROMPT_VIEWS.map((view) => {
            const IconComponent = view.icon;
            return (
              <Link key={view.id} href={view.href as Route}>
                <ArcadeCard
                  variant="default"
                  className={`group h-full cursor-pointer ${view.borderColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-${view.color}/5`}
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-5">
                      <div className={`p-3 rounded-xl ${view.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                        <IconComponent className={`h-6 w-6 ${view.color}`} />
                      </div>
                      <ArcadeBadge text={view.badge} variant="default" />
                    </div>

                    <h2 className="text-xl font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">
                      {view.title}
                    </h2>

                    <p className="text-sm text-[var(--muted-foreground)] flex-1 mb-5 leading-relaxed">
                      {view.description}
                    </p>

                    <ArcadeButton variant="outline" className="w-full group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)] group-hover:border-[var(--primary)] transition-all">
                      Open {view.title}
                    </ArcadeButton>
                  </div>
                </ArcadeCard>
              </Link>
            );
          })}
        </div>

        <PromptsFeedback />
      </div>
    </main>
  );
}
