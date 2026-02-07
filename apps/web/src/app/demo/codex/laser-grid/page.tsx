import Link from "next/link";

const badges = ["Vector Horizon", "Turbo Mode", "Synth Boost", "Night Sprint"];

export default function LaserGridPage() {
  return (
    <div className="min-h-screen bg-[#070311] text-white relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.2),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.25),transparent_60%)]" />

      <div className="absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-30">
        <div className="h-full w-full rounded-[48px] border border-cyan-400/30 bg-[linear-gradient(180deg,rgba(7,3,17,0.2),rgba(7,3,17,0.9))]" />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-96 bg-[linear-gradient(transparent,rgba(7,3,17,0.9))]" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-[linear-gradient(0deg,rgba(56,189,248,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.12)_1px,transparent_1px)] bg-[length:48px_48px] opacity-60" />

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between text-sm text-white/70 mb-10">
          <Link href="/demo/codex" className="hover:text-white transition-colors">
            ← Back to Codex
          </Link>
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
        </div>

        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.5em] text-cyan-300/80">Laser Grid</p>
          <h1 className="mt-4 text-5xl md:text-6xl font-black tracking-tight">
            Vector horizons and neon runways for full-speed arcade energy.
          </h1>
          <p className="mt-6 text-lg text-white/70">
            This proposal prioritizes speed, grid geometry, and perspective depth. Layouts are built from angular panels and
            motion streaks.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {badges.map((badge) => (
            <span key={badge} className="px-4 py-2 rounded-full border border-cyan-300/40 text-xs uppercase tracking-[0.3em] text-cyan-200">
              {badge}
            </span>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-2xl font-bold">Velocity Panels</h2>
            <p className="mt-3 text-white/70">
              Angular cards sit on top of the grid plane, stacked with neon gradients to create forward momentum.
            </p>
            <div className="mt-6 space-y-4">
              {["Hyper Lane", "Photon Drift", "Arc Runner"].map((lane) => (
                <div key={lane} className="rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 p-4">
                  <div className="text-sm uppercase tracking-[0.4em] text-cyan-200/80">{lane}</div>
                  <div className="mt-2 text-white/80">Speed tier engaged · 94% stability</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-indigo-400/40 bg-gradient-to-br from-[#0d0b2a] to-[#070311] p-8">
            <h2 className="text-xl font-semibold text-indigo-200">Light Theme Preview</h2>
            <p className="text-sm text-indigo-100/70 mt-2">
              A pale lilac runway keeps the vector grid visible while dialing down the glow.
            </p>
            <div className="mt-6 rounded-2xl bg-[#f2f3ff] text-[#1e2349] p-6 border border-[#d8defe]">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]">
                <span>Vector Run</span>
                <span className="text-indigo-500">Active</span>
              </div>
              <div className="mt-4 text-3xl font-black">Stage 04</div>
              <div className="mt-3 text-sm text-[#3a3f6f]">Line glow at 55% intensity</div>
              <button
                type="button"
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white py-3 font-semibold"
              >
                Engage Vector
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
