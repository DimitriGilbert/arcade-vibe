import Link from "next/link";

const marqueeBulbs = Array.from({ length: 16 }, (_, index) => index);
const palette = [
  { name: "Neon Pink", color: "#ff4fd8" },
  { name: "Laser Blue", color: "#38bdf8" },
  { name: "Cabinet Purple", color: "#6d28d9" },
  { name: "Warm Amber", color: "#fbbf24" },
];

export default function MarqueeRushPage() {
  return (
    <div className="min-h-screen bg-[#0b0518] text-white relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.25),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.2),transparent_60%)]" />

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between text-sm text-white/70 mb-10">
          <Link href="/demo/codex" className="hover:text-white transition-colors">
            ← Back to Codex
          </Link>
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
        </div>

        <div className="relative rounded-[32px] border border-pink-500/30 bg-gradient-to-br from-[#1a0b2e] via-[#12081f] to-[#0b0518] p-10 overflow-hidden">
          <div className="absolute -top-6 left-10 right-10 h-12 rounded-full border border-pink-500/40 bg-[#160a27] shadow-[0_0_40px_rgba(236,72,153,0.25)]" />
          <div className="absolute -top-2 left-16 right-16 flex justify-between px-6">
            {marqueeBulbs.map((bulb) => (
              <span key={bulb} className="h-3 w-3 rounded-full bg-gradient-to-br from-yellow-300 to-pink-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
            ))}
          </div>

          <div className="relative">
            <p className="text-xs uppercase tracking-[0.5em] text-pink-300/80">Marquee Rush</p>
            <h1 className="mt-4 text-5xl md:text-6xl font-black tracking-tight">
              The cabinet topper energy — loud, luminous, unforgettable.
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-2xl">
              A showtime-first layout that treats every hero block like a marquee sign. Thick gradients, ticket textures,
              and bold neon transitions drive the 80s arcade buzz.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-blue-500 font-bold tracking-wide shadow-[0_0_30px_rgba(236,72,153,0.35)] hover:shadow-[0_0_45px_rgba(59,130,246,0.45)] transition-shadow"
              >
                Insert Coin
              </button>
              <button
                type="button"
                className="px-8 py-4 rounded-xl border border-pink-400/60 text-pink-200 font-semibold bg-white/5 hover:bg-white/10 transition-colors"
              >
                View High Scores
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { label: "Cabinet Lines", value: "12", note: "Marquee layers" },
            { label: "Glow Ratio", value: "2.8x", note: "Hot edge lighting" },
            { label: "Ticket Mode", value: "Active", note: "Reward surge" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm uppercase tracking-[0.35em] text-white/60">{stat.label}</div>
              <div className="text-3xl font-bold mt-4 text-pink-200">{stat.value}</div>
              <div className="text-xs text-white/50 mt-2">{stat.note}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="rounded-3xl border border-white/10 bg-[#12081f] p-8">
            <h2 className="text-2xl font-bold mb-4">Palette & marquee lighting</h2>
            <p className="text-white/70 mb-6">
              Saturated neon on top of deep velvet purples. All light accents are layered with soft glows, never full white.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {palette.map((swatch) => (
                <div key={swatch.name} className="rounded-2xl border border-white/10 p-4 bg-white/5">
                  <div className="h-12 w-full rounded-xl" style={{ backgroundColor: swatch.color }} />
                  <div className="mt-3 text-sm font-semibold">{swatch.name}</div>
                  <div className="text-xs text-white/50">{swatch.color}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-b from-[#1b0d2f] to-[#11071d] p-8">
            <h2 className="text-xl font-semibold text-pink-200">Light Theme Preview</h2>
            <p className="text-sm text-pink-100/70 mt-2">
              A softened arcade hall: warm gray-lilac surfaces with neon accents kept at 60% intensity.
            </p>
            <div className="mt-6 rounded-2xl bg-[#f3f0fa] text-[#2b1b4a] p-6 border border-[#e4d7ff]">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.3em]">Marquee Pass</span>
                <span className="text-xs font-semibold text-pink-500">Limited</span>
              </div>
              <div className="mt-4 text-2xl font-black">Neon Rush Tickets</div>
              <div className="mt-2 text-sm text-[#4c3b66]">Soft gradients, still unmistakably 80s.</div>
              <button
                type="button"
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 font-semibold"
              >
                Redeem
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
