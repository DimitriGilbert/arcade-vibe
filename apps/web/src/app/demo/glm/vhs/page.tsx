"use client";
import Link from "next/link";

export default function VhsArcade() {
  return (
    <div className="min-h-screen bg-[#1a0f0f]">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(26,15,15,0.96)] to-[rgba(26,15,15,0.96)]">
        <div className="absolute inset-0" style={{
          background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 3px)',
        }} />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10">
        <nav className="flex items-center justify-between px-8 py-6 border-b border-orange-500/20">
          <Link href={"/demo/glm" as any} className="text-orange-400 hover:text-orange-300 transition-colors">
            ◀ BACK
          </Link>
          <div className="text-sm text-orange-400/60 tracking-widest">VHS ARCADE</div>
        </nav>

        <main className="max-w-7xl mx-auto px-8 py-20">
          <header className="text-center mb-24">
            <h1 className="text-6xl font-bold mb-8 text-orange-400 tracking-wide" style={{
              textShadow: '3px 3px 0 rgba(0,0,0,0.3), 0 0 30px rgba(251,146,60,0.3)',
            }}>
              VHS ARCADE
            </h1>
            <p className="text-xl text-orange-200/80 max-w-2xl mx-auto font-mono">
              Analog retro with tape distortion, warm colors, and 80s video aesthetics
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {[
              { title: "VHS TRACKING", desc: "Tape distortion lines" },
              { title: "WARM GRADING", desc: "Amber color tones" },
              { title: "ANALOG NOISE", desc: "Film grain texture" },
              { title: "ROUNDED CORNERS", desc: "Soft edge designs" },
              { title: "TAPE WEAR", desc: "Aged visual effects" },
              { title: "RETRO BROADCAST", desc: "80s TV aesthetic" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-8 bg-gradient-to-br from-orange-950/40 to-red-950/40 border border-orange-500/20 rounded-xl overflow-hidden hover:scale-105 transition-all duration-300"
                style={{
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <div className="h-1 w-16 bg-gradient-to-r from-orange-500 to-red-500 mb-6 rounded-full" />
                <h3 className="text-xl font-bold mb-3 text-orange-400">
                  {feature.title}
                </h3>
                <p className="text-orange-200/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-orange-400 mb-6">COLOR PALETTE</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Burnt Orange", hex: "#ea580c" },
                  { name: "Warm Amber", hex: "#f59e0b" },
                  { name: "Deep Red", hex: "#991b1b" },
                  { name: "Cream", hex: "#fef3c7" },
                  { name: "Dark Brown", hex: "#451a03" },
                  { name: "Rust", hex: "#b45309" },
                ].map((color) => (
                  <div key={color.name} className="space-y-2">
                    <div
                      className="w-full h-24 rounded-lg border-2 border-orange-500/20"
                      style={{
                        backgroundColor: color.hex,
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)',
                      }}
                    />
                    <div className="text-sm text-orange-200/80">{color.name}</div>
                    <div className="text-xs text-orange-200/40 font-mono">{color.hex}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-orange-400 mb-6">UI COMPONENTS</h2>
              <div className="space-y-6">
                <button
                  type="button"
                  className="w-full py-4 px-8 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300"
                >
                  ▶ PLAY
                </button>
                <button
                  type="button"
                  className="w-full py-4 px-8 border-2 border-orange-500 text-orange-400 font-bold rounded-xl hover:bg-orange-500/10 transition-all duration-300"
                >
                  ■ RECORD
                </button>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search tapes..."
                    className="w-full py-4 px-6 bg-orange-950/30 border-2 border-orange-500/30 rounded-xl text-orange-200 placeholder-orange-200/40 outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div className="p-6 bg-orange-950/40 border-2 border-orange-500/30 rounded-xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm text-orange-400 font-mono">REC ●</span>
                  </div>
                  <div className="text-xs text-orange-200/40 font-mono">TAPE 01:23:45</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-gradient-to-br from-orange-950/60 to-red-950/60 border-2 border-orange-500/30 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-red-500" />
                <div className="w-6 h-6 rounded-full bg-yellow-500" />
                <div className="w-6 h-6 rounded-full bg-blue-500" />
              </div>
              <div className="text-xs text-orange-200/40 font-mono">VHS • STEREO</div>
            </div>
            <div className="aspect-video bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-lg border-2 border-orange-500/20 flex items-center justify-center" style={{
              background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 3px)',
            }}>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">NO SIGNAL</div>
                <div className="text-sm text-orange-200/60 font-mono">PLEASE INSERT TAPE</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-2">
                <button type="button" className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded text-sm hover:bg-orange-500/30 transition-colors">
                  ◀◀
                </button>
                <button type="button" className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded text-sm hover:bg-orange-500/30 transition-colors">
                  ▶
                </button>
                <button type="button" className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded text-sm hover:bg-orange-500/30 transition-colors">
                  ▶▶
                </button>
              </div>
              <div className="text-xs text-orange-200/40 font-mono">SP</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
