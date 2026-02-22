import type { Metadata } from "next";
import type { Route } from "next";

import Link from "next/link";
import { FileText, LayoutGrid, SplitSquareHorizontal } from "lucide-react";

import { ArcadeCard, ArcadeButton, ArcadeBadge } from "@/components/arcade";

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
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    href: "/prompts/document",
  },
  {
    id: "gallery",
    title: "Gallery Showcase",
    description: "Visual card-based display. Browse prompts as beautiful cards with rich previews.",
    icon: LayoutGrid,
    badge: "Visual",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    href: "/prompts/gallery",
  },
  {
    id: "dashboard",
    title: "Split Panel",
    description: "Split-view dashboard. See prompt details and metadata side by side.",
    icon: SplitSquareHorizontal,
    badge: "Power User",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    href: "/prompts/dashboard",
  },
] as const;

export default function PromptsHubPage() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
            PROMPTS
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] max-w-xl mx-auto">
            Browse and explore public prompts. Choose your preferred view style.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROMPT_VIEWS.map((view) => {
            const IconComponent = view.icon;
            return (
              <Link key={view.id} href={view.href as Route}>
                <ArcadeCard
                  variant="default"
                  className="group h-full cursor-pointer hover:border-[var(--primary)]/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${view.bgColor}`}>
                        <IconComponent className={`h-6 w-6 ${view.color}`} />
                      </div>
                      <ArcadeBadge text={view.badge} variant="default" />
                    </div>

                    <h2 className="text-xl font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">
                      {view.title}
                    </h2>

                    <p className="text-sm text-[var(--muted-foreground)] flex-1 mb-4">
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

        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Access individual prompts via{" "}
            <code className="px-2 py-1 rounded bg-[var(--muted)] text-xs">
              /prompts/document/[id]
            </code>
            ,{" "}
            <code className="px-2 py-1 rounded bg-[var(--muted)] text-xs">
              /prompts/gallery/[id]
            </code>
            , or{" "}
            <code className="px-2 py-1 rounded bg-[var(--muted)] text-xs">
              /prompts/dashboard/[id]
            </code>
          </p>
        </div>
      </div>
    </main>
  );
}
