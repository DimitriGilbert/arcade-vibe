export default function PixelArcadePage() {
  return (
    <div className="min-h-screen bg-[#202020] flex items-center justify-center p-8 font-mono">
      <div className="w-full max-w-5xl">
        
        {/* Header Block */}
        <div className="bg-neon-green p-1 mb-8 shadow-[8px_8px_0_black]">
            <div className="bg-black p-4 text-center border-4 border-white">
                <h1 className="text-4xl md:text-6xl text-white tracking-widest animate-pulse">
                    PIXEL<span className="text-neon-green">_</span>WARS
                </h1>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8">
                <div className="bg-blue-600 p-1 shadow-[8px_8px_0_black] transform transition-transform hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0_black]">
                     <div className="bg-black p-6 border-2 border-white min-h-[200px] flex flex-col justify-between">
                         <div>
                            <h2 className="text-white text-xl mb-4 border-b-2 border-white pb-2">STATS</h2>
                            <div className="flex justify-between text-yellow-400 mb-2">
                                <span>LVL</span>
                                <span>99</span>
                            </div>
                            <div className="flex justify-between text-green-400 mb-2">
                                <span>HP</span>
                                <span>[||||||||||]</span>
                            </div>
                            <div className="flex justify-between text-blue-400">
                                <span>MP</span>
                                <span>[||||||    ]</span>
                            </div>
                         </div>
                     </div>
                </div>
                
                <div className="bg-red-600 p-1 shadow-[8px_8px_0_black]">
                     <div className="bg-black p-6 border-2 border-white">
                         <h2 className="text-white text-xl mb-4 border-b-2 border-white pb-2">INVENTORY</h2>
                         <div className="grid grid-cols-4 gap-2">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="aspect-square bg-gray-800 border border-gray-600 hover:bg-white/20 cursor-pointer"></div>
                            ))}
                         </div>
                     </div>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="lg:col-span-8">
                <div className="bg-white p-1 shadow-[8px_8px_0_black] h-full">
                    <div className="bg-black h-full border-4 border-black p-8 relative overflow-hidden">
                        {/* Background Stars */}
                        <div className="absolute top-10 left-10 w-2 h-2 bg-white"></div>
                        <div className="absolute top-40 left-80 w-2 h-2 bg-white"></div>
                        <div className="absolute bottom-20 right-20 w-2 h-2 bg-white"></div>
                        
                        {/* Hero */}
                        <div className="absolute bottom-32 left-32 w-16 h-16 bg-blue-500 shadow-[4px_0_0_black,-4px_0_0_black,0_-4px_0_black,0_4px_0_black] animate-bounce">
                             <div className="absolute top-4 left-4 w-2 h-2 bg-black"></div>
                             <div className="absolute top-4 right-4 w-2 h-2 bg-black"></div>
                        </div>

                        {/* Enemy */}
                         <div className="absolute top-32 right-32 w-16 h-16 bg-red-500 shadow-[4px_0_0_black,-4px_0_0_black,0_-4px_0_black,0_4px_0_black] animate-pulse">
                             <div className="absolute top-4 left-4 w-4 h-2 bg-black"></div>
                             <div className="absolute top-4 right-4 w-4 h-2 bg-black"></div>
                             <div className="absolute bottom-4 left-4 w-8 h-2 bg-black"></div>
                        </div>
                        
                        {/* Text Box */}
                        <div className="absolute bottom-4 left-4 right-4 bg-blue-900 border-4 border-white p-4">
                            <p className="text-white text-lg leading-relaxed typing-effect">
                                A wild GLITCH appeared! What will you do?
                            </p>
                            <div className="absolute bottom-2 right-2 animate-bounce">▼</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Actions */}
        <div className="mt-8 grid grid-cols-4 gap-4">
            {['ATTACK', 'MAGIC', 'ITEM', 'RUN'].map((action) => (
                <button key={action} className="bg-gray-700 p-1 shadow-[4px_4px_0_black] hover:bg-gray-600 hover:shadow-[2px_2px_0_black] hover:translate-y-[2px] hover:translate-x-[2px] transition-all active:bg-gray-500">
                    <div className="bg-gray-800 border-2 border-white py-3 text-white font-bold text-center">
                        {action}
                    </div>
                </button>
            ))}
        </div>

      </div>
    </div>
  );
}
