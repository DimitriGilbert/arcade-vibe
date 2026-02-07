export default function RetroWavePage() {
  return (
    <div className="min-h-screen bg-[#2b0f3a] relative overflow-hidden flex flex-col items-center">
      
      {/* Sun */}
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-t from-yellow-500 via-orange-500 to-pink-500 shadow-[0_0_100px_rgba(255,100,0,0.5)]">
         {/* Stripes on sun */}
         <div className="absolute bottom-0 w-full h-[50%] flex flex-col justify-end gap-2">
            <div className="h-2 bg-[#2b0f3a] w-full"></div>
            <div className="h-3 bg-[#2b0f3a] w-full"></div>
            <div className="h-4 bg-[#2b0f3a] w-full"></div>
            <div className="h-6 bg-[#2b0f3a] w-full"></div>
            <div className="h-8 bg-[#2b0f3a] w-full"></div>
         </div>
      </div>
      
      {/* Grid Floor */}
      <div className="absolute bottom-0 w-full h-1/3 perspective-500 bg-[#1a0b2e]">
         <div className="absolute inset-0 transform-style-3d rotate-x-60 origin-top bg-[linear-gradient(rgba(255,0,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,255,0.3)_1px,transparent_1px)] bg-[size:40px_40px] animate-[scan-line_2s_linear_infinite] shadow-[0_-50px_100px_rgba(255,0,255,0.2)]"></div>
         {/* Mountains */}
         <div className="absolute -top-32 w-full flex justify-between px-20 opacity-80">
            <div className="w-0 h-0 border-l-[100px] border-l-transparent border-b-[150px] border-b-[#120524] border-r-[100px] border-r-transparent"></div>
            <div className="w-0 h-0 border-l-[150px] border-l-transparent border-b-[200px] border-b-[#150629] border-r-[150px] border-r-transparent -ml-32"></div>
            <div className="flex-1"></div>
            <div className="w-0 h-0 border-l-[120px] border-l-transparent border-b-[180px] border-b-[#120524] border-r-[120px] border-r-transparent"></div>
         </div>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-32 text-center w-full max-w-4xl px-4">
        <h1 className="font-display text-7xl md:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-pink-300 drop-shadow-[4px_4px_0_var(--color-neon-purple)] transform -skew-x-12">
          MIAMI <span className="text-5xl md:text-7xl block text-neon-cyan drop-shadow-[4px_4px_0_var(--color-neon-blue)]">NIGHTS</span>
        </h1>
        
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-black/30 backdrop-blur-md border border-pink-500/30 rounded-xl p-8 transform hover:-translate-y-2 transition-transform duration-300 shadow-[0_10px_30px_rgba(255,0,255,0.2)]">
                <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-purple-500 mb-6"></div>
                <h3 className="font-body text-2xl font-bold text-white mb-2">CRUISE MODE</h3>
                <p className="text-pink-200/70 mb-6">Relax and enjoy the infinite drive.</p>
                <button className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-pink-500/50 transition-shadow">
                    START ENGINE
                </button>
            </div>
            
             <div className="bg-black/30 backdrop-blur-md border border-cyan-500/30 rounded-xl p-8 transform hover:-translate-y-2 transition-transform duration-300 shadow-[0_10px_30px_rgba(0,255,255,0.2)]">
                <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-blue-500 mb-6"></div>
                <h3 className="font-body text-2xl font-bold text-white mb-2">TURBO BOOST</h3>
                <p className="text-cyan-200/70 mb-6">Maximum velocity through the grid.</p>
                <button className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg hover:shadow-cyan-500/50 transition-shadow">
                    ENGAGE
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
