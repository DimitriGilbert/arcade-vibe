import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Star, Trophy, ArrowLeft } from "lucide-react";

export default function PixelPerfectPage() {
  return (
    <div className="min-h-screen bg-blue-400 font-mono p-4 md:p-8 overflow-x-hidden selection:bg-yellow-400 selection:text-black">
      
      {/* Clouds / Background Decor */}
      <div className="fixed top-20 left-10 w-32 h-12 bg-white rounded-full opacity-80" />
      <div className="fixed top-40 right-20 w-48 h-16 bg-white rounded-full opacity-60" />
      
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Nav */}
        <div className="flex justify-between items-center bg-white border-4 border-black p-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
          <Link href="/demo/gemini">
            <Button className="bg-red-500 hover:bg-red-600 text-white font-bold border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-none uppercase">
              <ArrowLeft className="mr-2 h-5 w-5" /> Quit
            </Button>
          </Link>
          <div className="flex items-center gap-4 text-xl font-black">
            <div className="flex items-center gap-2 text-yellow-500 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <div className="bg-black p-1 rounded-sm"><span className="text-yellow-400">🪙</span></div>
              <span>x 99</span>
            </div>
            <div className="flex items-center gap-1 text-red-500 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
              <Heart className="fill-current h-6 w-6" />
              <Heart className="fill-current h-6 w-6" />
              <Heart className="fill-current h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-6 py-12">
           <h1 className="text-6xl md:text-8xl font-black text-yellow-400 drop-shadow-[6px_6px_0_rgba(0,0,0,1)] stroke-black tracking-tighter uppercase transform -rotate-2">
             LEVEL UP!
           </h1>
           <p className="text-2xl font-bold text-white drop-shadow-[3px_3px_0_rgba(0,0,0,1)] bg-black inline-block px-4 py-2 transform rotate-1">
             READY PLAYER ONE?
           </p>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           
           {/* Character Select */}
           <div className="bg-green-400 border-4 border-black p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)] relative group cursor-pointer hover:-translate-y-2 transition-transform">
              <div className="absolute -top-6 -left-6 bg-yellow-400 border-4 border-black px-4 py-2 font-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rotate-[-10deg] group-hover:rotate-0 transition-transform">
                NEW!
              </div>
              <h2 className="text-3xl font-black text-white drop-shadow-[3px_3px_0_rgba(0,0,0,1)] mb-4">WORLD 1-1</h2>
              <div className="bg-sky-200 border-4 border-black h-48 flex items-center justify-center mb-4 relative overflow-hidden">
                 <div className="absolute bottom-0 w-full h-8 bg-green-600 border-t-4 border-black" />
                 <div className="text-6xl animate-bounce">🍄</div>
                 <div className="absolute top-4 right-4 text-4xl animate-pulse">⭐</div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] transition-all rounded-none text-xl h-16">
                 START GAME
              </Button>
           </div>

           {/* High Scores */}
           <div className="bg-purple-500 border-4 border-black p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
              <h2 className="text-3xl font-black text-white drop-shadow-[3px_3px_0_rgba(0,0,0,1)] mb-4 flex items-center gap-3">
                 <Trophy className="h-8 w-8 text-yellow-300 fill-current drop-shadow-[2px_2px_0_rgba(0,0,0,1)]" />
                 LEADERBOARD
              </h2>
              <div className="space-y-4 font-bold text-lg">
                 {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-black/20 p-3 border-2 border-black flex justify-between items-center text-white">
                       <div className="flex items-center gap-3">
                          <span className="text-yellow-300">#{i}</span>
                          <span>{i === 1 ? "GEMINI" : i === 2 ? "ARCADE" : "PLAYER"}</span>
                       </div>
                       <div className="font-mono text-xl">{10000 - (i * 1234)}</div>
                    </div>
                 ))}
              </div>
              <div className="mt-6 text-center">
                 <Button className="bg-transparent border-none text-white hover:text-yellow-300 font-black animate-pulse uppercase">
                    View All Scores &gt;
                 </Button>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
