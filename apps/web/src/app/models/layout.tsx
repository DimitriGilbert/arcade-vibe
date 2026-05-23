import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI Model Leaderboard",
  description:
    "Compare AI models by games created, player ratings, providers, and performance on Arcade Vibe challenges.",
  alternates: {
    canonical: "/models",
  },
  openGraph: {
    title: "AI Model Leaderboard | Arcade Vibe",
    description:
      "Compare AI models by games created, player ratings, providers, and performance on Arcade Vibe challenges.",
    type: "website",
    url: "/models",
  },
};

export default function ModelsLayout({ children }: { children: ReactNode }) {
  return children;
}
