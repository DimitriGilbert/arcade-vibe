import Link from "next/link";
import type { Route } from "next";

export default function ArcadeCabinetPage() {
  return (
    <div className="min-h-screen bg-[#1a1510] relative overflow-hidden">
      {/* Wood texture background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)
          `,
          backgroundSize: '100px 100px, 100% 20px',
        }}
      />

      {/* Arcade floor lighting */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-1/3 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(255, 50, 100, 0.2), transparent)',
        }}
      />

      {/* Main Cabinet Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Cabinet Header */}
        <div 
          className="w-full max-w-4xl mb-4 p-6 text-center"
          style={{
            background: 'linear-gradient(180deg, #2a2520, #1a1510)',
            border: '4px solid #3a3530',
            borderBottom: 'none',
            borderRadius: '20px 20px 0 0',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), 0 -10px 40px rgba(255, 50, 100, 0.2)',
          }}
        >
          <h1 
            className="text-4xl md:text-6xl font-black tracking-tighter"
            style={{
              background: 'linear-gradient(180deg, #ffeb3b 0%, #ff9800 50%, #f44336 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(255, 152, 0, 0.5))',
              textShadow: '0 0 0 rgba(0,0,0,0)',
            }}
          >
            ARCADE ZONE
          </h1>
          <div className="mt-2 text-[#ff9800] font-bold tracking-[0.5em] text-sm">
            INSERT COIN TO PLAY
          </div>
        </div>

        {/* CRT Screen Container */}
        <div 
          className="w-full max-w-4xl relative"
          style={{
            background: '#0a0a0a',
            border: '20px solid #2a2520',
            borderRadius: '40px',
            boxShadow: `
              inset 0 0 100px rgba(0,0,0,0.8),
              0 0 0 10px #1a1510,
              0 0 0 14px #3a3530,
              0 20px 60px rgba(0,0,0,0.8)
            `,
          }}
        >
          {/* Screen bezel */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-[20px]"
            style={{
              boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)',
              border: '2px solid #1a1a1a',
            }}
          />

          {/* CRT Screen Content */}
          <div className="relative p-8 md:p-12 min-h-[500px] overflow-hidden">
            {/* Screen glow */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(100, 200, 255, 0.1) 0%, transparent 70%)',
              }}
            />

            {/* Scanlines */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 2px, transparent 2px, transparent 4px)',
                backgroundSize: '100% 4px',
              }}
            />

            {/* Game Content */}
            <div className="relative z-10">
              {/* Player Select */}
              <div className="text-center mb-12">
                <h2 
                  className="text-3xl md:text-5xl font-black mb-4"
                  style={{
                    color: '#00ff88',
                    textShadow: '0 0 20px #00ff88, 0 0 40px #00ff88',
                  }}
                >
                  PLAYER SELECT
                </h2>
                <div className="text-[#00ff88]/60 font-mono text-sm animate-pulse">
                  PRESS START BUTTON
                </div>
              </div>

              {/* Character Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {[
                  { name: "BLAZE", color: "#ff3366", icon: "🔥" },
                  { name: "FROST", color: "#33ccff", icon: "❄️" },
                  { name: "SHOCK", color: "#ffcc00", icon: "⚡" },
                  { name: "VENOM", color: "#9933ff", icon: "☠️" },
                ].map((char) => (
                  <div 
                    key={char.name}
                    className="group relative p-4 text-center cursor-pointer transition-all hover:scale-110"
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: `2px solid ${char.color}40`,
                    }}
                  >
                    <div 
                      className="text-5xl mb-2 transition-transform group-hover:scale-125"
                      style={{ filter: `drop-shadow(0 0 10px ${char.color})` }}
                    >
                      {char.icon}
                    </div>
                    <div 
                      className="font-black text-sm tracking-wider"
                      style={{ color: char.color }}
                    >
                      {char.name}
                    </div>
                    {/* Selection border on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        border: `3px solid ${char.color}`,
                        boxShadow: `inset 0 0 20px ${char.color}50, 0 0 20px ${char.color}`,
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Game Stats */}
              <div className="flex justify-center gap-12 text-center">
                <div>
                  <div 
                    className="text-3xl font-black mb-1"
                    style={{
                      color: '#ffcc00',
                      textShadow: '0 0 10px #ffcc00',
                    }}
                  >
                    HIGH SCORE
                  </div>
                  <div className="text-[#ffcc00]/80 font-mono text-xl">
                    999,999
                  </div>
                </div>
                <div>
                  <div 
                    className="text-3xl font-black mb-1"
                    style={{
                      color: '#ff3366',
                      textShadow: '0 0 10px #ff3366',
                    }}
                  >
                    CREDITS
                  </div>
                  <div className="text-[#ff3366]/80 font-mono text-xl">
                    00
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div 
          className="w-full max-w-4xl p-8 mt-4"
          style={{
            background: 'linear-gradient(180deg, #2a2520, #1a1510)',
            border: '4px solid #3a3530',
            borderTop: 'none',
            borderRadius: '0 0 20px 20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Joystick */}
            <div className="flex items-center gap-4">
              <div 
                className="w-24 h-24 rounded-full relative"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #ff4444, #cc0000)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 -5px 10px rgba(0,0,0,0.3)',
                }}
              >
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #ff6666, #aa0000)',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
              <span className="text-[#8b7355] font-bold tracking-widest">JOYSTICK</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-6">
              {[
                { label: "A", color: "#ff3366" },
                { label: "B", color: "#ffcc00" },
                { label: "C", color: "#33ccff" },
              ].map((btn) => (
                <div key={btn.label} className="flex flex-col items-center gap-2">
                  <div 
                    className="w-16 h-16 rounded-full relative cursor-pointer transition-transform active:scale-95"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${btn.color}, ${btn.color}99)`,
                      boxShadow: `0 10px 30px rgba(0,0,0,0.5), inset 0 -5px 10px rgba(0,0,0,0.3), 0 0 20px ${btn.color}50`,
                    }}
                  >
                    <span 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-white text-lg"
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                    >
                      {btn.label}
                    </span>
                  </div>
                  <span className="text-[#8b7355] font-bold text-sm">{btn.label}</span>
                </div>
              ))}
            </div>

            {/* Coin Slot */}
            <div className="flex items-center gap-4">
              <span className="text-[#8b7355] font-bold tracking-widest">COIN</span>
              <div 
                className="w-12 h-16 rounded"
                style={{
                  background: 'linear-gradient(90deg, #1a1a1a, #333, #1a1a1a)',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
                }}
              >
                <div 
                  className="w-full h-2 mt-4"
                  style={{
                    background: 'linear-gradient(90deg, #000, #444, #000)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <Link 
          href={"/demo/kimi" as Route}
          className="mt-12 text-[#8b7355] hover:text-[#ff9800] transition-colors font-bold tracking-widest"
        >
          ← RETURN TO ARCADE LOBBY
        </Link>
      </div>
    </div>
  );
}
