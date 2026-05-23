import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { Orbitron, Space_Grotesk, JetBrains_Mono } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";
import { AppShell } from "@/components/app-shell";
import { getSiteUrl, getSiteUrlObject } from "@/lib/site-url";

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

const siteUrl = getSiteUrl();
const ogImageUrl = `${siteUrl}/og.jpeg`;

export const metadata: Metadata = {
  metadataBase: getSiteUrlObject(),
  applicationName: "Arcade Vibe",
  title: {
    default: "Arcade Vibe - AI-Powered Game Arcade",
    template: "%s | Arcade Vibe",
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: "/apple-touch-icon.png",
  },
  description:
    "Write one prompt. Get a game. Play it, rate it, see how different models handle your words. Monthly themes, leaderboards, and a crowd that learns from every winning entry. Get better at prompting. Figure out which AI actually delivers. Have fun doing it.",
  authors: [{ name: "Arcade Vibe" }],
  creator: "Arcade Vibe",
  publisher: "Arcade Vibe",
  category: "Games",
  keywords: [
    "arcade",
    "AI games",
    "prompt engineering",
    "game generation",
    "retro gaming",
    "monthly challenge",
    "competitive prompting",
  ],
  openGraph: {
    title: "Arcade Vibe - One Prompt. One Shot. One Game.",
    description:
      "Write one prompt. Get a game. Play it, rate it, see how different models handle your words. Monthly themes, leaderboards, and a crowd that learns from every winning entry.",
    url: siteUrl,
    siteName: "Arcade Vibe",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Arcade Vibe - AI-powered game arcade",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arcade Vibe - One Prompt. One Shot. One Game.",
    description:
      "Write one prompt. Get a game. Play it, rate it, see how different models handle your words. Monthly themes, leaderboards, and a crowd that learns from every winning entry.",
    images: [ogImageUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${orbitron.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-[var(--background)]`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--background)] focus:border focus:border-[var(--border)] focus:rounded-md"
        >
          Skip to main content
        </a>
        <Providers>
          <AppShell>
              {children}
          </AppShell>
        </Providers>
        <Script
          src="https://chemin.dbuild.dev/script.js"
          strategy="lazyOnload"
          data-id="7040d34e-b41f-4f20-88d1-b86ac93266c4"
          data-utcoffset="2"
          data-server="https://chemin.dbuild.dev"
        />
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
