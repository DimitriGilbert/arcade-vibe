import Link from "next/link";

const sessions = [
  { time: "8:00 PM", title: "Chillwave Co-op" },
  { time: "9:30 PM", title: "Synth Jazz Set" },
  { time: "11:00 PM", title: "After-Hours Free Play" },
];

export default function PixelLoungePage() {
  return (
    <div className="relative min-h-screen gpt-bg overflow-hidden">
      <div className="absolute inset-0 gpt-grid opacity-30" />
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

        <section className="mt-10 grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6">
          <div className="gpt-cabinet p-10">
            <p className="text-xs uppercase tracking-[0.45em] text-violet-200">Pixel Lounge</p>
            <h1 className="mt-4 text-5xl md:text-6xl font-black text-white">After-Hours Arcade</h1>
            <p className="mt-4 text-lg text-white/70">
              A softer, velvet-infused layout for late-night arcade sessions. Think lounge seating, ambient neon, and slower pulses.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" className="gpt-button text-sm font-semibold">
                Reserve a booth
              </button>
              <button type="button" className="rounded-full px-5 py-3 text-sm font-semibold border border-white/20 text-white/80 hover:text-white transition">
                View lounge map
              </button>
            </div>
          </div>

          <div className="gpt-cabinet p-8 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(186,85,255,0.45),transparent_70%)] animate-gpt-float" />
            <div className="relative">
              <h2 className="text-2xl font-semibold">Session Lineup</h2>
              <div className="mt-6 space-y-4">
                {sessions.map((session) => (
                  <div key={session.title} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/50">{session.time}</p>
                      <p className="text-white font-semibold">{session.title}</p>
                    </div>
                    <span className="gpt-chip text-xs uppercase tracking-[0.3em] text-white/70">Live</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {["Velvet Seats", "Vinyl Bar", "Ambient Stages"].map((item) => (
            <div key={item} className="gpt-cabinet p-6">
              <h3 className="text-lg font-semibold">{item}</h3>
              <p className="mt-3 text-sm text-white/70">
                Soft gradients and mellow lighting help the arcade feel like a lounge without losing the neon glow.
              </p>
            </div>
          ))}
        </section>

        <section className="mt-10 light rounded-3xl border border-white/10 bg-white/85 text-slate-900 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Light Theme Preview</p>
              <h3 className="mt-2 text-2xl font-semibold">Matinee Lounge</h3>
            </div>
            <span className="gpt-chip text-xs uppercase tracking-[0.35em] text-slate-600">Soft Velvet</span>
          </div>
          <p className="mt-4 text-sm text-slate-600 max-w-2xl">
            The lounge brightens for daytime sessions while keeping the mood with muted neon trims.
          </p>
        </section>
      </div>
    </div>
  );
}
