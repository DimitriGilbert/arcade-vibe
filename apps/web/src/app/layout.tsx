import type { Metadata } from "next";
import Script from "next/script";

import { Orbitron, Space_Grotesk, JetBrains_Mono } from "next/font/google";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Arcade Vibe - AI-Powered Game Arcade",
    template: "%s | Arcade Vibe",
  },
  description:
    "Create, play, and rate AI-generated games in a retro arcade environment. Join monthly challenges and compete on leaderboards.",
  keywords: [
    "arcade",
    "AI games",
    "game generation",
    "retro gaming",
    "monthly challenge",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${orbitron.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--background)] focus:border focus:border-[var(--border)] focus:rounded-md"
        >
          Skip to main content
        </a>
        <Providers>
          <div className="grid grid-rows-[auto_minmax(0,1fr)] min-h-svh">
            <Header />
            <main id="main-content" className="min-h-0 overflow-y-auto">
              {children}
            </main>
          </div>
        </Providers>
        <Script
          src="https://cdn.counter.dev/script.js"
          strategy="lazyOnload"
          data-id="154c6878-7558-4eff-90f9-bd4904015df1"
          data-utcoffset="1"
        />
      </body>
    </html>
  );
}
