import Link from "next/link";

const cabinets = [
  { name: "Synth Clash", prize: "500 Tickets" },
  { name: "Meteor Mash", prize: "Retro Pin" },
  { name: "Laser Brawl", prize: "Glow Tee" },
  { name: "Token Rush", prize: "Free Play" },
];

export default function CabinetCarnivalPage() {
  return (
    <div className="relative min-h-screen gpt-bg overflow-hidden">
      <div className="absolute inset-0 gpt-grid opacity-40 animate-gpt-grid" />
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

        <section className="mt-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="gpt-cabinet p-10">
            <p className="text-xs uppercase tracking-[0.45em] text-orange-200">Cabinet Carnival</p>
            <h1 className="mt-4 text-5xl md:text-6xl font-black text-white">Prize Alley Showcase</h1>
            <p className="mt-4 text-lg text-white/70">
              A loud, layered layout with stickers, tokens, and cabinet tiles stacked like an arcade hallway.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "Sticker chips",
                "Prize banners",
                "Cabinet cards",
                "Token counters",
              ].map((item) => (
                <span key={item} className="gpt-chip text-xs uppercase tracking-[0.3em] text-white/70">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-10 flex items-center gap-4">
              <button type="button" className="gpt-button text-sm font-semibold">
                Claim a prize
              </button>
              <button type="button" className="rounded-full px-5 py-3 text-sm font-semibold border border-white/20 text-white/80 hover:text-white transition">
                Find a cabinet
              </button>
            </div>
          </div>

          <div className="gpt-cabinet p-6 space-y-4">
            <h2 className="text-xl font-semibold">Alley Map</h2>
            {cabinets.map((cabinet) => (
              <div key={cabinet.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">{cabinet.name}</span>
                  <span className="text-xs uppercase tracking-[0.35em] text-amber-200">Open</span>
                </div>
                <p className="mt-2 text-sm text-white/60">Prize: {cabinet.prize}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {["VIP Tokens", "Combo Stickers", "Retro Merch"].map((title) => (
            <div key={title} className="gpt-cabinet p-6">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm text-white/70">
                Limited runs with neon-glow packaging and ticket-ribbon highlights.
              </p>
            </div>
          ))}
        </section>

        <section className="mt-10 light rounded-3xl border border-white/10 bg-white/85 text-slate-900 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Light Theme Preview</p>
              <h3 className="mt-2 text-2xl font-semibold">Daytime Prize Hall</h3>
            </div>
            <span className="gpt-chip text-xs uppercase tracking-[0.35em] text-slate-600">Soft Tokens</span>
          </div>
          <p className="mt-4 text-sm text-slate-600 max-w-2xl">
            Brightens the cabinets while keeping the neon accent stripes and sticker chips intact.
          </p>
        </section>
      </div>
    </div>
  );
}
