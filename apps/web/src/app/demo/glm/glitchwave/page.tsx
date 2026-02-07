"use client";
import Link from "next/link";

export default function GlitchwaveArcade() {
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(13,13,13,0.95)] to-[rgba(13,13,13,0.95)]">
        <div
          className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(0deg, rgba(0,255,255,0.03) 0px, transparent 1px, transparent 2px)',
            backgroundSize: '100% 4px',
          }}
        />
      </div>

      <div className="relative z-10 before:absolute before:top-0 before:left-1/2 before:w-[2px] before:h-full before:bg-gradient-to-b before:from-transparent before:via-cyan-500 before:to-transparent">
        <nav className="flex items-center justify-between px-8 py-6 border-b border-cyan-500/30">
          <Link href={"/demo/glm" as any} className="text-cyan-400 hover:text-pink-400 transition-colors font-mono">
            ← BACK
          </Link>
          <div className="text-sm text-cyan-400/60 font-mono tracking-widest">GLITCHWAVE v2.0</div>
        </nav>

        <main className="max-w-7xl mx-auto px-8 py-16">
          <header className="text-center mb-20">
            <h1 className="text-7xl font-bold mb-6 text-white tracking-tighter" style={{
              animation: 'chromatic 0.5s infinite',
              textShadow: '-2px 0 #ff0000, 2px 0 #00ffff',
            }}>
              GLITCHWAVE
            </h1>
            <p className="text-xl text-cyan-400/80 max-w-2xl mx-auto font-mono">
              MODERN GLITCH AESTHETIC WITH CHROMATIC ABERRATION
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              { title: "GLITCH ANIMATIONS", desc: "Digital distortion effects", glitch: true },
              { title: "CHROMATIC", desc: "RGB color splitting", chromatic: true },
              { title: "DIGITAL NOISE", desc: "Static overlay texture", noise: true },
              { title: "SPLIT SCREEN", desc: "Dual-pane layouts", split: true },
              { title: "DATA CORRUPTION", desc: "Glitch text effects", corrupt: true },
              { title: "SIGNAL LOSS", desc: "Connection visuals", signal: true },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`relative p-8 bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-lg overflow-hidden hover:scale-105 transition-all duration-300 ${feature.glitch ? 'hover:animate-[glitch_0.3s_infinite]' : ''}`}
                style={{
                  boxShadow: '0 0 30px rgba(0,255,255,0.1)',
                }}
              >
                {feature.noise && (
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  }} />
                )}
                <h3 className="text-xl font-bold mb-3 text-cyan-400 font-mono">
                  {feature.title}
                </h3>
                <p className="text-gray-400 font-mono text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-cyan-400 mb-6 font-mono tracking-tight">COLOR PALETTE</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "CYAN", hex: "#00ffff", glow: "rgba(0,255,255,0.5)" },
                  { name: "PINK", hex: "#ff00ff", glow: "rgba(255,0,255,0.5)" },
                  { name: "BLACK", hex: "#000000", glow: "rgba(0,0,0,0.3)" },
                  { name: "WHITE", hex: "#ffffff", glow: "rgba(255,255,255,0.5)" },
                  { name: "RED", hex: "#ff0000", glow: "rgba(255,0,0,0.5)" },
                  { name: "GRAY", hex: "#1a1a1a", glow: "rgba(0,255,255,0.2)" },
                ].map((color) => (
                  <div key={color.name} className="text-center">
                    <div
                      className="w-full h-24 rounded mb-3 border border-gray-800"
                      style={{
                        backgroundColor: color.hex,
                        boxShadow: `0 0 20px ${color.glow}`,
                      }}
                    />
                    <div className="text-sm text-gray-300 font-mono">{color.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{color.hex}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-cyan-400 mb-6 font-mono tracking-tight">UI COMPONENTS</h2>
              <div className="space-y-4">
                <button
                  type="button"
                  className="w-full py-4 px-8 bg-gradient-to-r from-cyan-500 to-pink-500 text-black font-bold font-mono tracking-widest hover:shadow-[0_0_40px_rgba(0,255,255,0.6)] transition-all duration-300"
                >
                  INITIATE
                </button>
                <button
                  type="button"
                  className="w-full py-4 px-8 border-2 border-cyan-500 text-cyan-400 font-bold font-mono tracking-widest hover:bg-cyan-500/10 hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] transition-all duration-300"
                >
                  ABORT
                </button>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ENTER COMMAND_"
                    className="w-full py-4 px-8 bg-black/80 border-2 border-gray-800 text-cyan-400 font-mono tracking-widest outline-none placeholder-gray-600 focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-600">█</div>
                </div>
                <div className="p-6 bg-black/80 border-2 border-pink-500/50 font-mono">
                  <div className="text-pink-400 text-sm mb-2">SYSTEM STATUS</div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-cyan-400 animate-pulse" />
                    <span className="text-cyan-400 text-xs">OPERATIONAL</span>
                  </div>
                  <div className="text-gray-500 text-xs">0x7F8A 0x3C2B 0x9E4D</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 p-8 bg-black/80 border-2 border-cyan-500/30">
            <div className="flex items-center justify-between mb-6">
              <div className="text-cyan-400 font-mono text-sm">TERMINAL OUTPUT</div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
            </div>
            <div className="font-mono text-sm space-y-2">
              <div className="text-gray-500">&gt; Initializing glitchwave protocol...</div>
              <div className="text-cyan-400">&gt; Loading visual effects modules</div>
              <div className="text-pink-400">&gt; Applying chromatic aberration</div>
              <div className="text-gray-500">&gt; System ready for deployment</div>
              <div className="flex items-center text-cyan-400">
                <span className="mr-2">&gt;</span>
                <span className="animate-pulse">_</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
