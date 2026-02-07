import type { Route } from "next";
import Link from "next/link";

const games = [
  {
    id: "neon-cabinet",
    title: "NEON CABINET",
    desc: "Classic arcade immersion with CRT vibes.",
    color: "var(--color-neon-pink)",
    href: "/demo/3.0-pro/neon-cabinet",
  },
  {
    id: "cyber-grid",
    title: "CYBER GRID",
    desc: "Tron-inspired digital landscapes.",
    color: "var(--color-neon-blue)",
    href: "/demo/3.0-pro/cyber-grid",
  },
  {
    id: "retro-wave",
    title: "RETRO WAVE",
    desc: "Sunset drives and synthwave aesthetics.",
    color: "var(--color-neon-purple)",
    href: "/demo/3.0-pro/retro-wave",
  },
  {
    id: "pixel-arcade",
    title: "PIXEL ARCADE",
    desc: "8-bit nostalgia reimagined.",
    color: "var(--color-neon-green)",
    href: "/demo/3.0-pro/pixel-arcade",
  },
  {
    id: "future-lounge",
    title: "FUTURE LOUNGE",
    desc: "High-end, sleek neon minimalism.",
    color: "var(--color-neon-cyan)",
    href: "/demo/3.0-pro/future-lounge",
  },
];

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-arcade-deep flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 arcade-grid opacity-20 pointer-events-none" />

      <div className="relative z-10 text-center mb-12">
        <h1 className="font-display text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          ARCADE VIBE
        </h1>
        <p className="font-mono text-neon-cyan mt-4 text-xl tracking-widest uppercase glow-text">
          Select Your Experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto relative z-10">
        {games.map((game, i) => (
          <Link
            key={game.id}
            href={game.href as Route}
            className="group relative h-64 perspective-1000"
          >
            <div className="absolute inset-0 bg-cabinet/80 border-2 border-white/10 rounded-xl transform transition-all duration-300 group-hover:scale-105 group-hover:border-transparent group-hover:shadow-[0_0_30px_var(--color)] z-0"
                 style={{ "--color": game.color } as React.CSSProperties}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
               <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center mb-4 group-hover:border-white group-hover:bg-white/10 transition-colors shadow-[0_0_15px_var(--color)]"
                    style={{ "--color": game.color } as React.CSSProperties}>
                  <span className="font-display text-2xl text-white">{i + 1}</span>
               </div>

               <h2 className="font-display text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400">
                 {game.title}
               </h2>

               <p className="font-body text-gray-400 text-sm group-hover:text-white transition-colors">
                 {game.desc}
               </p>

               <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                  <span className="font-mono text-xs border border-white/30 px-3 py-1 rounded bg-black/50 text-white uppercase tracking-wider">
                    Insert Coin
                  </span>
               </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 text-center font-mono text-xs text-white/30">
        PRESS START TO BEGIN • © 2026 ARCADE VIBE SYSTEMS
      </div>
    </div>
  );
}
