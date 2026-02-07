import Link from "next/link";
import type { Route } from "next";

const proposals = [
  {
    id: "neon-marquee",
    name: "Neon Marquee",
    description: "Cabinet-top signage energy with bulb rows, ticket stripes, and spotlighted CTAs.",
    highlights: ["Marquee glow", "Ticket UI", "Hero signage", "Crowd energy"],
    accent: "from-pink-500 via-fuchsia-500 to-amber-300",
  },
  {
    id: "crt-command",
    name: "CRT Command",
    description: "Operator console dashboard with CRT scanlines, status bars, and control panels.",
    highlights: ["HUD layout", "CRT overlays", "Status grid", "Operator tools"],
    accent: "from-cyan-400 via-blue-500 to-indigo-500",
  },
  {
    id: "vector-raceway",
    name: "Vector Raceway",
    description: "Outrun horizon, neon grids, and velocity cards for high-score momentum.",
    highlights: ["Vector sun", "Perspective grid", "Turbo cards", "Motion cues"],
    accent: "from-emerald-400 via-cyan-400 to-purple-500",
  },
  {
    id: "cabinet-carnival",
    name: "Cabinet Carnival",
    description: "Layered cabinet frames, sticker chips, and arcade alley showcase tiles.",
    highlights: ["Cabinet stacks", "Sticker chips", "Prize rack", "Bold tiling"],
    accent: "from-orange-400 via-pink-500 to-purple-500",
  },
  {
    id: "pixel-lounge",
    name: "Pixel Lounge",
    description: "Relaxed after-hours vibe with velvet gradients, lounge seating, and vinyl cues.",
    highlights: ["Velvet gradients", "Soft glow", "Lounge layout", "Light mode vignette"],
    accent: "from-violet-400 via-purple-500 to-cyan-400",
  },
];

export default function Gpt52DemoIndex() {
  return (
    <div className="relative min-h-screen gpt-bg overflow-x-hidden">
      <div className="absolute inset-0 gpt-grid opacity-60 animate-gpt-grid" />
      <div className="absolute inset-0 gpt-scanlines opacity-30" />
      <div className="relative max-w-6xl mx-auto px-6 py-14">
        <div className="flex items-center justify-between text-sm text-white/70 mb-10">
          <Link href="/" className="hover:text-white transition-colors">
            ← Home
          </Link>
          <span className="uppercase tracking-[0.35em] text-xs">GPT-5.2 Arcade Proposals</span>
        </div>

        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.5em] text-pink-300/80 mb-4">Arcade Vibe Directives</p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white gpt-neon-text">
            Five Distinct 80&apos;s Arcade Worlds
          </h1>
          <p className="mt-5 text-lg text-white/70 max-w-3xl mx-auto">
            Each proposal is a fully designed page with its own layout language, motion logic, and neon palette. Dark ambience leads, and a softer light mode is previewed inside each concept.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proposals.map((proposal) => (
            <Link
              key={proposal.id}
              href={`/demo/gpt-5.2/${proposal.id}` as Route}
              className="group relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 overflow-hidden transition-transform duration-300 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${proposal.accent} mix-blend-screen`} />
              <div className="relative">
                <div className={`h-2 w-24 rounded-full bg-gradient-to-r ${proposal.accent}`} />
                <h2 className="mt-6 text-2xl font-bold tracking-tight">{proposal.name}</h2>
                <p className="mt-3 text-white/70 leading-relaxed">{proposal.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {proposal.highlights.map((highlight) => (
                    <span key={highlight} className="text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 text-white/70">
                      {highlight}
                    </span>
                  ))}
                </div>
                <div className="mt-6 text-sm font-semibold text-white/80">Open concept →</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-white/70">
          <div className="gpt-cabinet p-6">
            <h3 className="text-lg font-semibold">Theme Anchors</h3>
            <p className="mt-3 text-sm">
              Dark arcade hall ambience, neon accents with alpha, and CRT-inspired depth across all proposals.
            </p>
          </div>
          <div className="gpt-cabinet p-6">
            <h3 className="text-lg font-semibold">Typography Stack</h3>
            <p className="mt-3 text-sm">
              Orbitron for marquee headlines, Space Grotesk for body, JetBrains Mono for operator readouts.
            </p>
          </div>
          <div className="gpt-cabinet p-6">
            <h3 className="text-lg font-semibold">Light Mode</h3>
            <p className="mt-3 text-sm">
              Softer arcade glow with muted neons, never full white, always keeping the neon circuitry alive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
