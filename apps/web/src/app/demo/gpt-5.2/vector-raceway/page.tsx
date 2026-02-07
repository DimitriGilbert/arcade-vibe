import Link from "next/link";

const stats = [
  { label: "Velocity", value: "88 MPH" },
  { label: "Combo", value: "x14" },
  { label: "Boost", value: "Ready" },
];

export default function VectorRacewayPage() {
  return (
    <div className="relative min-h-screen gpt-bg overflow-hidden">
      <div className="absolute inset-0 gpt-grid opacity-40" />
      <div className="absolute inset-0 gpt-scanlines opacity-25" />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between text-sm text-white/70">
          <Link href="/" className="hover:text-white transition-colors">
            ← Home
          </Link>
          <Link href="/demo/gpt-5.2" className="hover:text-white transition-colors">
            ← Back to proposals
          </Link>
        </div>

        <section className="mt-10 gpt-cabinet p-10 overflow-hidden">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute inset-x-10 top-6 h-48 rounded-full bg-[radial-gradient(circle,rgba(255,196,77,0.65),transparent_70%)] animate-gpt-hue" />
            <div className="absolute inset-x-0 bottom-0 h-64 origin-bottom perspective-1000">
              <div className="h-full w-full gpt-grid opacity-60 animate-gpt-grid" style={{ transform: "rotateX(65deg)" }} />
            </div>
          </div>

          <div className="relative">
            <p className="text-xs uppercase tracking-[0.45em] text-emerald-200">Vector Raceway</p>
            <h1 className="mt-4 text-5xl md:text-6xl font-black text-white">
              Outrun the
              <span className="block text-cyan-200 gpt-neon-text">Arcade Horizon</span>
            </h1>
            <p className="mt-4 text-lg text-white/70 max-w-2xl">
              A high-speed layout built on perspective grids and velocity cards. Perfect for tournament landing pages and racing-focused collections.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/50">{stat.label}</p>
                  <p className="mt-2 text-xl font-mono text-emerald-200">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="gpt-cabinet p-6">
            <h3 className="text-lg font-semibold">Race Cards</h3>
            <div className="mt-4 space-y-3">
              {[
                "Turbo Trials: 9:00 PM",
                "Street Lap: 10:30 PM",
                "Night Circuit Finals",
              ].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-sm text-white/70">{item}</span>
                  <span className="text-xs uppercase tracking-[0.35em] text-cyan-200">Live</span>
                </div>
              ))}
            </div>
          </div>
          <div className="gpt-cabinet p-6">
            <h3 className="text-lg font-semibold">Layout Notes</h3>
            <p className="mt-3 text-sm text-white/70">
              Emphasizes diagonal energy, horizon perspective, and neon speed bands. Use this for leaderboards or competitive dashboards.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "Vector horizon",
                "Gradient speed bands",
                "HUD chips",
                "Motion-led hierarchy",
              ].map((item) => (
                <span key={item} className="gpt-chip text-xs uppercase tracking-[0.3em] text-white/70">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 light rounded-3xl border border-white/10 bg-white/85 text-slate-900 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Light Theme Preview</p>
              <h3 className="mt-2 text-2xl font-semibold">Daylight Circuit</h3>
            </div>
            <span className="gpt-chip text-xs uppercase tracking-[0.35em] text-slate-600">Soft Velocity</span>
          </div>
          <p className="mt-4 text-sm text-slate-600 max-w-2xl">
            Reduced glow and softer gradients keep the outrun feel without overpowering the white space.
          </p>
        </section>
      </div>
    </div>
  );
}
