import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose an Arcade Vibe credit plan for creating AI-powered games, testing prompts, and competing on monthly leaderboards.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Arcade Vibe Pricing",
    description:
      "Choose an Arcade Vibe credit plan for creating AI-powered games, testing prompts, and competing on monthly leaderboards.",
    type: "website",
    url: "/pricing",
  },
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children;
}
