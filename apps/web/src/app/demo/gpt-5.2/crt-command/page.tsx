import Link from "next/link";

const statusRows = [
  { label: "Cabinet Sync", value: "99.4%" },
  { label: "Token Flow", value: "+22%" },
  { label: "Queue Pulse", value: "Stable" },
  { label: "Speaker Grid", value: "ONLINE" },
];

const alerts = [
  "Player 04 reached Stage 7",
  "Neon Drift just hit a new record",
  "Prize counter restocked",
];

export default function CrtCommandPage() {
  return (
    <div className="relative min-h-screen gpt-bg overflow-hidden">
      <div className="absolute inset-0 gpt-grid opacity-40 animate-gpt-grid" />
      <div className="absolute inset-0 gpt-scanlines opacity-40" />

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between text-sm text-white/70">
          <Link href="/" className="hover:text-white transition-colors">
            ← Home
          </Link>
          <Link href="/demo/gpt-5.2" className="hover:text-white transition-colors">
            ← Back to proposals
          </Link>
        </div>

        <section className="mt-10 grid grid-cols-1 lg:grid-cols-[0.28fr_0.72fr] gap-6">
          <aside className="gpt-cabinet p-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.45em] text-cyan-300">CRT Command</p>
              <h1 className="mt-3 text-3xl font-black">Operator Deck</h1>
            </div>
            <div className="space-y-3 text-sm text-white/70">
              {["Overview", "Booth Control", "Audio Grid", "Prizes", "Security"].map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <span>{item}</span>
                  <span className="h-2 w-2 rounded-full bg-cyan-300/70" />
                </div>
              ))}
            </div>
            <button type="button" className="gpt-button text-sm font-semibold w-full">
              Launch Diagnostics
            </button>
          </aside>

          <main className="space-y-6">
            <div className="gpt-cabinet p-8 relative overflow-hidden">
              <div className="absolute inset-0 gpt-scanlines opacity-25" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-white/50">CRT Mainframe</p>
                    <h2 className="text-3xl font-semibold text-white">Arcade Pulse Monitor</h2>
                  </div>
                  <span className="gpt-chip text-xs text-white/70">LIVE</span>
                </div>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statusRows.map((row) => (
                    <div key={row.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{row.label}</p>
                      <p className="mt-2 text-xl font-mono text-cyan-200">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="gpt-cabinet p-6">
                <h3 className="text-lg font-semibold">Alert Stream</h3>
                <div className="mt-4 space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert} className="flex items-center gap-3 text-sm text-white/70">
                      <span className="h-2 w-2 rounded-full bg-pink-400 animate-gpt-pulse" />
                      {alert}
                    </div>
                  ))}
                </div>
              </div>
              <div className="gpt-cabinet p-6">
                <h3 className="text-lg font-semibold">Operator Notes</h3>
                <p className="mt-3 text-white/70 text-sm">
                  Keep the cabinet line tight and the crowd moving. This layout prioritizes fast-read telemetry with CRT realism.
                </p>
                <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.35em] text-white/60">Shift Mode</span>
                  <span className="text-sm font-semibold text-emerald-300">Night Ops</span>
                </div>
              </div>
            </div>
          </main>
        </section>

        <section className="mt-10 light rounded-3xl border border-white/10 bg-white/85 text-slate-900 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Light Theme Preview</p>
              <h3 className="mt-2 text-2xl font-semibold">Operator Day Shift</h3>
            </div>
            <span className="gpt-chip text-xs uppercase tracking-[0.35em] text-slate-600">Calm CRT</span>
          </div>
          <p className="mt-4 text-sm text-slate-600 max-w-2xl">
            Muted cabinets and lighter CRT screens keep the command desk readable while preserving the neon edge.
          </p>
        </section>
      </div>
    </div>
  );
}
