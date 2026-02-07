import Link from "next/link";
import { Orbitron, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./styles/arcade.css";
import { ArcadeThemeToggle } from "./components/arcade-theme-toggle";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function ArcadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${orbitron.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-body bg-arcade-deep text-white min-h-screen selection:bg-neon-pink selection:text-white overflow-x-hidden`}
    >
      <div className="fixed top-4 left-4 z-50 flex gap-4">
        <Link
          href="/"
          className="group relative inline-flex items-center justify-center px-4 py-2 font-display text-sm font-bold text-neon-cyan transition-all duration-200 hover:text-white"
        >
          <span className="absolute inset-0 border-2 border-neon-cyan opacity-80 skew-x-[-12deg] transition-all duration-200 group-hover:bg-neon-cyan/20 group-hover:shadow-[0_0_20px_var(--color-neon-cyan)]"></span>
          <span className="relative">&lt; BACK TO REALITY</span>
        </Link>
      </div>

      <div className="fixed top-4 right-4 z-50 flex gap-4">
         <ArcadeThemeToggle />
         <Link
          href="/demo/3.0-pro"
          className="group relative inline-flex items-center justify-center px-4 py-2 font-display text-sm font-bold text-neon-purple transition-all duration-200 hover:text-white"
        >
          <span className="absolute inset-0 border-2 border-neon-purple opacity-80 skew-x-[-12deg] transition-all duration-200 group-hover:bg-neon-purple/20 group-hover:shadow-[0_0_20px_var(--color-neon-purple)]"></span>
          <span className="relative">INDEX</span>
        </Link>
      </div>
      
      {/* Global CRT Overlay */}
      <div className="crt-overlay pointer-events-none fixed inset-0 z-[100]" />
      <div className="scanline z-[101]" />

      {children}
    </div>
  );
}
