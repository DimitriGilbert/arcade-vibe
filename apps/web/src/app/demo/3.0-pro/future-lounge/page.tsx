export default function FutureLoungePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-black to-black">
      
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-neon-purple/5 blur-[100px]"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-neon-blue/5 blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-3 space-y-4">
             <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-[0_0_10px_var(--color-neon-cyan)]"></div>
                    <span className="font-display font-bold text-white tracking-widest text-sm">NEXUS_OS</span>
                </div>
                
                <nav className="space-y-2">
                    {['Dashboard', 'Analytics', 'Network', 'Settings'].map((item, i) => (
                        <div key={item} className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all duration-300 group ${i === 0 ? 'bg-white/10 border border-white/5' : 'hover:bg-white/5'}`}>
                            <div className={`w-1 h-4 rounded-full transition-all duration-300 ${i === 0 ? 'bg-neon-pink h-6' : 'bg-gray-600 group-hover:bg-neon-pink group-hover:h-5'}`}></div>
                            <span className={`text-sm font-medium transition-colors ${i === 0 ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{item}</span>
                        </div>
                    ))}
                </nav>
             </div>
             
             <div className="p-6 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-blue-900/20 border border-white/10 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                </div>
                <h3 className="text-white font-bold mb-1">Premium Access</h3>
                <p className="text-xs text-gray-400 mb-4">Upgrade your neural link.</p>
                <button className="w-full py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-neon-cyan transition-colors">UPGRADE</button>
             </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-9 space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Active Users", value: "8,245", change: "+12%", color: "text-neon-cyan" },
                    { label: "System Load", value: "45%", change: "-2%", color: "text-neon-green" },
                    { label: "Credits", value: "¥ 1,024,500", change: "+5%", color: "text-neon-purple" }
                ].map((stat) => (
                    <div key={stat.label} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                        <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">{stat.label}</div>
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-display text-white">{stat.value}</span>
                            <span className={`text-xs font-mono py-1 px-2 rounded bg-white/5 ${stat.color}`}>{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Chart Area */}
            <div className="rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl p-8 h-96 relative overflow-hidden group">
                {/* Glow behind */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neon-blue/5 blur-[80px] rounded-full group-hover:bg-neon-blue/10 transition-colors duration-700"></div>
                
                <div className="relative z-10 flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-display text-white">Traffic Analysis</h2>
                    <div className="flex gap-2">
                        {['1H', '24H', '7D', '30D'].map(t => (
                            <button key={t} className="px-3 py-1 rounded-full text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors">{t}</button>
                        ))}
                    </div>
                </div>

                {/* Mock Chart */}
                <div className="flex items-end justify-between h-56 gap-2">
                    {[30, 45, 35, 60, 50, 75, 55, 65, 80, 70, 90, 85].map((h, i) => (
                        <div key={i} className="w-full bg-white/5 rounded-t-sm relative group/bar hover:bg-neon-cyan/20 transition-colors">
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-neon-blue to-neon-cyan rounded-t-sm transition-all duration-500" style={{ height: `${h}%` }}></div>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap border border-white/20">
                                {h * 123} visits
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                     <h3 className="text-white font-bold mb-4">Recent Activity</h3>
                     <div className="space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600"></div>
                                <div>
                                    <div className="text-sm text-white">User_77{i} logged in</div>
                                    <div className="text-xs text-gray-500">2 minutes ago</div>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
                 <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/10 to-transparent"></div>
                     <div className="text-center relative z-10">
                        <div className="w-16 h-16 rounded-full border-2 border-neon-pink flex items-center justify-center mx-auto mb-4 animate-pulse shadow-[0_0_20px_var(--color-neon-pink)]">
                            <span className="text-neon-pink text-2xl">!</span>
                        </div>
                        <h3 className="text-white font-bold">System Alert</h3>
                        <p className="text-gray-400 text-sm mt-1">2 updates pending approval</p>
                        <button className="mt-4 px-4 py-2 bg-neon-pink/20 text-neon-pink text-xs font-bold rounded hover:bg-neon-pink hover:text-white transition-all">REVIEW</button>
                     </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
