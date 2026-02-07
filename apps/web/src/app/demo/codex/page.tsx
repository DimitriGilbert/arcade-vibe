import Link from "next/link";
import type { Route } from "next";

const proposals = [
  {
    id: "marquee-rush",
    name: "Marquee Rush",
    description: "Blazing signage, bulb-lit trims, and headline energy inspired by cabinet toppers.",
    highlights: ["Marquee light strips", "Hot pink + electric blue", "Showtime hero", "Bold ticket UI"],
    accent: "from-pink-500 via-fuchsia-500 to-blue-500",
  },
  {
    id: "crt-cabinet",
    name: "CRT Cabinet",
    description: "Heavy cabinet framing, scan-line glow, and tactile controls with CRT depth.",
    highlights: ["Cabinet frames", "CRT scan-line overlays", "Neon green signals", "Arcade HUD"],
    accent: "from-emerald-400 via-cyan-400 to-blue-500",
  },
  {
    id: "laser-grid",
    name: "Laser Grid",
    description: "Vector horizon, laser grids, and neon wireframes for speed-run energy.",
    highlights: ["Perspective grid", "Neon gradients", "Velocity panels", "Runner badges"],
    accent: "from-cyan-400 via-indigo-500 to-purple-500",
  },
  {
    id: "neon-bazaar",
    name: "Neon Bazaar",
    description: "A saturated arcade street market with layered stickers and color clash.",
    highlights: ["Sticker chips", "Layered signage", "Warm neon mix", "Drop-shadow depth"],
    accent: "from-orange-400 via-pink-500 to-purple-500",
  },
  {
    id: "vector-freestyle",
    name: "Vector Freestyle",
    description: "Athletic vector geometry, angular panels, and motion-first composition.",
    highlights: ["Diagonal layouts", "Turbo stripes", "Amber + teal", "Scoreboard blocks"],
    accent: "from-amber-400 via-lime-400 to-teal-400",
  },
];

export default function CodexDemoIndex() {
  return (
    <div className="min-h-screen bg-[#0b0717] text-white relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.25),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,rgba(34,211,238,0.15),transparent_55%)]" />
      <div className="relative max-w-6xl mx-auto px-6 py-14">
        <div className="flex items-center justify-between text-sm text-white/70 mb-10">
          <Link href="/" className="hover:text-white transition-colors">
            ← Home
          </Link>
          <span className="uppercase tracking-[0.35em] text-xs">Codex Arcade Proposals</span>
        </div>

        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.5em] text-pink-300/80 mb-4">Design Codex</p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">
            Arcade Vibe: 5 Bold Directions
          </h1>
          <p className="mt-5 text-lg text-white/70 max-w-3xl mx-auto">
            Each proposal interprets the arcade mood through a distinct layout language and color logic while honoring the
            dark neon core and a softer, restrained light mode.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proposals.map((proposal) => (
            <Link
              key={proposal.id}
              href={`/demo/codex/${proposal.id}` as Route}
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

        <div className="mt-14 flex flex-col md:flex-row items-center justify-between gap-4 text-white/60 text-sm">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-pink-400" />
            Dark ambience with neon accents
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-indigo-300" />
            Softer light theme previewed inside each proposal
          </div>
        </div>
      </div>
    </div>
  );
}
