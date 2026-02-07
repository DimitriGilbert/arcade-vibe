import Link from "next/link";

export default function CyberpunkArcade() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,27,0.9),rgba(18,18,27,0.9))]">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} />
        </div>

        <div className="relative z-10">
          <nav className="flex items-center justify-between px-8 py-6 border-b border-blue-500/30">
            <Link href={"/demo/glm" as any} className="text-blue-400 hover:text-blue-300 transition-colors">
              ← Back to Proposals
            </Link>
            <div className="text-sm text-blue-400/60">CYBERPUNK ARCADE</div>
          </nav>

          <main className="max-w-7xl mx-auto px-8 py-16">
            <header className="text-center mb-20">
              <h1 className="text-7xl font-bold mb-6 tracking-tight" style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 40px rgba(59,130,246,0.3)',
              }}>
                CYBERPUNK ARCADE
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Neon synthwave aesthetic with electric blue, pink, and purple gradients
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
              {[
                { title: "Glowing Neon", desc: "Vibrant neon borders with gradient effects", color: "from-blue-500 to-purple-500" },
                { title: "Geometric Patterns", desc: "Hexagonal and grid-based layouts", color: "from-purple-500 to-pink-500" },
                { title: "CRT Scan Lines", desc: "Retro monitor visual effects", color: "from-pink-500 to-red-500" },
                { title: "Futuristic Type", desc: "Orbitron-inspired typography", color: "from-cyan-500 to-blue-500" },
                { title: "Electric Gradients", desc: "Multi-color neon transitions", color: "from-green-500 to-cyan-500" },
                { title: "Cyber Borders", desc: "Angular frame designs", color: "from-yellow-500 to-orange-500" },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="relative p-8 bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-500/30 rounded-xl overflow-hidden group hover:scale-105 transition-transform duration-300"
                  style={{
                    boxShadow: '0 0 30px rgba(59,130,246,0.1)',
                  }}
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color}`} />
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">Color Palette</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: "Neon Blue", hex: "#3b82f6" },
                    { name: "Neon Purple", hex: "#8b5cf6" },
                    { name: "Neon Pink", hex: "#ec4899" },
                    { name: "Neon Cyan", hex: "#06b6d4" },
                    { name: "Neon Green", hex: "#22c55e" },
                    { name: "Deep Space", hex: "#12121b" },
                  ].map((color) => (
                    <div key={color.name} className="text-center">
                      <div
                        className="w-full h-24 rounded-lg mb-3 border-2 border-white/10"
                        style={{
                          backgroundColor: color.hex,
                          boxShadow: `0 0 20px ${color.hex}80`,
                        }}
                      />
                      <div className="text-sm text-gray-300">{color.name}</div>
                      <div className="text-xs text-gray-500">{color.hex}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-white mb-6">UI Components</h2>
                <div className="space-y-4">
                  <button type="button" className="w-full py-4 px-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300">
                    Primary Button
                  </button>
                  <button type="button" className="w-full py-4 px-8 border-2 border-pink-500 text-pink-400 font-bold rounded-lg hover:bg-pink-500/10 hover:shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all duration-300">
                    Secondary Button
                  </button>
                  <div className="p-4 bg-gray-900 border border-blue-500/30 rounded-lg">
                    <input
                      type="text"
                      placeholder="Enter text..."
                      className="w-full bg-transparent text-white placeholder-gray-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
