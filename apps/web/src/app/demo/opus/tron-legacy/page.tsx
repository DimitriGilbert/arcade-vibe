"use client";

import type { Route } from "next";
import Link from "next/link";

export default function TronLegacy() {
  return (
    <div className="min-h-screen bg-[oklch(0.03_0.01_240)] text-[oklch(0.98_0.005_240)] relative overflow-hidden">
      {/* Grid floor */}
      <div className="absolute bottom-0 left-0 right-0 h-[60vh] perspective-floor">
        <div
          className="absolute inset-0 grid-floor"
          style={{
            backgroundImage: `
              linear-gradient(oklch(0.72 0.24 248 / 0.25) 1px, transparent 1px),
              linear-gradient(90deg, oklch(0.72 0.24 248 / 0.25) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            transform: "rotateX(75deg)",
            transformOrigin: "center top",
            animation: "grid-scroll 20s linear infinite",
          }}
        />
        {/* Horizon glow */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[oklch(0.72_0.24_248/0.2)] to-transparent" />
      </div>

      {/* Ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.72_0.24_248/0.05),transparent_60%)]" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="p-6 md:p-8">
          <Link
            href={"/demo/opus" as Route}
            className="inline-flex items-center gap-2 text-[oklch(0.55_0.015_240)] hover:text-[oklch(0.72_0.24_248)] transition-colors font-mono text-sm uppercase tracking-wider group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Selection
          </Link>
        </nav>

        {/* Hero Section */}
        <section className="px-6 md:px-8 py-20 md:py-32 max-w-7xl mx-auto text-center">
          {/* Geometric decoration */}
          <div className="flex justify-center mb-8">
            <div className="relative w-32 h-32 md:w-48 md:h-48">
              <div
                className="absolute inset-0 border-2 border-[oklch(0.72_0.24_248)] rounded-full"
                style={{ animation: "spin 20s linear infinite" }}
              />
              <div
                className="absolute inset-4 border border-[oklch(0.78_0.20_195)] rounded-full"
                style={{ animation: "spin 15s linear infinite reverse" }}
              />
              <div
                className="absolute inset-8 border border-[oklch(0.72_0.24_248/0.5)]"
                style={{ 
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  animation: "spin 10s linear infinite"
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-[oklch(0.78_0.20_195)] rounded-full animate-pulse"
                  style={{ boxShadow: "0 0 20px oklch(0.78 0.20 195)" }}
                />
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-3 mb-8">
            <span className="w-12 h-px bg-gradient-to-r from-transparent via-[oklch(0.72_0.24_248)] to-transparent" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-[oklch(0.72_0.24_248)]">
              Proposal 02
            </span>
            <span className="w-12 h-px bg-gradient-to-r from-transparent via-[oklch(0.72_0.24_248)] to-transparent" />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-display font-black tracking-tighter uppercase mb-6">
            <span className="block" style={{
              color: "oklch(0.72 0.24 248)",
              textShadow: `
                0 0 20px oklch(0.72 0.24 248),
                0 0 40px oklch(0.72 0.24 248 / 0.6),
                0 0 80px oklch(0.72 0.24 248 / 0.3)
              `
            }}>
              TRON
            </span>
            <span className="block text-[oklch(0.78_0.20_195)]" style={{
              textShadow: `
                0 0 20px oklch(0.78 0.20 195),
                0 0 40px oklch(0.78 0.20 195 / 0.6)
              `
            }}>
              LEGACY
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-[oklch(0.72_0.015_240)] font-body max-w-2xl mx-auto mb-12">
            Welcome to the digital frontier. Where geometry is law
            and light defines reality.
          </p>

          {/* CTA */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              className="px-8 py-4 bg-transparent border-2 border-[oklch(0.72_0.24_248)] text-[oklch(0.72_0.24_248)] font-display font-bold uppercase tracking-wider transition-all hover:bg-[oklch(0.72_0.24_248)] hover:text-[oklch(0.03_0.01_240)]"
              style={{
                clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
                boxShadow: "0 0 20px oklch(0.72 0.24 248 / 0.3)"
              }}
            >
              Enter the Grid
            </button>
            <button
              className="px-8 py-4 border border-[oklch(0.78_0.20_195/0.5)] text-[oklch(0.78_0.20_195)] font-display font-bold uppercase tracking-wider transition-all hover:border-[oklch(0.78_0.20_195)] hover:bg-[oklch(0.78_0.20_195/0.1)]"
              style={{
                clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)"
              }}
            >
              System Status
            </button>
          </div>
        </section>

        {/* Identity Discs */}
        <section className="px-6 md:px-8 py-16 max-w-7xl mx-auto">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-8 text-center">
            <span className="text-[oklch(0.72_0.24_248)]">&lt;</span>
            Program Selection
            <span className="text-[oklch(0.72_0.24_248)]">&gt;</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { id: "CLU-2.0", type: "SYSTEM", status: "ACTIVE" },
              { id: "QUORRA", type: "ISO", status: "ONLINE" },
              { id: "RINZLER", type: "PROGRAM", status: "STANDBY" },
            ].map((program) => (
              <div
                key={program.id}
                className="group relative bg-[oklch(0.05_0.01_240)] p-8 border border-[oklch(0.72_0.24_248/0.3)] hover:border-[oklch(0.72_0.24_248)] transition-all duration-300"
                style={{
                  clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)"
                }}
              >
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-[oklch(0.72_0.24_248)] opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-[oklch(0.72_0.24_248)] opacity-50 group-hover:opacity-100 transition-opacity" />

                {/* Disc visualization */}
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-2 border-[oklch(0.72_0.24_248/0.5)] rounded-full group-hover:border-[oklch(0.72_0.24_248)] transition-colors"
                    style={{ animation: "spin 8s linear infinite" }}
                  />
                  <div className="absolute inset-3 border border-[oklch(0.78_0.20_195/0.5)] rounded-full group-hover:border-[oklch(0.78_0.20_195)] transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-[oklch(0.72_0.24_248)] rounded-full group-hover:scale-150 transition-transform"
                      style={{ boxShadow: "0 0 15px oklch(0.72 0.24 248)" }}
                    />
                  </div>
                </div>

                <h3 className="font-display text-xl font-bold text-center tracking-wider mb-2 group-hover:text-[oklch(0.72_0.24_248)] transition-colors">
                  {program.id}
                </h3>
                <div className="text-center text-sm font-mono text-[oklch(0.55_0.015_240)]">
                  <span className="block">{program.type}</span>
                  <span className="text-[oklch(0.78_0.20_195)]">[{program.status}]</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* System Monitor */}
        <section className="px-6 md:px-8 py-16 max-w-7xl mx-auto">
          <div
            className="bg-[oklch(0.04_0.01_240)] border border-[oklch(0.72_0.24_248/0.3)] p-8"
            style={{
              clipPath: "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))"
            }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-3 h-3 bg-[oklch(0.78_0.20_195)] animate-pulse" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">
                System Diagnostics
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "GRID CYCLES", value: "847,293", trend: "+12.4%" },
                { label: "ACTIVE PROGRAMS", value: "1,247", trend: "-3.2%" },
                { label: "DATA STREAMS", value: "98.7%", trend: "+0.5%" },
                { label: "ENERGY UNITS", value: "∞", trend: "STABLE" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-mono font-bold mb-2" style={{
                    color: "oklch(0.72 0.24 248)",
                    textShadow: "0 0 10px oklch(0.72 0.24 248 / 0.5)"
                  }}>
                    {stat.value}
                  </div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[oklch(0.55_0.015_240)] mb-1">
                    {stat.label}
                  </div>
                  <div className="text-xs font-mono text-[oklch(0.78_0.20_195)]">
                    {stat.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Input Elements */}
        <section className="px-6 md:px-8 py-16 max-w-7xl mx-auto">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-8">
            <span className="text-[oklch(0.72_0.24_248)]">//</span> Interface Components
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-sm font-mono uppercase tracking-wider text-[oklch(0.55_0.015_240)]">
                Program Identifier
              </label>
              <input
                type="text"
                placeholder="ENTER ID"
                className="w-full px-4 py-3 bg-[oklch(0.04_0.01_240)] border border-[oklch(0.72_0.24_248/0.4)] font-mono text-lg tracking-wider placeholder:text-[oklch(0.35_0.015_240)] focus:border-[oklch(0.72_0.24_248)] focus:outline-none transition-colors"
                style={{
                  clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)"
                }}
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-mono uppercase tracking-wider text-[oklch(0.55_0.015_240)]">
                Access Level
              </label>
              <div className="flex gap-4">
                {["BASIC", "ADMIN", "ROOT"].map((level) => (
                  <button
                    key={level}
                    className="flex-1 py-3 border border-[oklch(0.72_0.24_248/0.4)] font-mono text-sm tracking-wider hover:bg-[oklch(0.72_0.24_248)] hover:text-[oklch(0.03_0.01_240)] hover:border-[oklch(0.72_0.24_248)] transition-all"
                    style={{
                      clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)"
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]"
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes grid-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
        .perspective-floor {
          perspective: 500px;
        }
      `}</style>
    </div>
  );
}
