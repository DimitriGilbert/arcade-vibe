import Link from "next/link";

const signals = [
  { label: "Scanline", value: "ON" },
  { label: "Cabinet", value: "CLASSIC" },
  { label: "Glow", value: "MED" },
];

export default function CrtCabinetPage() {
  return (
    <div className="min-h-screen bg-[#05070d] text-white relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(16,185,129,0.2),transparent_60%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.4)_0px,rgba(0,0,0,0.4)_1px,transparent_1px,transparent_3px)] opacity-40" />

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between text-sm text-white/70 mb-10">
          <Link href="/demo/codex" className="hover:text-white transition-colors">
            ← Back to Codex
          </Link>
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <div className="relative rounded-[36px] border border-emerald-500/30 bg-gradient-to-br from-[#0b1516] via-[#0b0f15] to-[#05070d] p-10 shadow-[0_0_60px_rgba(16,185,129,0.12)]">
            <div className="absolute inset-4 rounded-[28px] border border-emerald-400/40" />
            <div className="absolute inset-8 rounded-[20px] bg-[linear-gradient(180deg,rgba(5,7,13,0.9),rgba(3,4,8,0.95))]" />

            <div className="relative">
              <p className="text-xs uppercase tracking-[0.45em] text-emerald-300/80">CRT Cabinet</p>
              <h1 className="mt-4 text-5xl md:text-6xl font-black">Analog depth with a cabinet-first frame.</h1>
              <p className="mt-5 text-lg text-white/70 max-w-2xl">
                This proposal frames content inside the cabinet, with CRT scan lines, phosphor glow, and tactile button layouts.
                It feels heavy, authentic, and grounded.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {signals.map((signal) => (
                  <div key={signal.label} className="px-4 py-2 rounded-full border border-emerald-400/40 text-sm text-emerald-200">
                    <span className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">{signal.label}</span>
                    <span className="ml-2 font-semibold">{signal.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Cabinet Shell", detail: "Wide bezels & layered borders" },
                  { title: "CRT Glow", detail: "Soft green phosphor bloom" },
                  { title: "Control Deck", detail: "Large buttons & levers" },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="font-semibold text-emerald-200">{item.title}</h3>
                    <p className="text-sm text-white/60 mt-2">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-500/30 bg-[#0b1215] p-6">
              <div className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">Scoreboard</div>
              <div className="mt-4 text-5xl font-black text-emerald-300">981,420</div>
              <div className="mt-2 text-xs text-white/50">Player: NOVA-CRT</div>
              <div className="mt-6 flex gap-3">
                <button type="button" className="flex-1 rounded-xl bg-emerald-400/20 border border-emerald-400/40 text-emerald-100 py-3 font-semibold">
                  Continue
                </button>
                <button type="button" className="flex-1 rounded-xl border border-white/10 text-white/70 py-3 font-semibold">
                  Save
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#eef2f3] text-[#17211f] p-6">
              <div className="text-xs uppercase tracking-[0.3em] text-emerald-600">Light Theme Preview</div>
              <h2 className="mt-4 text-2xl font-bold">CRT Calm</h2>
              <p className="mt-2 text-sm text-[#2f3d39]">
                Light cabinet interiors retain green signal glow with muted shadows.
              </p>
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Scanline Status</span>
                  <span className="text-emerald-500">Enabled</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-emerald-100">
                  <div className="h-2 w-3/4 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
