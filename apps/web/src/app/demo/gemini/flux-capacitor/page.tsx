import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Zap, Clock, Power, Settings, ArrowLeft } from "lucide-react";

export default function FluxCapacitorPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-300 font-display p-4 md:p-8 relative overflow-hidden selection:bg-blue-500 selection:text-white">
      
      {/* Background Texture - Brushed Metalish */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_50px,rgba(255,255,255,0.02)_50px,rgba(255,255,255,0.02)_51px)] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />

      {/* Electrical Arcs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
         <div className="absolute top-[20%] left-[10%] w-[2px] h-[100px] bg-blue-400 blur-[2px] animate-flash" style={{ animationDelay: '2s' }} />
         <div className="absolute bottom-[30%] right-[15%] w-[2px] h-[150px] bg-blue-400 blur-[2px] animate-flash" style={{ animationDelay: '5s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        
        {/* Nav */}
        <nav className="flex justify-between items-center border-b border-gray-700 pb-6">
          <Link href="/demo/gemini">
            <Button variant="ghost" className="text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 font-mono tracking-widest uppercase">
              <ArrowLeft className="mr-2 h-4 w-4" /> ABORT
            </Button>
          </Link>
          <div className="flex items-center gap-4">
             <Badge variant="outline" className="border-blue-500/50 text-blue-400 animate-pulse bg-blue-900/10">
                FLUXING
             </Badge>
             <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_red]" />
          </div>
        </nav>

        {/* Main Interface */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Time Circuits */}
           <div className="lg:col-span-8 space-y-8">
              
              {/* Destination Time */}
              <div className="bg-[#111] border-4 border-[#333] rounded-xl p-6 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
                 <h2 className="text-center font-bold tracking-widest text-[#a11] mb-2 uppercase text-sm">Destination Time</h2>
                 <div className="flex flex-wrap justify-center gap-4 md:gap-8 font-mono font-black text-4xl md:text-6xl text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
                    <span className="bg-black/50 px-4 py-2 rounded border border-red-900/50">OCT</span>
                    <span className="bg-black/50 px-4 py-2 rounded border border-red-900/50">21</span>
                    <span className="bg-black/50 px-4 py-2 rounded border border-red-900/50">2015</span>
                    <span className="bg-black/50 px-4 py-2 rounded border border-red-900/50 animate-pulse">04:29</span>
                 </div>
              </div>

              {/* Present Time */}
              <div className="bg-[#111] border-4 border-[#333] rounded-xl p-6 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
                 <h2 className="text-center font-bold tracking-widest text-[#1a1] mb-2 uppercase text-sm">Present Time</h2>
                 <div className="flex flex-wrap justify-center gap-4 md:gap-8 font-mono font-black text-4xl md:text-6xl text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]">
                    <span className="bg-black/50 px-4 py-2 rounded border border-green-900/50">FEB</span>
                    <span className="bg-black/50 px-4 py-2 rounded border border-green-900/50">06</span>
                    <span className="bg-black/50 px-4 py-2 rounded border border-green-900/50">2026</span>
                    <span className="bg-black/50 px-4 py-2 rounded border border-green-900/50">12:00</span>
                 </div>
              </div>

              {/* Last Time Departed */}
              <div className="bg-[#111] border-4 border-[#333] rounded-xl p-6 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
                 <h2 className="text-center font-bold tracking-widest text-[#aa1] mb-2 uppercase text-sm">Last Time Departed</h2>
                 <div className="flex flex-wrap justify-center gap-4 md:gap-8 font-mono font-black text-4xl md:text-6xl text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]">
                    <span className="bg-black/50 px-4 py-2 rounded border border-yellow-900/50">NOV</span>
                    <span className="bg-black/50 px-4 py-2 rounded border border-yellow-900/50">12</span>
                    <span className="bg-black/50 px-4 py-2 rounded border border-yellow-900/50">1955</span>
                    <span className="bg-black/50 px-4 py-2 rounded border border-yellow-900/50">06:38</span>
                 </div>
              </div>

           </div>

           {/* Controls */}
           <div className="lg:col-span-4 space-y-6">
              
              {/* Flux Capacitor Status */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-lg p-6 shadow-xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay" />
                 <h3 className="font-display font-bold text-gray-400 mb-6 flex items-center gap-2">
                    <Zap className="text-blue-400 fill-current" /> ENERGY OUTPUT
                 </h3>
                 
                 <div className="flex justify-center mb-8 relative">
                    <div className="w-32 h-32 relative">
                        {/* Triangle of light */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-16 bg-blue-500 blur-md animate-pulse origin-bottom" />
                        <div className="absolute bottom-2 left-2 w-2 h-16 bg-blue-500 blur-md animate-pulse origin-top rotate-[120deg]" />
                        <div className="absolute bottom-2 right-2 w-2 h-16 bg-blue-500 blur-md animate-pulse origin-top rotate-[-120deg]" />
                        
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="w-4 h-4 bg-white rounded-full blur-sm animate-ping" />
                        </div>
                    </div>
                 </div>

                 <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-blue-400">1.21 GW</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Power Level</div>
                 </div>
              </div>

              {/* Speed */}
              <div className="bg-black border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-800 rounded-full border border-gray-600">
                       <Settings className="h-6 w-6 text-gray-400 animate-spin-slow" />
                    </div>
                    <div>
                       <div className="text-xs text-gray-500 uppercase">Current Velocity</div>
                       <div className="font-mono text-xl text-white">88 MPH</div>
                    </div>
                 </div>
                 <Power className="h-8 w-8 text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
              </div>

              <Button className="w-full h-16 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-display font-bold tracking-widest text-xl border-t border-white/20 shadow-[0_5px_15px_rgba(220,38,38,0.4)] active:scale-95 transition-all uppercase">
                 Initiate Sequence
              </Button>

           </div>
        </main>

      </div>
    </div>
  );
}
