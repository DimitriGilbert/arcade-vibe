import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Route } from "next";

const demos = [
  {
    title: "Neon City",
    description: "High-tech metropolis with glassmorphism and deep purple/pink gradients.",
    href: "/demo/gemini/neon-city",
    color: "neon-pink",
    icon: "🏙️",
  },
  {
    title: "Retro Grid",
    description: "Vaporwave aesthetics, perspective grids, and sunset gradients.",
    href: "/demo/gemini/retro-grid",
    color: "neon-cyan",
    icon: "🌅",
  },
  {
    title: "Cyber Terminal",
    description: "Monochrome green phosphor CRT interface for hackers.",
    href: "/demo/gemini/cyber-terminal",
    color: "neon-green",
    icon: "📟",
  },
  {
    title: "Pixel Perfect",
    description: "Chunky 8-bit gaming UI with bold primary colors.",
    href: "/demo/gemini/pixel-perfect",
    color: "neon-yellow",
    icon: "👾",
  },
  {
    title: "Flux Capacitor",
    description: "Industrial sci-fi interface with metallic finishes and electricity.",
    href: "/demo/gemini/flux-capacitor",
    color: "neon-blue",
    icon: "⚡",
  },
];

export default function GeminiDemoIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,oklch(var(--neon-purple)/0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        <header className="text-center space-y-6">
          <Badge variant="outline" className="border-primary text-primary px-4 py-1 text-sm font-mono tracking-widest uppercase mb-4">
            Gemini Design Proposals
          </Badge>
          <h1 className="text-6xl md:text-8xl font-display font-black tracking-tighter uppercase glitch-text" data-text="ARCADE VIBE">
            ARCADE VIBE
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-body max-w-2xl mx-auto">
            Select a cartridge to preview the aesthetic direction.
          </p>

          <div className="pt-8">
            <Link href="/">
              <Button variant="ghost" className="font-mono text-muted-foreground hover:text-primary transition-colors">
                &lt; BACK TO MAIN MENU
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {demos.map((demo) => (
            <Link key={demo.href} href={demo.href as Route} className="group block h-full">
              <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_oklch(var(--neon-blue)/0.2)] group-hover:bg-card/80 overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-oklch(var(--${demo.color})) to-transparent opacity-50 group-hover:opacity-100 transition-opacity`} />

                <CardHeader>
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300 origin-left">
                    {demo.icon}
                  </div>
                  <CardTitle className="font-display text-2xl tracking-wide group-hover:text-primary transition-colors">
                    {demo.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="font-mono text-base">
                    {demo.description}
                  </CardDescription>
                  <div className="mt-6 flex items-center text-sm font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                    <span>Insert Coin</span>
                    <span className="ml-2 animate-pulse">_</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Scanlines */}
      <div className="crt-overlay pointer-events-none fixed inset-0 z-50 opacity-10" />
    </div>
  );
}
