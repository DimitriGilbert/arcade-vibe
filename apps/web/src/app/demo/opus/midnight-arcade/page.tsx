"use client";

import type { Route } from "next";
import Link from "next/link";

export default function MidnightArcade() {
  return (
    <div className="min-h-screen bg-[oklch(0.06_0.02_280)] text-[oklch(0.98_0.005_280)] relative overflow-hidden">
      {/* Tokyo rain effect - using CSS instead of dynamic elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rain-container" />

      {/* Deep ambient glow - like distant neon signs */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,oklch(0.68_0.28_345/0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.65_0.25_295/0.06),transparent_50%)]" />

      {/* Wet pavement reflection */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[oklch(0.08_0.02_280)] to-transparent opacity-80" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="p-6 md:p-8">
          <Link
            href={"/demo/opus" as Route}
            className="inline-flex items-center gap-2 text-[oklch(0.55_0.015_280)] hover:text-[oklch(0.68_0.28_345)] transition-colors font-mono text-sm uppercase tracking-wider group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Selection
          </Link>
        </nav>

        {/* Hero Section */}
        <section className="px-6 md:px-8 py-20 md:py-32 max-w-7xl mx-auto">
          {/* Kanji decoration */}
          <div className="absolute top-20 right-8 md:right-20 text-[120px] md:text-[200px] font-display font-black text-[oklch(0.68_0.28_345/0.05)] select-none leading-none">
            夜
          </div>

          <div className="relative">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 mb-8">
              <span className="w-8 h-px bg-gradient-to-r from-[oklch(0.68_0.28_345)] to-transparent" />
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-[oklch(0.68_0.28_345)]">
                Proposal 01
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight uppercase mb-6">
              <span className="block text-[oklch(0.68_0.28_345)]" style={{
                textShadow: `
                  0 0 20px oklch(0.68 0.28 345),
                  0 0 40px oklch(0.68 0.28 345 / 0.6),
                  0 0 80px oklch(0.68 0.28 345 / 0.3)
                `
              }}>
                MIDNIGHT
              </span>
              <span className="block text-[oklch(0.62_0.30_320)]" style={{
                textShadow: `
                  0 0 20px oklch(0.62 0.30 320),
                  0 0 40px oklch(0.62 0.30 320 / 0.6)
                `
              }}>
                ARCADE
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-[oklch(0.72_0.015_280)] font-body max-w-2xl mb-12">
              Tokyo after dark. Where neon dreams flicker in rain-slicked alleys
              and the rhythmic pulse of arcade cabinets calls you home.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <button type="button" className="px-8 py-4 bg-gradient-to-r from-[oklch(0.68_0.28_345)] to-[oklch(0.62_0.30_320)] text-[oklch(0.06_0.02_280)] font-display font-bold uppercase tracking-wider rounded-lg transition-all hover:scale-105"
                style={{
                  boxShadow: `
                    0 0 30px oklch(0.68 0.28 345 / 0.4),
                    0 4px 0 oklch(0.50 0.25 345)
                  `
                }}
              >
                Insert Coin
              </button>
              <button type="button" className="px-8 py-4 border-2 border-[oklch(0.65_0.25_295)] text-[oklch(0.65_0.25_295)] font-display font-bold uppercase tracking-wider rounded-lg transition-all hover:bg-[oklch(0.65_0.25_295/0.1)]"
                style={{
                  boxShadow: `0 0 20px oklch(0.65 0.25 295 / 0.2)`
                }}
              >
                High Scores
              </button>
            </div>
          </div>
        </section>

        {/* Cabinet Grid Section */}
        <section className="px-6 md:px-8 py-16 max-w-7xl mx-auto">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-8 text-[oklch(0.75_0.01_280)]">
            <span className="text-[oklch(0.68_0.28_345)]">{"//"}</span> Featured Cabinets
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "CYBER HUNTER", players: "1-2P", credits: 1, color: "345" },
              { name: "NEON RACER X", players: "1P", credits: 2, color: "320" },
              { name: "PIXEL SAMURAI", players: "1P", credits: 1, color: "295" },
            ].map((game) => (
              <div
                key={game.name}
                className="group relative bg-[oklch(0.10_0.02_280)] rounded-xl p-6 border border-[oklch(0.20_0.04_280)] hover:border-[oklch(0.68_0.28_345/0.5)] transition-all duration-300"
                style={{
                  boxShadow: `
                    inset 0 1px 0 oklch(1 0 0 / 0.05),
                    0 10px 40px oklch(0 0 0 / 0.4)
                  `
                }}
              >
                {/* Marquee glow */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[oklch(0.68_0.28_${game.color})] to-transparent opacity-60 group-hover:opacity-100 transition-opacity`}
                />

                {/* Screen area */}
                <div className="aspect-[4/3] bg-[oklch(0.06_0.015_280)] rounded-lg mb-4 flex items-center justify-center border border-[oklch(0.15_0.02_280)]"
                  style={{
                    boxShadow: `
                      inset 0 0 30px oklch(0.68 0.28 ${game.color} / 0.1),
                      inset 0 2px 4px oklch(0 0 0 / 0.5)
                    `
                  }}
                >
                  <span className="font-display text-3xl font-bold text-[oklch(0.68_0.28_345/0.3)] group-hover:text-[oklch(0.68_0.28_345)] transition-colors">
                    DEMO
                  </span>
                </div>

                {/* Game info */}
                <h3 className="font-display text-xl font-bold tracking-wide mb-2 group-hover:text-[oklch(0.68_0.28_345)] transition-colors">
                  {game.name}
                </h3>
                <div className="flex items-center justify-between text-sm font-mono text-[oklch(0.55_0.015_280)]">
                  <span>{game.players}</span>
                  <span>{game.credits} CREDIT{game.credits > 1 ? "S" : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Score Panel */}
        <section className="px-6 md:px-8 py-16 max-w-7xl mx-auto">
          <div className="bg-[oklch(0.08_0.015_280)] rounded-2xl p-8 border border-[oklch(0.15_0.02_280)]"
            style={{
              boxShadow: `
                inset 0 1px 0 oklch(1 0 0 / 0.05),
                0 20px 60px oklch(0 0 0 / 0.5),
                0 0 40px oklch(0.68 0.28 345 / 0.1)
              `
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-3 h-3 rounded-full bg-[oklch(0.68_0.28_345)] animate-pulse" />
              <h2 className="text-xl font-display font-bold uppercase tracking-wider">
                Today&apos;s High Scores
              </h2>
            </div>

            <div className="space-y-3">
              {[
                { rank: 1, name: "AAA", score: 999999 },
                { rank: 2, name: "TKY", score: 888888 },
                { rank: 3, name: "NEO", score: 777777 },
              ].map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center gap-6 py-3 border-b border-[oklch(0.15_0.02_280)] last:border-0"
                >
                  <span className="w-8 text-2xl font-display font-bold text-[oklch(0.68_0.28_345)]">
                    {entry.rank}
                  </span>
                  <span className="flex-1 font-mono text-xl tracking-widest">
                    {entry.name}
                  </span>
                  <span className="font-mono text-2xl tabular-nums text-[oklch(0.68_0.28_345)]"
                    style={{
                      textShadow: `0 0 10px oklch(0.68 0.28 345 / 0.5)`
                    }}
                  >
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Elements Demo */}
        <section className="px-6 md:px-8 py-16 max-w-7xl mx-auto">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-8 text-[oklch(0.75_0.01_280)]">
            <span className="text-[oklch(0.68_0.28_345)]">{"//"}</span> Interface Elements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label htmlFor="player-name" className="block text-sm font-mono uppercase tracking-wider text-[oklch(0.55_0.015_280)]">
                Player Name
              </label>
              <input
                id="player-name"
                type="text"
                placeholder="ENTER YOUR NAME"
                className="w-full px-4 py-3 bg-[oklch(0.06_0.015_280)] border-2 border-[oklch(0.20_0.04_280)] rounded-lg font-mono text-lg tracking-wider placeholder:text-[oklch(0.35_0.015_280)] focus:border-[oklch(0.68_0.28_345)] focus:outline-none transition-colors"
                style={{
                  boxShadow: `inset 0 2px 4px oklch(0 0 0 / 0.3)`
                }}
              />
            </div>

            <div className="space-y-4">
              <label htmlFor="difficulty-select" className="block text-sm font-mono uppercase tracking-wider text-[oklch(0.55_0.015_280)]">
                Difficulty
              </label>
              <select
                id="difficulty-select"
                className="w-full px-4 py-3 bg-[oklch(0.06_0.015_280)] border-2 border-[oklch(0.20_0.04_280)] rounded-lg font-mono text-lg tracking-wider focus:border-[oklch(0.68_0.28_345)] focus:outline-none transition-colors appearance-none cursor-pointer"
                style={{
                  boxShadow: `inset 0 2px 4px oklch(0 0 0 / 0.3)`
                }}
              >
                <option>EASY</option>
                <option>NORMAL</option>
                <option>HARD</option>
                <option>INSANE</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            oklch(0 0 0 / 0.15) 0px,
            oklch(0 0 0 / 0.15) 1px,
            transparent 1px,
            transparent 3px
          )`
        }}
      />

      <style jsx>{`
        @keyframes rain-fall {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
