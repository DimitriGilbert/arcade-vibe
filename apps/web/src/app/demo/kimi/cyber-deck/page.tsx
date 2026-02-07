import Link from "next/link";
import type { Route } from "next";

export default function CyberDeckPage() {
  return (
    <div className="min-h-screen bg-[#050a05] relative overflow-hidden font-mono">
      {/* Terminal scanlines */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-20"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
          backgroundSize: '100% 4px',
        }}
      />
      
      {/* CRT curvature effect */}
      <div 
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,10,0,0.4) 90%, rgba(0,10,0,0.6) 100%)',
        }}
      />

      {/* Matrix rain effect (simplified) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5">
        {Array.from({ length: 20 }).map((_, i) => {
          const duration = 5 + Math.random() * 10;
          const delay = Math.random() * 5;
          return (
            <div
              key={`matrix-${i}`}
              className="absolute text-[#00ff41] text-xs whitespace-nowrap animate-matrix-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 100}%`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              }}
            >
              {Array.from({ length: 20 }).map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('')}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <nav className="relative z-30 px-6 py-4 border-b border-[#00ff41]/20 bg-[#050a05]/90">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-[#00ff41] animate-pulse" />
            <span className="text-[#00ff41] tracking-widest">CYBER_DECK_V2.0</span>
          </div>
          <div className="flex gap-6 text-xs">
            {["[SYS]", "[NET]", "[ARC]"].map((item) => (
              <Link
                key={item}
                href={"/" as Route}
                className="text-[#00aa29] hover:text-[#00ff41] transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Terminal Interface */}
      <main className="relative z-30 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Boot sequence header */}
          <div className="mb-8 p-4 border border-[#00ff41]/30 bg-[#00ff41]/5">
            <div className="text-[#00aa29] text-xs mb-2">{`>`} SYSTEM BOOT SEQUENCE INITIATED...</div>
            <div className="text-[#00ff41] text-xs space-y-1">
              <div>{`>`} Loading kernel modules........................ [OK]</div>
              <div>{`>`} Initializing graphics subsystem.............. [OK]</div>
              <div>{`>`} Mounting arcade database..................... [OK]</div>
              <div>{`>`} Establishing secure connection............... [OK]</div>
              <div className="animate-pulse">{`>`} _</div>
            </div>
          </div>

          {/* Main Title */}
          <div className="mb-12">
            <pre className="text-[#00ff41] text-xs md:text-sm leading-none hidden md:block" style={{ textShadow: '0 0 10px #00ff41' }}>
{`
 ██████╗██╗   ██╗██████╗ ███████╗██████╗     ██████╗ ███████╗ ██████╗██╗  ██╗
██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗    ██╔══██╗██╔════╝██╔════╝██║ ██╔╝
██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝    ██║  ██║█████╗  ██║     █████╔╝ 
██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗    ██║  ██║██╔══╝  ██║     ██╔═██╗ 
╚██████╗   ██║   ██████╔╝███████╗██║  ██║    ██████╔╝███████╗╚██████╗██║  ██╗
 ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝    ╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝
`}
            </pre>
            <div className="md:hidden text-3xl font-bold text-[#00ff41]" style={{ textShadow: '0 0 10px #00ff41' }}>
              CYBER_DECK
            </div>
            <div className="text-[#00aa29] text-xs mt-4 tracking-widest">
              ACCESS LEVEL: ROOT | SESSION ID: 0x7F3A9C | ENCRYPTION: AES-256
            </div>
          </div>

          {/* System Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { id: "MOD_01", name: "NEURAL_NET", status: "ONLINE", load: "34%", color: "#00ff41" },
              { id: "MOD_02", name: "QUANTUM_CPU", status: "ACTIVE", load: "67%", color: "#00ff41" },
              { id: "MOD_03", name: "NEON_CORE", status: "READY", load: "12%", color: "#00ff41" },
            ].map((mod) => (
              <div 
                key={mod.id}
                className="p-6 border border-[#00ff41]/40 bg-[#00ff41]/5 hover:bg-[#00ff41]/10 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[#00aa29] text-xs">{mod.id}</span>
                  <span className="text-[#00ff41] text-xs animate-pulse">●</span>
                </div>
                <div className="text-[#00ff41] text-xl mb-2 tracking-wider">{mod.name}</div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#00aa29]">STATUS: {mod.status}</span>
                  <span className="text-[#00ff41]">LOAD: {mod.load}</span>
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-1 bg-[#003300]">
                  <div 
                    className="h-full bg-[#00ff41] transition-all duration-1000"
                    style={{ width: mod.load }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Game Directory */}
          <div className="border border-[#00ff41]/30 bg-[#00ff41]/5 mb-12">
            <div className="p-4 border-b border-[#00ff41]/30 bg-[#00ff41]/10">
              <span className="text-[#00ff41] tracking-widest">DIRECTORY: /usr/games/arcade/</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "hack_the_planet.exe", type: "SIM", size: "2.4MB" },
                  { name: "neon_overload.bin", type: "ACT", size: "4.8MB" },
                  { name: "cyber_punk.rom", type: "RPG", size: "8.2MB" },
                  { name: "matrix_runner.dat", type: "RAC", size: "3.1MB" },
                ].map((game) => (
                  <div 
                    key={game.name}
                    className="flex items-center gap-4 p-3 border border-[#00ff41]/20 hover:border-[#00ff41]/60 hover:bg-[#00ff41]/5 transition-all cursor-pointer group"
                  >
                    <span className="text-[#00aa29] text-xs">{`>`}</span>
                    <span className="text-[#00ff41] flex-1">{game.name}</span>
                    <span className="text-[#00aa29] text-xs">[{game.type}]</span>
                    <span className="text-[#005500] text-xs group-hover:text-[#00aa29]">{game.size}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Terminal Input */}
          <div className="border border-[#00ff41]/30 p-4">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff41]">root@cyber-deck:~$</span>
              <span className="text-[#00aa29]">execute arcade --mode=immersive</span>
              <span className="w-2 h-4 bg-[#00ff41] animate-pulse" />
            </div>
          </div>

          {/* System Log */}
          <div className="mt-12 p-4 border border-[#00ff41]/20 text-xs space-y-1">
            <div className="text-[#005500]">[2025-02-06 14:32:01] System initialized</div>
            <div className="text-[#00aa29]">[2025-02-06 14:32:02] Loading arcade modules...</div>
            <div className="text-[#00ff41]">[2025-02-06 14:32:03] Arcade system ready</div>
            <div className="text-[#00aa29]">[2025-02-06 14:32:04] Waiting for user input_</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-30 px-6 py-4 border-t border-[#00ff41]/20 mt-12">
        <div className="flex justify-between items-center text-xs text-[#00aa29]">
          <span>CYBER_DECK_SYSTEMS_V2.0.1</span>
          <Link href={"/demo/kimi" as Route} className="hover:text-[#00ff41] transition-colors">
            {`<`} RETURN_TO_MAIN
          </Link>
        </div>
      </footer>

      <style>{`
        @keyframes matrix-fall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .animate-matrix-fall {
          animation: matrix-fall linear infinite;
        }
      `}</style>
    </div>
  );
}
