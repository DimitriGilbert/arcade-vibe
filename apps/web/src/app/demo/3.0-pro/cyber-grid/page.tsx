export default function CyberGridPage() {
  return (
    <div className="min-h-screen bg-arcade-deep relative overflow-hidden flex flex-col items-center justify-center perspective-1000">
      
      {/* 3D Grid Floor */}
      <div className="absolute inset-0 transform-style-3d rotate-x-60 scale-150 origin-bottom opacity-30">
        <div className="w-[200vw] h-[200vh] -ml-[50vw] arcade-grid animate-scroll"></div>
      </div>

      <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-arcade-deep to-transparent z-10"></div>
      <div className="absolute bottom-0 w-full h-64 bg-gradient-to-t from-arcade-deep to-transparent z-10"></div>

      {/* Content */}
      <div className="relative z-20 max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="group relative bg-black/40 backdrop-blur-sm border border-neon-blue/30 p-8 rounded-none hover:border-neon-blue transition-all duration-500 overflow-hidden">
             {/* Corner Accents */}
             <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-blue"></div>
             <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-blue"></div>
             <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-blue"></div>
             <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-blue"></div>
             
             <div className="absolute inset-0 bg-neon-blue/5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>

             <h3 className="font-display text-3xl text-neon-blue mb-4 tracking-tighter">
               DATA_NODE_0{i}
             </h3>
             <div className="space-y-2 font-mono text-sm text-neon-blue/70">
                <div className="flex justify-between">
                    <span>STATUS</span>
                    <span className="text-white">ONLINE</span>
                </div>
                <div className="w-full h-1 bg-neon-blue/20 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-blue w-2/3 animate-pulse"></div>
                </div>
                <p className="mt-4 leading-relaxed">
                  Initializing secure connection protocol. 
                  Encryption level: QUANTUM. 
                  Latency: 2ms.
                </p>
             </div>
             
             <button className="mt-8 w-full py-3 bg-neon-blue/10 border border-neon-blue/50 text-neon-blue font-bold tracking-widest hover:bg-neon-blue hover:text-black transition-all uppercase text-xs">
                Access System
             </button>
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-12 left-0 right-0 text-center">
         <div className="inline-block border border-neon-blue/30 px-6 py-2 bg-black/50 backdrop-blur text-neon-blue font-mono text-xs">
            SYSTEM_READY // AWAITING_INPUT
         </div>
      </div>
    </div>
  );
}
