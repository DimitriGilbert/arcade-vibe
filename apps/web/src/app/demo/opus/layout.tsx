"use client";

import { Orbitron, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./arcade.css";

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

export default function OpusLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${orbitron.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} theme-opus font-body bg-background text-foreground min-h-screen`}
    >
      {children}
    </div>
  );
}
