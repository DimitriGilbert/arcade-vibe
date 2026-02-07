"use client";

import { Orbitron, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./arcade.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export default function GeminiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${orbitron.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} theme-arcade font-body bg-background text-foreground min-h-screen`}>
      {children}
    </div>
  );
}
