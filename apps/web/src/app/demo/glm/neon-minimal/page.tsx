import Link from "next/link";

export default function NeonMinimalistArcade() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(10,10,10,0.98),rgba(10,10,10,0.98))]">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99,102,241,0.15) 1px, transparent 0)`,
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="relative z-10">
          <nav className="flex items-center justify-between px-8 py-6 border-b border-indigo-500/20">
            <Link href={"/demo/glm" as any} className="text-indigo-400 hover:text-indigo-300 transition-colors">
              ← Back
            </Link>
            <div className="text-sm text-gray-500 tracking-widest">NEON MINIMAL</div>
          </nav>

          <main className="max-w-7xl mx-auto px-8 py-20">
            <header className="text-center mb-24">
              <h1 className="text-6xl font-light mb-8 tracking-tight text-white">
                Neon Minimalist
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                Clean neon with bold lines, ample whitespace, and refined typography
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
              {[
                { title: "Clean Lines", desc: "Crisp geometric borders" },
                { title: "Minimal Icons", desc: "Reduced visual complexity" },
                { title: "Refined Spacing", desc: "Generous whitespace" },
                { title: "Bold Typography", desc: "Strong typographic hierarchy" },
                { title: "Subtle Glow", desc: "Elegant neon accents" },
                { title: "Negative Space", desc: "Breathing room in design" },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-8 bg-gradient-to-br from-gray-900/50 to-transparent border border-gray-800 hover:border-indigo-500/50 transition-all duration-500 group"
                >
                  <div className="h-px w-12 bg-indigo-500 mb-6 group-hover:w-full transition-all duration-500" />
                  <h3 className="text-lg font-semibold mb-3 text-white tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                <h2 className="text-2xl font-light text-white tracking-tight">Color Palette</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "Deep Indigo", hex: "#1e1b4b" },
                    { name: "Soft Blue", hex: "#3b82f6" },
                    { name: "Vibrant Cyan", hex: "#06b6d4" },
                    { name: "Pure White", hex: "#ffffff" },
                    { name: "Light Gray", hex: "#e5e7eb" },
                    { name: "Dark Surface", hex: "#111827" },
                  ].map((color) => (
                    <div key={color.name} className="space-y-2">
                      <div
                        className="w-full h-20 border border-gray-800 transition-all duration-300 hover:scale-105"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="text-sm text-gray-400 font-light">{color.name}</div>
                      <div className="text-xs text-gray-600 font-mono">{color.hex}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <h2 className="text-2xl font-light text-white tracking-tight">UI Components</h2>
                <div className="space-y-6">
                  <button type="button" className="w-full py-5 px-8 bg-white text-black font-medium tracking-wide hover:bg-indigo-50 transition-all duration-300">
                    Primary Action
                  </button>
                  <button type="button" className="w-full py-5 px-8 border border-gray-700 text-gray-300 font-medium tracking-wide hover:border-indigo-500 hover:text-indigo-400 transition-all duration-300">
                    Secondary Action
                  </button>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter your input"
                      className="w-full py-5 px-8 bg-transparent border-b border-gray-800 text-white placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between py-4 px-6 bg-gray-900/30 border border-gray-800">
                    <span className="text-sm text-gray-400">Status</span>
                    <span className="text-sm text-indigo-400 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20">
                <div className="text-5xl font-light text-indigo-400 mb-4">01</div>
                <h3 className="text-xl font-semibold text-white mb-2">Typography</h3>
                <p className="text-gray-500 text-sm">Clean sans-serif with optimal line heights and generous letter spacing</p>
              </div>
              <div className="p-8 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                <div className="text-5xl font-light text-blue-400 mb-4">02</div>
                <h3 className="text-xl font-semibold text-white mb-2">Spacing</h3>
                <p className="text-gray-500 text-sm">Consistent spacing system using 8px base unit for rhythm</p>
              </div>
              <div className="p-8 bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20">
                <div className="text-5xl font-light text-cyan-400 mb-4">03</div>
                <h3 className="text-xl font-semibold text-white mb-2">Contrast</h3>
                <p className="text-gray-500 text-sm">High contrast ratios ensuring readability at all sizes</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
