import Link from "next/link";

const stats = [
  { label: "Combo", value: "x12" },
  { label: "Heat", value: "88%" },
  { label: "Turbo", value: "ON" },
];

export default function VectorFreestylePage() {
  return (
    <div className="min-h-screen bg-[#07110b] text-white relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,197,94,0.25),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,rgba(251,191,36,0.2),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_40%,rgba(34,197,94,0.1)_40%,rgba(34,197,94,0.1)_50%,transparent_50%)]" />

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between text-sm text-white/70 mb-10">
          <Link href="/demo/codex" className="hover:text-white transition-colors">
            ← Back to Codex
          </Link>
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-lime-300/80">Vector Freestyle</p>
            <h1 className="mt-4 text-5xl md:text-6xl font-black tracking-tight">
              Athletic geometry with turbo stripes and scoreboard clarity.
            </h1>
            <p className="mt-6 text-lg text-white/70">
              This proposal embraces diagonal rhythm, bold vector panels, and sports-arena intensity. It feels like arcade
              competition night.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-lime-400 via-amber-400 to-teal-400 text-black font-bold shadow-[0_0_30px_rgba(163,230,53,0.4)]"
              >
                Start Freestyle
              </button>
              <button
                type="button"
                className="px-8 py-4 rounded-xl border border-lime-300/60 text-lime-200 font-semibold bg-white/5 hover:bg-white/10 transition-colors"
              >
                View Bracket
              </button>
            </div>
          </div>

          <div className="rounded-[36px] border border-lime-400/30 bg-gradient-to-br from-[#0d1f14] via-[#0c1611] to-[#07110b] p-8">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.4em] text-lime-200/70">Scoreboard</div>
              <span className="px-4 py-2 rounded-full bg-lime-400/20 border border-lime-300/40 text-lime-100 text-xs uppercase tracking-[0.3em]">
                Finals
              </span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/60">{stat.label}</div>
                  <div className="mt-2 text-2xl font-black text-lime-200">{stat.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Heat Meter</span>
                <span className="text-amber-300 font-semibold">88%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-gradient-to-r from-lime-400 to-amber-400" style={{ width: "88%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-2xl font-bold">Vector Panels</h2>
            <p className="mt-3 text-white/70">
              Diagonal cuts and high-contrast panels create speed without losing clarity.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {["Turbo Lane", "Side Quest", "Power Surge", "Final Lap"].map((panel) => (
                <div key={panel} className="rounded-2xl border border-white/10 bg-gradient-to-br from-lime-400/15 to-teal-400/15 p-4">
                  <div className="text-sm font-semibold text-lime-100">{panel}</div>
                  <div className="text-xs text-white/60 mt-1">Status: Ready</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-lime-300/40 bg-[#f3f6ef] text-[#1f2a1c] p-8">
            <div className="text-xs uppercase tracking-[0.3em] text-lime-600">Light Theme Preview</div>
            <h2 className="mt-4 text-2xl font-bold">Field Day</h2>
            <p className="mt-2 text-sm text-[#3a4633]">
              Light mode leans into warm off-whites with lime accents and crisp scoreboard blocks.
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-lime-500 to-amber-400 text-white py-3 font-semibold"
            >
              Join Heat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
