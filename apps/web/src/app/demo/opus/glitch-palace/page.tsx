"use client";

import type { Route } from "next";
import Link from "next/link";

export default function GlitchPalace() {
  return (
    <div className="min-h-screen bg-[oklch(0.06_0.01_200)] text-[oklch(0.98_0.005_200)] relative overflow-hidden">
      {/* VHS noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-40 opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          animation: "vhs-noise 0.2s steps(10) infinite",
        }}
      />

      {/* Horizontal VHS tracking lines */}
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
        <div
          className="absolute w-full h-8 bg-[oklch(0.78_0.20_195/0.15)]"
          style={{
            animation: "tracking-line 4s linear infinite",
          }}
        />
        <div
          className="absolute w-full h-4 bg-[oklch(0.68_0.28_345/0.1)]"
          style={{
            animation: "tracking-line 6s linear infinite",
            animationDelay: "-2s",
          }}
        />
      </div>

      {/* RGB split ambient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.78_0.20_195/0.05),transparent_60%)]" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="p-6 md:p-8">
          <Link
            href={"/demo/opus" as Route}
            className="inline-flex items-center gap-2 text-[oklch(0.55_0.015_200)] hover:text-[oklch(0.78_0.20_195)] transition-colors font-mono text-sm uppercase tracking-wider group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Selection
          </Link>
        </nav>

        {/* Hero Section */}
        <section className="px-6 md:px-8 py-20 md:py-32 max-w-7xl mx-auto">
          {/* VHS timestamp */}
          <div className="mb-8 font-mono text-sm text-[oklch(0.80_0.22_140)]">
            <span className="inline-block px-2 py-1 bg-[oklch(0.80_0.22_140/0.2)] rounded">
              REC <span className="animate-pulse inline-block w-2 h-2 bg-[oklch(0.60_0.28_25)] rounded-full ml-2" />
            </span>
            <span className="ml-4">1987.08.15 03:42:17</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-3 mb-8">
            <span className="w-8 h-px bg-gradient-to-r from-[oklch(0.78_0.20_195)] to-transparent" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-[oklch(0.78_0.20_195)]">
              Proposal 04
            </span>
          </div>

          {/* Glitch Title */}
          <div className="relative mb-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight uppercase relative">
              {/* Base text */}
              <span className="block text-[oklch(0.98_0.005_200)]">GLITCH</span>
              <span className="block text-[oklch(0.78_0.20_195)]">PALACE</span>
              
              {/* Red channel offset */}
              <span
                className="absolute top-0 left-0 text-[oklch(0.60_0.28_25)] mix-blend-screen pointer-events-none select-none"
                style={{ transform: "translate(-2px, 0)", clipPath: "inset(0 0 50% 0)" }}
                aria-hidden="true"
              >
                <span className="block">GLITCH</span>
                <span className="block">PALACE</span>
              </span>
              
              {/* Blue channel offset */}
              <span
                className="absolute top-0 left-0 text-[oklch(0.72_0.24_248)] mix-blend-screen pointer-events-none select-none"
                style={{ transform: "translate(2px, 0)", clipPath: "inset(50% 0 0 0)" }}
                aria-hidden="true"
              >
                <span className="block">GLITCH</span>
                <span className="block">PALACE</span>
              </span>
            </h1>
          </div>

          {/* Subtitle with glitch effect */}
          <p className="text-xl md:text-2xl text-[oklch(0.72_0.015_200)] font-body max-w-2xl mb-12"
            style={{ animation: "text-glitch 5s infinite" }}
          >
            Where corrupted memories become art. 
            Embrace the beautiful chaos of degraded signals.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              className="px-8 py-4 font-display font-bold uppercase tracking-wider transition-all hover:scale-105 relative overflow-hidden"
              style={{
                background: `linear-gradient(90deg, oklch(0.78 0.20 195), oklch(0.80 0.22 140))`,
                color: "oklch(0.06 0.01 200)",
                boxShadow: `
                  0 0 30px oklch(0.78 0.20 195 / 0.4),
                  0 4px 0 oklch(0.60 0.18 195)
                `,
              }}
            >
              <span className="relative z-10">Play Tape</span>
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[oklch(1_0_0/0.2)] to-transparent"
                style={{ animation: "shimmer 2s infinite" }}
              />
            </button>
            <button
              type="button"
              className="px-8 py-4 border-2 border-[oklch(0.80_0.22_140)] text-[oklch(0.80_0.22_140)] font-display font-bold uppercase tracking-wider transition-all hover:bg-[oklch(0.80_0.22_140/0.1)]"
              style={{
                boxShadow: `0 0 20px oklch(0.80 0.22 140 / 0.2)`
              }}
            >
              Rewind
            </button>
          </div>
        </section>

        {/* VHS Tape Collection */}
        <section className="px-6 md:px-8 py-16 max-w-7xl mx-auto">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-8 text-[oklch(0.75_0.01_200)]">
            <span className="text-[oklch(0.78_0.20_195)]">[</span>
            Tape Collection
            <span className="text-[oklch(0.78_0.20_195)]">]</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "LOST SIGNALS", date: "1987", duration: "02:34:17", color: "345" },
              { title: "NEON DREAMS", date: "1984", duration: "01:48:22", color: "195" },
              { title: "STATIC VOID", date: "1989", duration: "03:12:45", color: "140" },
            ].map((tape) => (
              <div
                key={tape.title}
                className="group relative bg-[oklch(0.08_0.01_200)] rounded-lg overflow-hidden transition-all hover:scale-[1.02]"
                style={{
                  border: `2px solid oklch(0.20 0.02 200)`,
                  boxShadow: `inset 0 0 30px oklch(0 0 0 / 0.5)`,
                }}
              >
                {/* VHS tape visualization */}
                <div className="aspect-[16/9] relative bg-[oklch(0.04_0.01_200)] flex items-center justify-center">
                  {/* Tape reels */}
                  <div className="flex items-center gap-8">
                    <div className="w-12 h-12 rounded-full border-4 border-[oklch(0.20_0.02_200)] flex items-center justify-center group-hover:animate-spin">
                      <div className="w-4 h-4 rounded-full bg-[oklch(0.15_0.01_200)]" />
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-[oklch(0.20_0.02_200)] flex items-center justify-center group-hover:animate-spin">
                      <div className="w-4 h-4 rounded-full bg-[oklch(0.15_0.01_200)]" />
                    </div>
                  </div>
                  
                  {/* Play icon on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className={`w-16 h-16 rounded-full bg-[oklch(0.78_0.20_${tape.color}/0.8)] flex items-center justify-center`}>
                      <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Glitch overlay on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                    style={{
                      background: `repeating-linear-gradient(
                        0deg,
                        transparent 0px,
                        transparent 2px,
                        oklch(0.78 0.20 ${tape.color} / 0.1) 2px,
                        oklch(0.78 0.20 ${tape.color} / 0.1) 4px
                      )`,
                    }}
                  />
                </div>

                {/* Tape label */}
                <div className="p-4 border-t border-[oklch(0.15_0.02_200)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-[oklch(0.50_0.01_200)]">{tape.date}</span>
                    <span className="text-xs font-mono text-[oklch(0.50_0.01_200)]">{tape.duration}</span>
                  </div>
                  <h3 className={`font-display text-lg font-bold tracking-wide group-hover:text-[oklch(0.78_0.20_${tape.color})] transition-colors`}>
                    {tape.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Signal Monitor */}
        <section className="px-6 md:px-8 py-16 max-w-7xl mx-auto">
          <div
            className="bg-[oklch(0.05_0.01_200)] rounded-lg p-8 border-2 border-[oklch(0.15_0.02_200)]"
            style={{
              boxShadow: `
                inset 0 0 50px oklch(0 0 0 / 0.5),
                0 0 30px oklch(0.78 0.20 195 / 0.1)
              `,
            }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-[oklch(0.60_0.28_25)]" />
                <div className="w-3 h-3 rounded-full bg-[oklch(0.85_0.20_80)]" />
                <div className="w-3 h-3 rounded-full bg-[oklch(0.80_0.22_140)]" />
              </div>
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">
                Signal Diagnostics
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "SIGNAL", value: "87%", status: "WEAK" },
                { label: "TRACKING", value: "AUTO", status: "ENGAGED" },
                { label: "HEADS", value: "CLEAN", status: "OK" },
                { label: "TAPE", value: "VHS-C", status: "LOADED" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-mono font-bold mb-1 text-[oklch(0.80_0.22_140)]"
                    style={{ textShadow: "0 0 10px oklch(0.80 0.22 140 / 0.5)" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs font-mono text-[oklch(0.50_0.01_200)] mb-1">{stat.label}</div>
                  <div className="text-xs font-mono text-[oklch(0.78_0.20_195)]">[{stat.status}]</div>
                </div>
              ))}
            </div>

            {/* Waveform visualization */}
            <div className="mt-8 h-20 bg-[oklch(0.03_0.01_200)] rounded flex items-center justify-center overflow-hidden">
              <div className="flex items-end gap-1 h-full py-4">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div
                    key={`wave-${i}`}
                    className="w-1 bg-[oklch(0.78_0.20_195)]"
                    style={{
                      height: `${20 + Math.random() * 60}%`,
                      opacity: 0.3 + Math.random() * 0.7,
                      animation: `wave ${0.5 + Math.random() * 0.5}s ease-in-out infinite`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="px-6 md:px-8 py-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-8">
            <span className="text-[oklch(0.78_0.20_195)]">//</span> Label Your Tape
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="tape-title" className="block text-sm font-mono uppercase tracking-wider text-[oklch(0.50_0.01_200)]">
                Title
              </label>
              <input
                id="tape-title"
                type="text"
                placeholder="TAPE TITLE"
                className="w-full px-4 py-3 bg-[oklch(0.04_0.01_200)] border-2 border-[oklch(0.20_0.02_200)] rounded font-mono text-lg tracking-wider placeholder:text-[oklch(0.30_0.01_200)] focus:border-[oklch(0.78_0.20_195)] focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="recording-date" className="block text-sm font-mono uppercase tracking-wider text-[oklch(0.50_0.01_200)]">
                Recording Date
              </label>
              <input
                id="recording-date"
                type="text"
                placeholder="1987.01.01"
                className="w-full px-4 py-3 bg-[oklch(0.04_0.01_200)] border-2 border-[oklch(0.20_0.02_200)] rounded font-mono text-lg tracking-wider placeholder:text-[oklch(0.30_0.01_200)] focus:border-[oklch(0.78_0.20_195)] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.04]"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            oklch(0 0 0 / 0.2) 0px,
            oklch(0 0 0 / 0.2) 1px,
            transparent 1px,
            transparent 2px
          )`
        }}
      />

      <style jsx>{`
        @keyframes vhs-noise {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          20% { transform: translate(5%, 5%); }
          30% { transform: translate(-5%, 5%); }
          40% { transform: translate(5%, -5%); }
          50% { transform: translate(-3%, 3%); }
          60% { transform: translate(3%, -3%); }
          70% { transform: translate(-3%, -3%); }
          80% { transform: translate(3%, 3%); }
          90% { transform: translate(-2%, 2%); }
        }
        @keyframes tracking-line {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes text-glitch {
          0%, 95%, 100% { transform: none; opacity: 1; }
          96% { transform: translateX(-2px); opacity: 0.8; }
          97% { transform: translateX(2px); opacity: 0.9; }
          98% { transform: translateX(-1px); opacity: 0.8; }
          99% { transform: translateX(1px); opacity: 0.9; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.5); }
        }
      `}</style>
    </div>
  );
}
