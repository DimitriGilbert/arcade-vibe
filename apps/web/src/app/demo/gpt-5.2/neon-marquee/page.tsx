import Link from "next/link";

const tickets = ["Quarter Drop", "Lucky Spin", "Midnight Bonus", "Cabinet League"];
const booths = [
  { name: "Galaga Storm", genre: "Shooter", score: "009,880" },
  { name: "Neon Drift", genre: "Racer", score: "012,410" },
  { name: "Pixel Rumble", genre: "Fighter", score: "008,220" },
];

export default function NeonMarqueePage() {
  return (
    <div className="relative min-h-screen gpt-bg overflow-hidden">
      <div className="absolute inset-0 gpt-grid opacity-50 animate-gpt-grid" />
      <div className="absolute inset-0 gpt-scanlines opacity-30" />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between text-sm text-white/70">
          <Link href="/" className="hover:text-white transition-colors">
            ← Home
          </Link>
          <Link href="/demo/gpt-5.2" className="hover:text-white transition-colors">
            ← Back to proposals
          </Link>
        </div>

        <section className="mt-10 gpt-marquee p-10 md:p-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 relative">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.45em] text-amber-200">Neon Marquee</p>
              <h1 className="mt-4 text-5xl md:text-6xl font-black text-white gpt-neon-text animate-gpt-flicker">
                Arcade Nights,
                <br />
                All Lights On
              </h1>
              <p className="mt-5 text-lg text-white/75">
                A marquee-first layout that feels like walking under cabinet toppers. Ticket strips, bulb borders, and a showtime stage for new releases.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" className="gpt-button text-sm font-semibold">
                  Start the show
                </button>
                <button
                  type="button"
                  className="rounded-full px-5 py-3 text-sm font-semibold border border-white/20 text-white/80 hover:text-white transition"
                >
                  Book a booth
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket}
                  className="gpt-chip text-xs uppercase tracking-[0.35em] text-white/70"
                >
                  {ticket}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="gpt-cabinet p-8">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-pink-200/80">
              <span>Show Floor</span>
              <span className="text-white/60">Live Booths</span>
            </div>
            <div className="mt-6 grid gap-4">
              {booths.map((booth) => (
                <div key={booth.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                  <div>
                    <div className="text-lg font-semibold text-white">{booth.name}</div>
                    <div className="text-xs uppercase tracking-[0.35em] text-white/50">{booth.genre}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/50">Top Score</div>
                    <div className="font-mono text-lg text-cyan-200">{booth.score}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="gpt-cabinet p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Tonight&apos;s Highlights</h2>
              <p className="mt-3 text-white/70">
                Spotlight your newest cabinets with oversized signage and ultra-contrast callouts. Each slot is a hero marquee.
              </p>
            </div>
            <div className="mt-6 space-y-3">
              {[
                "Bulb-lit ticket counters",
                "Layered neon gradients",
                "High-score callouts",
                "Stage-ready CTA strip",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="h-2 w-2 rounded-full bg-pink-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="light rounded-3xl border border-white/10 bg-white/80 text-slate-900 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Light Theme Preview</p>
                <h3 className="mt-2 text-2xl font-semibold">Sunrise Matinee</h3>
              </div>
              <span className="gpt-chip text-xs uppercase tracking-[0.3em] text-slate-600">Soft Neon</span>
            </div>
            <p className="mt-4 text-sm text-slate-600 max-w-2xl">
              The light mode keeps the marquee energy but softens contrast and glow. Still neon-forward, never washed out.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
