import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowLeft, Zap, Activity, Shield, Users, Globe } from "lucide-react";

export default function NeonCityPage() {
  return (
    <div className="min-h-screen bg-[#0a0514] text-white font-body selection:bg-pink-500/30 selection:text-pink-200 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      <div className="relative z-10 container mx-auto p-6 md:p-12 space-y-8">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-12">
          <Link href="/demo/gemini">
            <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 font-mono group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              SYSTEM_EXIT
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-xs text-green-400 tracking-widest">ONLINE</span>
          </div>
        </nav>

        {/* Header */}
        <header className="space-y-4">
          <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/50 hover:bg-pink-500/20 backdrop-blur-md transition-all">
            NEON CITY v2.0
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-white/50 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            DASHBOARD
          </h1>
          <p className="text-xl text-white/50 max-w-2xl font-light">
            Welcome back, Operator. System integrity at 98%. Neural link established.
          </p>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left Column - Stats */}
          <div className="md:col-span-4 space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-[0_0_40px_rgba(168,85,247,0.25)] transition-all duration-500 group">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-4 w-4 text-pink-500" />
                  System Load
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-display font-bold text-white group-hover:text-pink-200 transition-colors">84%</span>
                    <span className="text-xs font-mono text-pink-400 animate-pulse">CRITICAL</span>
                  </div>
                  <Progress value={84} className="h-1 bg-white/10" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(56,189,248,0.15)] hover:shadow-[0_0_40px_rgba(56,189,248,0.25)] transition-all duration-500 group">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  Firewall
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-display font-bold text-white group-hover:text-cyan-200 transition-colors">ACTIVE</span>
                    <span className="text-xs font-mono text-cyan-400">SECURE</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 overflow-hidden rounded-full">
                    <div className="h-full bg-cyan-400 w-full relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent after:translate-x-[-100%] animate-shimmer" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/40 to-black border-purple-500/30 overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3')] bg-cover bg-center opacity-20 mix-blend-overlay" />
              <CardContent className="pt-6 relative z-10 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full border-2 border-purple-400 p-1 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                   <div className="w-full h-full rounded-full bg-black/50 overflow-hidden flex items-center justify-center">
                     <Users className="h-8 w-8 text-purple-300" />
                   </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Guest User</h3>
                  <p className="text-sm text-purple-300">Level 1 Operator</p>
                </div>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] w-full font-mono text-xs">
                  EDIT PROFILE
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="md:col-span-8">
            <Card className="h-full bg-black/40 border-white/10 backdrop-blur-md">
              <CardHeader>
                <Tabs defaultValue="missions" className="w-full">
                  <div className="flex items-center justify-between mb-6">
                    <CardTitle className="font-display text-2xl tracking-wide flex items-center gap-3">
                      <Globe className="h-6 w-6 text-pink-500 animate-spin-slow" />
                      ACTIVE_SECTORS
                    </CardTitle>
                    <TabsList className="bg-white/5 border border-white/10">
                      <TabsTrigger value="missions" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300 font-mono text-xs">MISSIONS</TabsTrigger>
                      <TabsTrigger value="logs" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 font-mono text-xs">LOGS</TabsTrigger>
                      <TabsTrigger value="map" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 font-mono text-xs">MAP</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="missions" className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="group flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-pink-500/30 transition-all duration-300 cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded bg-gradient-to-br ${i === 1 ? 'from-pink-500 to-purple-600' : i === 2 ? 'from-cyan-500 to-blue-600' : 'from-yellow-400 to-orange-500'} opacity-80 flex items-center justify-center font-bold font-mono text-white shadow-lg`}>
                            0{i}
                          </div>
                          <div>
                            <h4 className="font-bold text-white group-hover:text-pink-300 transition-colors">Sector {7 + i} Pacification</h4>
                            <p className="text-xs text-white/40 font-mono">Difficulty: {i === 1 ? 'HARD' : i === 2 ? 'MEDIUM' : 'EXTREME'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="border-white/20 text-white/60 font-mono text-[10px] mb-1 group-hover:border-pink-500/50 group-hover:text-pink-400 transition-colors">
                            REWARD: {i * 500} XP
                          </Badge>
                          <div className="flex items-center justify-end gap-1 text-xs text-white/30">
                            <Zap className="h-3 w-3" />
                            <span>Active</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="h-48 rounded-lg border border-white/10 bg-black/50 relative overflow-hidden flex items-center justify-center group">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&auto=format&fit=crop&q=60')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <Button className="relative z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-mono tracking-widest uppercase">
                    Launch Simulation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
