import Link from "next/link";
import type { Route } from "next";

export default function MiamiVicePage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#fdf6f0' }}>
      {/* Sunset gradient background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #ffd6e7 0%, #ffcfd2 30%, #f9c6d0 50%, #ffaaa5 70%, #ff8fa3 85%, #ff6b9d 100%)',
          opacity: 0.3,
        }}
      />
      
      {/* Palm tree silhouettes */}
      <div className="fixed bottom-0 left-0 w-64 h-96 opacity-20 pointer-events-none">
        <svg viewBox="0 0 200 300" fill="currentColor" className="text-teal-600">
          <title>Palm tree decoration</title>
          <path d="M100 280 Q 90 200 100 150 Q 70 120 40 140 Q 60 100 100 130 Q 130 90 160 120 Q 140 100 100 130 Q 120 80 100 40 Q 80 80 100 130 Q 60 100 40 60 Q 70 90 100 130 Q 130 90 150 50 Q 130 100 100 150 Q 100 200 110 280 Z" />
        </svg>
      </div>
      <div className="fixed bottom-0 right-20 w-48 h-80 opacity-15 pointer-events-none">
        <svg viewBox="0 0 200 300" fill="currentColor" className="text-teal-600">
          <title>Palm tree decoration</title>
          <path d="M100 280 Q 90 200 100 150 Q 70 120 40 140 Q 60 100 100 130 Q 130 90 160 120 Q 140 100 100 130 Q 120 80 100 40 Q 80 80 100 130 Q 60 100 40 60 Q 70 90 100 130 Q 130 90 150 50 Q 130 100 100 150 Q 100 200 110 280 Z" />
        </svg>
      </div>

      {/* Grid overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 245, 212, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 245, 212, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 px-8 py-6 flex justify-between items-center">
        <div 
          className="font-black text-2xl tracking-tighter"
          style={{ 
            background: 'linear-gradient(135deg, #ff6b9d, #00f5d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          MIAMI VICE ARCADE
        </div>
        <div className="flex gap-8">
          {["GAMES", "SCORES", "SHOP"].map((item) => (
            <Link
              key={item}
              href={"/" as Route}
              className="font-bold text-sm tracking-widest text-[#5a5a5a] hover:text-[#ff6b9d] transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Main Title */}
          <div className="text-center mb-16">
            <div 
              className="inline-block px-6 py-2 mb-6 rounded-full font-bold text-sm tracking-widest"
              style={{ 
                background: 'linear-gradient(135deg, #ff6b9d20, #00f5d420)',
                border: '2px solid #ff6b9d40',
                color: '#ff6b9d',
              }}
            >
              SUMMER OF 1986
            </div>
            <h1 
              className="text-6xl md:text-8xl font-black mb-6 tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #ff6b9d 0%, #ff8fa3 30%, #ffcfd2 50%, #a2d2ff 70%, #00f5d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 10px 30px rgba(255, 107, 157, 0.3))',
              }}
            >
              VICE CITY
            </h1>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: '#7a7a7a' }}>
              Where pastel sunsets meet neon nights. Experience the golden era of arcade gaming.
            </p>
          </div>

          {/* Game Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              { 
                title: "PASTEL RACER", 
                desc: "High-speed neon racing", 
                color1: "#ff6b9d", 
                color2: "#ff8fa3",
                icon: "🏎️"
              },
              { 
                title: "TURQUOISE DREAM", 
                desc: "Underwater adventure", 
                color1: "#00f5d4", 
                color2: "#a2d2ff",
                icon: "🐠"
              },
              { 
                title: "SUNSET STRIKER", 
                desc: "Beach combat classic", 
                color1: "#ffaaa5", 
                color2: "#ffcfd2",
                icon: "🌅"
              },
            ].map((game) => (
              <div
                key={game.title}
                className="group relative p-8 rounded-3xl transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                style={{
                  background: '#ffffff',
                  boxShadow: `0 20px 60px ${game.color1}20, 0 0 0 1px ${game.color1}20`,
                }}
              >
                {/* Decorative circle */}
                <div 
                  className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"
                  style={{ background: `linear-gradient(135deg, ${game.color1}, ${game.color2})` }}
                />
                
                <div className="text-5xl mb-6">{game.icon}</div>
                
                <h3 
                  className="text-2xl font-black mb-3 tracking-tight"
                  style={{ color: game.color1 }}
                >
                  {game.title}
                </h3>
                <p className="text-gray-500 mb-6">{game.desc}</p>
                
                <button
                  type="button"
                  className="w-full py-4 rounded-xl font-bold text-white transition-all duration-300 group-hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${game.color1}, ${game.color2})`,
                    boxShadow: `0 10px 30px ${game.color1}40`,
                  }}
                >
                  PLAY NOW
                </button>
              </div>
            ))}
          </div>

          {/* Stats Section - Retro Style */}
          <div 
            className="rounded-3xl p-12 mb-20 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #2a2a3a, #1a1a2e)',
            }}
          >
            {/* Decorative elements */}
            <div 
              className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #ff6b9d, transparent 70%)' }}
            />
            <div 
              className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #00f5d4, transparent 70%)' }}
            />
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "1986", label: "YEAR", color: "#ff6b9d" },
                { value: "256", label: "GAMES", color: "#00f5d4" },
                { value: "∞", label: "FUN", color: "#ffaaa5" },
                { value: "24/7", label: "OPEN", color: "#a2d2ff" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div 
                    className="text-5xl md:text-6xl font-black mb-2"
                    style={{ 
                      color: stat.color,
                      textShadow: `0 0 30px ${stat.color}50`,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-gray-400 font-bold tracking-widest text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="max-w-2xl mx-auto">
            <h2 
              className="text-3xl font-black text-center mb-8 tracking-tight"
              style={{ color: '#ff6b9d' }}
            >
              TOP PLAYERS
            </h2>
            <div className="space-y-4">
              {[
                { rank: 1, name: "CROCKETT", score: "2,999,990", color: "#ff6b9d" },
                { rank: 2, name: "TUBBS", score: "2,456,780", color: "#00f5d4" },
                { rank: 3, name: "GINA", score: "1,987,650", color: "#ffaaa5" },
                { rank: 4, name: "TRUDY", score: "1,543,210", color: "#a2d2ff" },
                { rank: 5, name: "ZITO", score: "987,654", color: "#ffd6e7" },
              ].map((player) => (
                <div
                  key={player.name}
                  className="flex items-center justify-between p-6 rounded-2xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: '#ffffff',
                    boxShadow: `0 4px 20px ${player.color}15`,
                  }}
                >
                  <div className="flex items-center gap-6">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg"
                      style={{ 
                        background: `${player.color}20`,
                        color: player.color,
                      }}
                    >
                      {player.rank}
                    </div>
                    <span className="font-bold text-lg text-gray-700 tracking-wide">{player.name}</span>
                  </div>
                  <span 
                    className="font-mono text-xl font-bold"
                    style={{ color: player.color }}
                  >
                    {player.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-12 mt-20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-gray-400 font-bold tracking-widest text-sm">
            MIAMI VICE ARCADE © 1986
          </div>
          <Link 
            href={"/demo/kimi" as Route}
            className="font-bold text-sm tracking-widest text-[#ff6b9d] hover:text-[#ff8fa3] transition-colors"
          >
            ← BACK TO DEMOS
          </Link>
        </div>
      </footer>
    </div>
  );
}
