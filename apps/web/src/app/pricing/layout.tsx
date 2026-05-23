import type { Metadata } from "next";
import type { ReactNode } from "react";

import { JsonLd } from "@/components/JsonLd";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";

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
  return (
    <>
      <JsonLd
        id="pricing-json-ld"
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${toAbsoluteUrl("/pricing")}#webpage`,
          name: "Arcade Vibe Pricing",
          url: toAbsoluteUrl("/pricing"),
          description:
            "Choose an Arcade Vibe credit plan for creating AI-powered games, testing prompts, and competing on monthly leaderboards.",
          inLanguage: "en",
          isPartOf: {
            "@id": `${getSiteUrl()}/#website`,
          },
          about: {
            "@id": `${getSiteUrl()}/#application`,
          },
        }}
      />
      {children}
    </>
  );
}
