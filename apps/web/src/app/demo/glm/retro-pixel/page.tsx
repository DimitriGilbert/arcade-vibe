import Link from "next/link";

export default function RetroPixelArcade() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] font-mono">
      <div className="relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(26,26,46,0.95),rgba(26,26,46,0.95))]">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `linear-gradient(90deg, rgba(74,222,128,0.2) 4px, transparent 4px), linear-gradient(rgba(74,222,128,0.2) 4px, transparent 4px)`,
            backgroundSize: '8px 8px',
          }} />
        </div>

        <div className="relative z-10">
          <nav className="flex items-center justify-between px-8 py-6 border-b-4 border-green-500">
            <Link href={"/demo/glm" as any} className="text-green-400 hover:text-green-300 transition-colors">
              ← BACK
            </Link>
            <div className="text-sm text-green-400/60">PIXEL ARCADE v1.0</div>
          </nav>

          <main className="max-w-7xl mx-auto px-8 py-16">
            <header className="text-center mb-20">
              <h1 className="text-6xl font-bold mb-6 text-green-400 tracking-widest" style={{
                textShadow: '4px 4px 0 #000, 0 0 20px rgba(74,222,128,0.5)',
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
              }}>
                RETRO PIXEL
              </h1>
              <p className="text-xl text-yellow-400 max-w-2xl mx-auto" style={{ fontFamily: 'monospace' }}>
                [ 8-BIT NOSTALGIA MODE ACTIVATED ]
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {[
                { title: "PIXEL FONTS", desc: "8-bit typography style", color: "bg-green-500" },
                { title: "BLOCKY UI", desc: "Rectangular elements", color: "bg-yellow-500" },
                { title: "RETRO PALETTE", desc: "GameBoy inspired", color: "bg-blue-500" },
                { title: "SPRITE ART", desc: "Animated sprites", color: "bg-red-500" },
                { title: "DITHERING", desc: "Classic pixel effects", color: "bg-purple-500" },
                { title: "SCANLINES", desc: "CRT display feel", color: "bg-pink-500" },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="p-6 bg-gray-900 border-4 border-gray-700 hover:border-green-500 transition-colors"
                  style={{ boxShadow: '4px 4px 0 #000' }}
                >
                  <div className={`h-2 w-full ${feature.color} mb-4`} style={{ imageRendering: 'pixelated' }} />
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-green-400 mb-6">COLOR PALETTE</h2>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { name: "GB DARK", hex: "#0f380f", text: "text-green-400" },
                    { name: "GB MID", hex: "#306230", text: "text-green-500" },
                    { name: "GB LIGHT", hex: "#8bac0f", text: "text-green-300" },
                    { name: "GB BRIGHT", hex: "#9bbc0f", text: "text-green-200" },
                    { name: "NES RED", hex: "#ff0000", text: "text-red-400" },
                    { name: "NES BLUE", hex: "#0000ff", text: "text-blue-400" },
                    { name: "NES YELLOW", hex: "#ffcc00", text: "text-yellow-400" },
                    { name: "NES WHITE", hex: "#ffffff", text: "text-white" },
                  ].map((color) => (
                    <div key={color.name} className="text-center">
                      <div
                        className="w-full h-20 border-4 border-gray-700 mb-2"
                        style={{ backgroundColor: color.hex, imageRendering: 'pixelated' }}
                      />
                      <div className={`text-xs ${color.text} font-bold`}>{color.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-green-400 mb-6">UI COMPONENTS</h2>
                <div className="space-y-4">
                  <button type="button" className="w-full py-4 px-8 bg-green-500 text-black font-bold border-4 border-green-600 hover:bg-green-400 transition-colors" style={{ boxShadow: '4px 4px 0 #000' }}>
                    START GAME
                  </button>
                  <button type="button" className="w-full py-4 px-8 bg-gray-800 text-yellow-400 font-bold border-4 border-yellow-500 hover:bg-yellow-500/20 transition-colors" style={{ boxShadow: '4px 4px 0 #000' }}>
                    OPTIONS
                  </button>
                  <div className="p-4 bg-gray-900 border-4 border-gray-700">
                    <input
                      type="text"
                      placeholder="ENTER PLAYER NAME_"
                      className="w-full bg-transparent text-green-400 font-mono text-lg outline-none placeholder-gray-600"
                    />
                  </div>
                  <div className="p-4 bg-gray-900 border-4 border-green-500">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-green-400 font-bold">SCORE</span>
                      <span className="text-white font-bold">999999</span>
                    </div>
                    <div className="w-full h-4 bg-gray-800 border-2 border-gray-600">
                      <div className="h-full bg-green-500" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-20 p-8 bg-gray-900 border-4 border-gray-700" style={{ boxShadow: '8px 8px 0 #000' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                </div>
                <div className="text-xs text-gray-500">SCREEN 1/3</div>
              </div>
              <div className="aspect-video bg-gray-800 flex items-center justify-center border-2 border-gray-600">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">PRESS START</div>
                  <div className="text-sm text-gray-400 animate-pulse">TO BEGIN</div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
