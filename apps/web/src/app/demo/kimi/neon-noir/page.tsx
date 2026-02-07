import Link from "next/link";
import type { Route } from "next";

export default function NeonNoirPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Ambient fog layers */}
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-pink-900/10 pointer-events-none" />
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 120%, rgba(236, 72, 153, 0.15), transparent)',
        }}
      />
      
      {/* Rain effect overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
            backgroundSize: '100px 100%',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-8 py-6 flex justify-between items-center border-b border-pink-500/20">
        <div className="font-mono text-pink-500 tracking-[0.3em] text-sm uppercase">
          Neon Noir Arcade
        </div>
        <div className="flex gap-8">
          {["Games", "Scores", "About"].map((item) => (
            <Link
              key={item}
              href={"/" as Route}
              className="font-mono text-xs tracking-widest text-gray-400 hover:text-pink-400 transition-colors uppercase"
            >
              {item}
            </Link>
          ))}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-8 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Title with dramatic lighting */}
          <div className="text-center mb-20">
            <h1 
              className="text-7xl md:text-9xl font-black mb-6 tracking-tighter"
              style={{
                background: 'linear-gradient(180deg, #ff006e 0%, #8338ec 50%, #3a86ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 40px rgba(255, 0, 110, 0.5)) drop-shadow(0 0 80px rgba(131, 56, 236, 0.3))',
              }}
            >
              ARCADE
            </h1>
            <p className="font-mono text-pink-400/70 text-lg tracking-[0.5em] uppercase">
              Enter the Night
            </p>
          </div>

          {/* Feature Cards - Cinematic style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              { title: "CYBER PUNK", subtitle: "2077 Edition", color: "#ff006e" },
              { title: "NEON DREAMS", subtitle: "After Hours", color: "#8338ec" },
              { title: "NIGHT CITY", subtitle: "Open World", color: "#3a86ff" },
            ].map((card) => (
              <div
                key={card.title}
                className="group relative p-8 transition-all duration-500 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.9), rgba(10, 10, 15, 0.95))',
                  border: `1px solid ${card.color}30`,
                  boxShadow: `0 0 30px ${card.color}10, inset 0 1px 0 rgba(255,255,255,0.05)`,
                }}
              >
                {/* Corner accents */}
                <div 
                  className="absolute top-0 left-0 w-8 h-8"
                  style={{ borderTop: `2px solid ${card.color}`, borderLeft: `2px solid ${card.color}` }}
                />
                <div 
                  className="absolute bottom-0 right-0 w-8 h-8"
                  style={{ borderBottom: `2px solid ${card.color}`, borderRight: `2px solid ${card.color}` }}
                />
                
                <div className="font-mono text-xs tracking-widest mb-2" style={{ color: `${card.color}80` }}>
                  {card.subtitle}
                </div>
                <h3 
                  className="text-3xl font-black tracking-tight mb-4"
                  style={{ color: card.color, textShadow: `0 0 20px ${card.color}50` }}
                >
                  {card.title}
                </h3>
                <p className="text-gray-500 font-mono text-sm leading-relaxed">
                  Immerse yourself in the neon-drenched streets of a cyberpunk metropolis where arcade culture thrives underground.
                </p>
                
                {/* Glow effect on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${card.color}10, transparent 70%)`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Scoreboard Section */}
          <div 
            className="p-8 mb-20"
            style={{
              background: 'linear-gradient(90deg, rgba(255, 0, 110, 0.05), rgba(131, 56, 236, 0.05), rgba(58, 134, 255, 0.05))',
              border: '1px solid rgba(255, 0, 110, 0.2)',
            }}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-mono text-pink-500 text-sm tracking-[0.3em] uppercase">High Scores</h2>
              <div className="font-mono text-xs text-gray-500">LIVE DATA</div>
            </div>
            <div className="space-y-4">
              {[
                { rank: "01", name: "NEO", score: "9,999,999", color: "#ff006e" },
                { rank: "02", name: "TRINITY", score: "8,547,230", color: "#8338ec" },
                { rank: "03", name: "MORPHEUS", score: "7,234,890", color: "#3a86ff" },
                { rank: "04", name: "CYPHER", score: "6,123,456", color: "#06ffa5" },
                { rank: "05", name: "TANK", score: "5,000,000", color: "#ffbe0b" },
              ].map((entry) => (
                <div 
                  key={entry.name} 
                  className="flex items-center justify-between py-3 px-4 transition-all hover:bg-white/5"
                  style={{ borderLeft: `2px solid ${entry.color}40` }}
                >
                  <div className="flex items-center gap-6">
                    <span className="font-mono text-xl font-bold" style={{ color: entry.color }}>
                      {entry.rank}
                    </span>
                    <span className="font-mono text-gray-300 tracking-widest">{entry.name}</span>
                  </div>
                  <span className="font-mono text-xl" style={{ color: entry.color, textShadow: `0 0 10px ${entry.color}50` }}>
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <button
              type="button"
              className="group relative px-16 py-6 font-mono text-lg tracking-[0.3em] uppercase transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #ff006e, #8338ec)',
                boxShadow: '0 0 40px rgba(255, 0, 110, 0.4), 0 0 80px rgba(131, 56, 236, 0.2)',
              }}
            >
              <span className="relative z-10 text-white font-bold">Insert Coin</span>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, #ff1493, #9932cc)',
                  boxShadow: '0 0 60px rgba(255, 0, 110, 0.6), 0 0 100px rgba(131, 56, 236, 0.4)',
                }}
              />
            </button>
            
            <div className="mt-8 font-mono text-xs text-gray-600 tracking-widest">
              PRESS START TO CONTINUE
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-12 border-t border-pink-500/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="font-mono text-xs text-gray-600 tracking-widest">
            NEON NOIR ARCADE 2025
          </div>
          <Link 
            href={"/demo/kimi" as Route}
            className="font-mono text-xs text-pink-500/50 hover:text-pink-400 transition-colors tracking-widest"
          >
            ← BACK TO DEMOS
          </Link>
        </div>
      </footer>
    </div>
  );
}
