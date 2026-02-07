import Link from "next/link";
import type { Route } from "next";

export default function VaporwaveGridPage() {
  return (
    <div className="min-h-screen bg-[#0d0221] relative overflow-hidden">
      {/* Sun gradient background */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #ff006e 0%, #8338ec 20%, #3a86ff 40%, #0d0221 60%, #0d0221 100%)',
          opacity: 0.4,
        }}
      />

      {/* Grid floor */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-1/2 pointer-events-none"
        style={{
          background: `
            linear-gradient(transparent 0%, #ff006e 100%),
            linear-gradient(90deg, #ff006e 1px, transparent 1px),
            linear-gradient(0deg, #ff006e 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 80px 80px, 80px 80px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom',
          opacity: 0.3,
        }}
      />

      {/* Floating geometric shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating triangles */}
        <div 
          className="absolute top-20 left-10 w-32 h-32 opacity-20"
          style={{
            background: 'linear-gradient(135deg, #ff006e, transparent)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            animation: 'float-1 8s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute top-40 right-20 w-24 h-24 opacity-20"
          style={{
            background: 'linear-gradient(135deg, #00f5d4, transparent)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            animation: 'float-2 10s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute bottom-40 left-1/4 w-40 h-40 opacity-10"
          style={{
            background: 'linear-gradient(135deg, #8338ec, transparent)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            animation: 'float-3 12s ease-in-out infinite',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-8 py-6 flex justify-between items-center">
        <div 
          className="text-2xl font-black tracking-widest"
          style={{
            color: '#ff006e',
            textShadow: '0 0 20px #ff006e, 0 0 40px #ff006e',
          }}
        >
          VAPORWAVE
        </div>
        <div className="flex gap-8">
          {["AESTHETICS", "GAMES", "ABOUT"].map((item) => (
            <Link
              key={item}
              href={"/" as Route}
              className="text-sm tracking-[0.3em] transition-all hover:scale-110"
              style={{ color: '#00f5d4' }}
            >
              {item}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            {/* Decorative line */}
            <div 
              className="w-full h-px mb-12"
              style={{
                background: 'linear-gradient(90deg, transparent, #ff006e, #8338ec, #3a86ff, transparent)',
              }}
            />
            
            <h1 
              className="text-6xl md:text-9xl font-black mb-4 tracking-tighter"
              style={{
                background: 'linear-gradient(180deg, #ff006e 0%, #8338ec 50%, #3a86ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 40px rgba(255, 0, 110, 0.5))',
              }}
            >
              レトロ
            </h1>
            <p 
              className="text-2xl md:text-4xl font-light tracking-[0.5em] mb-8"
              style={{ color: '#00f5d4' }}
            >
              RETRO FUTURE
            </p>
            
            {/* Decorative line */}
            <div 
              className="w-full h-px mt-12"
              style={{
                background: 'linear-gradient(90deg, transparent, #3a86ff, #8338ec, #ff006e, transparent)',
              }}
            />
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              { 
                title: "MACINTOSH", 
                subtitle: "1984", 
                desc: "Classic computing aesthetics",
                gradient: "from-[#ff006e] to-[#8338ec]"
              },
              { 
                title: "SEGA", 
                subtitle: "1991", 
                desc: "16-bit gaming nostalgia",
                gradient: "from-[#00f5d4] to-[#3a86ff]"
              },
              { 
                title: "WAVE", 
                subtitle: "1995", 
                desc: "Digital dreams realized",
                gradient: "from-[#8338ec] to-[#ff006e]"
              },
            ].map((card) => (
              <div
                key={card.title}
                className="group relative p-8 transition-all duration-500 hover:scale-105"
                style={{
                  background: 'rgba(13, 2, 33, 0.8)',
                  border: '1px solid rgba(255, 0, 110, 0.3)',
                  boxShadow: '0 0 40px rgba(255, 0, 110, 0.1)',
                }}
              >
                {/* Glitch effect corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#ff006e]" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#ff006e]" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#ff006e]" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#ff006e]" />
                
                <div 
                  className="text-xs tracking-[0.5em] mb-2"
                  style={{ color: '#00f5d4' }}
                >
                  {card.subtitle}
                </div>
                <h3 
                  className={`text-3xl font-black mb-4 bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}
                >
                  {card.title}
                </h3>
                <p className="text-gray-400">{card.desc}</p>
                
                {/* Hover glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(255, 0, 110, 0.1), transparent 70%)',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div 
            className="p-12 mb-20 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 0, 110, 0.1), rgba(131, 56, 236, 0.1))',
              border: '1px solid rgba(255, 0, 110, 0.2)',
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "199X", label: "YEAR", color: "#ff006e" },
                { value: "∞", label: "WAVES", color: "#8338ec" },
                { value: "美学", label: "ART", color: "#00f5d4" },
                { value: "84", label: "MHZ", color: "#3a86ff" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div 
                    className="text-4xl md:text-5xl font-black mb-2"
                    style={{ 
                      color: stat.color,
                      textShadow: `0 0 30px ${stat.color}`,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div 
                    className="text-xs tracking-[0.5em]"
                    style={{ color: stat.color, opacity: 0.7 }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Japanese Text Decoration */}
          <div className="text-center mb-20">
            <p 
              className="text-lg tracking-[0.3em] leading-loose max-w-3xl mx-auto"
              style={{ color: '#8338ec' }}
            >
              私たちは過去と未来の間に立っています。
              <br />
              デジタルの夢とアナログの記憶。
            </p>
            <p className="text-gray-500 mt-4 italic">
              We stand between past and future.
              <br />
              Digital dreams and analog memories.
            </p>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              type="button"
              className="group relative px-16 py-6 font-bold text-xl tracking-[0.3em] transition-all duration-300 hover:scale-105"
              style={{
                background: 'transparent',
                border: '2px solid #ff006e',
                color: '#ff006e',
                boxShadow: '0 0 30px rgba(255, 0, 110, 0.3)',
              }}
            >
              <span className="relative z-10">ENTER THE VOID</span>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 0, 110, 0.2), rgba(131, 56, 236, 0.2))',
                  boxShadow: '0 0 60px rgba(255, 0, 110, 0.5)',
                }}
              />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-12 mt-20">
        <div 
          className="w-full h-px mb-8"
          style={{
            background: 'linear-gradient(90deg, transparent, #ff006e, #8338ec, #3a86ff, transparent)',
          }}
        />
        <div className="flex justify-between items-center">
          <div 
            className="text-xs tracking-[0.5em]"
            style={{ color: '#8338ec' }}
          >
            VAPORWAVE_2025
          </div>
          <Link 
            href={"/demo/kimi" as Route}
            className="text-sm tracking-[0.3em] transition-colors hover:text-[#ff006e]"
            style={{ color: '#00f5d4' }}
          >
            ← RETURN
          </Link>
        </div>
      </footer>

      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
