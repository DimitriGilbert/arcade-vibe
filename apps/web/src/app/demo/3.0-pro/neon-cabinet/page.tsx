export default function NeonCabinetPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Cabinet Frame */}
      <div className="relative w-full max-w-4xl bg-cabinet rounded-3xl p-8 border-4 border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_100px_rgba(0,0,0,0.9)]">
        
        {/* Marquee */}
        <div className="h-24 bg-gradient-to-r from-neon-pink to-neon-purple rounded-t-xl mb-8 flex items-center justify-center border-b-4 border-black shadow-[0_0_20px_var(--color-neon-pink)] relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-multiply"></div>
             <h1 className="font-display text-5xl text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] z-10 tracking-widest italic transform -skew-x-6">
               NEON FIGHTER
             </h1>
        </div>
        
        {/* Screen Bezel */}
        <div className="bg-gray-900 rounded-lg p-6 border-8 border-gray-800 shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative">
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-gray-600 font-mono text-xs tracking-[0.5em]">HIGH SCORE 999999</div>
            
            {/* The CRT Screen */}
            <div className="aspect-video bg-arcade-deep rounded overflow-hidden relative border border-white/5 shadow-[0_0_15px_rgba(100,200,255,0.1)]">
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-32 h-32 border-4 border-neon-cyan rounded-full animate-spin-slow flex items-center justify-center shadow-[0_0_30px_var(--color-neon-cyan)]">
                        <div className="w-20 h-20 bg-neon-pink rounded-full animate-pulse shadow-[0_0_20px_var(--color-neon-pink)]"></div>
                    </div>
                    <h2 className="mt-8 font-display text-4xl text-neon-green animate-bounce">INSERT COIN</h2>
                    <div className="mt-4 flex gap-4">
                        <div className="w-16 h-4 bg-red-500/20 rounded animate-pulse delay-75"></div>
                        <div className="w-16 h-4 bg-blue-500/20 rounded animate-pulse delay-150"></div>
                        <div className="w-16 h-4 bg-yellow-500/20 rounded animate-pulse delay-300"></div>
                    </div>
                 </div>
                 
                 {/* Internal Scanlines */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
            </div>
        </div>
        
        {/* Control Panel */}
        <div className="mt-8 bg-gray-800 rounded-b-xl p-6 border-t-4 border-black flex justify-between items-center shadow-[inset_0_5px_10px_rgba(0,0,0,0.5)]">
            <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-red-600 border-b-4 border-red-800 shadow-lg active:border-b-0 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center">
                    <span className="text-red-900 font-bold font-mono">A</span>
                </div>
                <div className="w-16 h-16 rounded-full bg-blue-600 border-b-4 border-blue-800 shadow-lg active:border-b-0 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center mt-4">
                     <span className="text-blue-900 font-bold font-mono">B</span>
                </div>
            </div>
            
            <div className="flex flex-col items-center">
                <div className="text-gray-500 font-mono text-xs mb-2">PLAYER 1</div>
                <div className="w-8 h-8 bg-white/10 rounded-full border border-white/20 animate-pulse"></div>
            </div>

             <div className="w-32 h-32 bg-black rounded-full border-4 border-gray-700 relative flex items-center justify-center shadow-inner">
                <div className="w-12 h-12 bg-gray-600 rounded-full shadow-lg transform -translate-y-4 cursor-grab active:cursor-grabbing border-b-4 border-gray-800"></div>
             </div>
        </div>

      </div>
    </div>
  );
}
