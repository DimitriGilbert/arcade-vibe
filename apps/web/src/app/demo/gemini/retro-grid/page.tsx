import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Play, Music, SkipForward, Rewind, Disc } from "lucide-react";

export default function RetroGridPage() {
  return (
    <div className="min-h-screen bg-[#120428] text-white font-body overflow-hidden relative selection:bg-cyan-500 selection:text-black">
      
      {/* --- RETRO SUN & GRID BACKGROUND --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none perspective-1000">
        {/* Sun */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-gradient-to-b from-yellow-400 via-orange-500 to-pink-600 shadow-[0_0_100px_rgba(234,88,12,0.6)] sun-mask" />
        
        {/* Horizon Line */}
        <div className="absolute top-[45%] left-0 right-0 h-[2px] bg-pink-500/50 blur-[2px]" />
        
        {/* Moving Grid Floor */}
        <div className="absolute bottom-0 left-[-50%] right-[-50%] h-[55%] bg-[#1a0b38] origin-bottom rotate-x-60">
          <div className="w-full h-full opacity-60 animate-grid-move bg-[linear-gradient(to_right,rgba(236,72,153,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.4)_1px,transparent_1px)] bg-[size:50px_50px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#120428] via-transparent to-transparent" />
        </div>

        {/* Stars */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40" />
      </div>

      <div className="relative z-10 container mx-auto p-6 flex flex-col min-h-screen">
        
        {/* Nav */}
        <nav className="flex justify-between items-center mb-8">
          <Link href="/demo/gemini">
            <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black font-display tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]">
              <ArrowLeft className="mr-2 h-4 w-4" /> REWIND
            </Button>
          </Link>
          <div className="text-right">
             <div className="text-4xl font-display font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 drop-shadow-[2px_2px_0px_rgba(255,255,255,0.2)]">
               VAPORWAVE
             </div>
             <div className="text-xs font-mono tracking-[0.3em] text-pink-300 uppercase">Aesthetic System</div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col items-center justify-center space-y-12">
          
          {/* Hero Text */}
          <div className="text-center space-y-2 transform hover:scale-105 transition-transform duration-500">
            <h1 className="text-6xl md:text-9xl font-black font-display italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-pink-300 drop-shadow-[4px_4px_0_#d946ef] stroke-text">
              ARCADE
            </h1>
            <h2 className="text-4xl md:text-7xl font-black font-display italic tracking-widest text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse">
              NIGHTS
            </h2>
          </div>

          {/* Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl px-4 perspective-1000">
            
            {/* Card 1 */}
            <Card className="bg-black/40 backdrop-blur-md border-2 border-pink-500/50 text-white transform hover:-translate-y-4 hover:rotate-y-12 transition-all duration-500 shadow-[0_0_30px_rgba(236,72,153,0.2)] group overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400" />
              <CardHeader>
                <CardTitle className="font-display italic text-2xl text-pink-300 group-hover:text-pink-100 transition-colors">
                  SYNTHWAVE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full h-32 bg-gradient-to-br from-pink-900/50 to-purple-900/50 rounded-md border border-pink-500/30 flex items-center justify-center relative overflow-hidden">
                   <Music className="h-12 w-12 text-pink-400 animate-bounce" />
                   <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px]" />
                </div>
                <p className="text-sm font-mono text-white/70">
                  Chill beats for coding and driving into the sunset.
                </p>
              </CardContent>
              <CardFooter>
                 <Button className="w-full bg-pink-600 hover:bg-pink-500 text-white font-display uppercase tracking-wider skew-x-[-10deg]">
                   Listen Now
                 </Button>
              </CardFooter>
            </Card>

            {/* Card 2 - Center Player */}
            <Card className="bg-black/60 backdrop-blur-xl border-2 border-cyan-500 text-white transform scale-110 shadow-[0_0_50px_rgba(6,182,212,0.4)] z-10">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />
              <CardHeader className="text-center">
                 <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 p-1 animate-[spin_4s_linear_infinite]">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                       <Disc className="h-12 w-12 text-white" />
                    </div>
                 </div>
                 <CardTitle className="mt-4 font-display text-3xl tracking-wide text-cyan-300">
                    NOW PLAYING
                 </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                 <p className="text-lg font-bold">Midnight Run</p>
                 <p className="text-sm text-cyan-400/70 font-mono">The Neon Rider</p>
                 
                 <div className="flex justify-center items-center gap-6 mt-6">
                    <Rewind className="h-8 w-8 text-white hover:text-cyan-400 cursor-pointer transition-colors" />
                    <div className="h-12 w-12 rounded-full bg-cyan-500 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                       <Play className="h-6 w-6 text-black fill-current ml-1" />
                    </div>
                    <SkipForward className="h-8 w-8 text-white hover:text-cyan-400 cursor-pointer transition-colors" />
                 </div>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="bg-black/40 backdrop-blur-md border-2 border-yellow-500/50 text-white transform hover:-translate-y-4 hover:-rotate-y-12 transition-all duration-500 shadow-[0_0_30px_rgba(234,179,8,0.2)] group overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
              <CardHeader>
                <CardTitle className="font-display italic text-2xl text-yellow-300 group-hover:text-yellow-100 transition-colors">
                  RETRO GAMING
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="w-full h-32 bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-md border border-yellow-500/30 flex items-center justify-center relative overflow-hidden">
                   <div className="text-4xl">🕹️</div>
                   <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px]" />
                </div>
                <p className="text-sm font-mono text-white/70">
                  High scores and coin drops. Insert token to start.
                </p>
              </CardContent>
              <CardFooter>
                 <Button className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-display uppercase tracking-wider skew-x-[-10deg]">
                   Insert Coin
                 </Button>
              </CardFooter>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
}
