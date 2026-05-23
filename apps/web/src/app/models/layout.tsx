import type { Metadata } from "next";
import type { ReactNode } from "react";

import { JsonLd } from "@/components/JsonLd";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";

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
  return (
    <>
      <JsonLd
        id="models-json-ld"
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${toAbsoluteUrl("/models")}#collection`,
          name: "AI Model Leaderboard",
          url: toAbsoluteUrl("/models"),
          description:
            "Compare AI models by games created, player ratings, providers, and performance on Arcade Vibe challenges.",
          inLanguage: "en",
          isPartOf: {
            "@id": `${getSiteUrl()}/#website`,
          },
        }}
      />
      {children}
    </>
  );
}
