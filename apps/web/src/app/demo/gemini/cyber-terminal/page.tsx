"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Terminal, Cpu, Wifi, Lock } from "lucide-react";

export default function CyberTerminalPage() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([
    "INITIALIZING KERNEL...",
    "LOADING MODULES... [OK]",
    "MOUNTING FILE SYSTEM... [OK]",
    "ESTABLISHING SECURE CONNECTION...",
    "ACCESS GRANTED.",
    "WELCOME TO CYBER_TERMINAL v1.0.4",
    "TYPE 'HELP' FOR COMMANDS."
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toUpperCase();
    const newHistory = [...history, `> ${input}`];

    switch (cmd) {
      case "HELP":
        newHistory.push("AVAILABLE COMMANDS: HELP, STATUS, CLEAR, EXIT, SCAN");
        break;
      case "STATUS":
        newHistory.push("SYSTEM INTEGRITY: 100%", "CPU TEMP: 45C", "MEMORY: 64TB FREE");
        break;
      case "CLEAR":
        setHistory([]);
        setInput("");
        return;
      case "EXIT":
        // In a real app this might redirect
        newHistory.push("LOGGING OFF...");
        break;
      case "SCAN":
        newHistory.push("SCANNING NETWORK...", "FOUND 3 VULNERABILITIES", "1. PORT 22 OPEN", "2. WEAK ENCRYPTION DETECTED", "3. UNAUTHORIZED ACCESS ATTEMPT");
        break;
      default:
        if (cmd) newHistory.push(`UNKNOWN COMMAND: ${cmd}`);
    }

    setHistory(newHistory);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 md:p-8 relative overflow-hidden selection:bg-green-900 selection:text-green-100">
      
      {/* CRT Effects */}
      <div className="crt-overlay pointer-events-none fixed inset-0 z-50 opacity-20" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)] z-40" />
      <div className="fixed top-0 left-0 w-full h-[5px] bg-green-400/20 opacity-50 blur-sm animate-scanline pointer-events-none z-40" />

      <div className="relative z-30 max-w-5xl mx-auto border-2 border-green-800 rounded-lg bg-black/90 shadow-[0_0_50px_rgba(34,197,94,0.15)] h-[90vh] flex flex-col overflow-hidden">
        
        {/* Terminal Header */}
        <header className="bg-green-900/20 border-b border-green-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Terminal className="h-6 w-6 animate-pulse" />
            <h1 className="text-xl font-bold tracking-widest text-green-400">ROOT@MAINFRAME:~</h1>
          </div>
          <div className="flex items-center gap-6 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span>CONNECTED</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span>3.4 GHZ</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>ENCRYPTED</span>
            </div>
            <Link href="/demo/gemini">
               <Button variant="outline" size="sm" className="border-green-700 text-green-500 hover:bg-green-900 hover:text-green-300 font-mono text-xs uppercase h-7">
                 Exit System
               </Button>
            </Link>
          </div>
        </header>

        {/* Terminal Body */}
        <div className="flex-grow p-6 overflow-y-auto font-bold text-lg space-y-2 scrollbar-hide">
          {history.map((line, i) => (
            <div key={i} className={`${line.startsWith(">") ? "text-green-300" : "text-green-500/80"} break-words`}>
              {line}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-green-900/10 border-t border-green-800">
          <form onSubmit={handleCommand} className="flex items-center gap-3">
            <span className="text-green-400 animate-pulse">{">"}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow bg-transparent border-none outline-none text-green-400 font-bold text-lg placeholder-green-800"
              placeholder="ENTER COMMAND..."
              autoFocus
              spellCheck={false}
            />
          </form>
        </div>

      </div>
    </div>
  );
}
