"use client";

import type { Route } from "next";
import Link from "next/link";

export default function PinballWizard() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: `linear-gradient(180deg,
        oklch(0.12 0.02 280) 0%,
        oklch(0.08 0.015 275) 50%,
        oklch(0.06 0.01 270) 100%
      )`
    }}>
      {/* Metallic ambient reflections */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.80_0.22_140/0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,oklch(0.85_0.20_80/0.06),transparent_50%)]" />

      {/* Light array dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`light-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              background: i % 3 === 0 
                ? "oklch(0.60 0.28 25)" 
                : i % 3 === 1 
                  ? "oklch(0.85 0.20 80)" 
                  : "oklch(0.80 0.22 140)",
              boxShadow: `0 0 10px currentColor`,
              animation: `bulb-flash ${1 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-[oklch(0.98_0.005_280)]">
        {/* Navigation */}
        <nav className="p-6 md:p-8">
          <Link
            href={"/demo/opus" as Route}
            className="inline-flex items-center gap-2 text-[oklch(0.55_0.015_280)] hover:text-[oklch(0.80_0.22_140)] transition-colors font-mono text-sm uppercase tracking-wider group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Selection
          </Link>
        </nav>

        {/* Hero Section */}
        <section className="px-6 md:px-8 py-20 md:py-32 max-w-7xl mx-auto text-center">
          {/* Chrome bumper decoration */}
          <div className="flex justify-center mb-12">
            <div className="relative">
              {/* Central bumper */}
              <div
                className="w-32 h-32 md:w-48 md:h-48 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(145deg,
                    oklch(0.85 0.01 280) 0%,
                    oklch(0.50 0.02 280) 40%,
                    oklch(0.75 0.01 280) 50%,
                    oklch(0.40 0.02 280) 100%
                  )`,
                  boxShadow: `
                    0 0 40px oklch(0.80 0.22 140 / 0.3),
                    inset 0 -4px 8px oklch(0 0 0 / 0.3),
                    inset 0 4px 8px oklch(1 0 0 / 0.2)
                  `,
                }}
              >
                <div
                  className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center text-4xl md:text-5xl font-display font-black"
                  style={{
                    background: `linear-gradient(145deg,
                      oklch(0.60 0.28 25) 0%,
                      oklch(0.45 0.25 25) 50%,
                      oklch(0.55 0.26 25) 100%
                    )`,
                    boxShadow: `
                      0 0 30px oklch(0.60 0.28 25 / 0.5),
                      inset 0 2px 4px oklch(1 0 0 / 0.3)
                    `,
                    color: "oklch(0.98 0.005 280)",
                  }}
                >
                  1M
                </div>
              </div>
              
              {/* Orbiting balls */}
              <div
                className="absolute w-8 h-8 rounded-full"
                style={{
                  top: "-10%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: `radial-gradient(circle at 30% 30%,
                    oklch(0.90 0.01 280) 0%,
                    oklch(0.60 0.02 280) 50%,
                    oklch(0.40 0.02 280) 100%
                  )`,
                  boxShadow: `0 4px 8px oklch(0 0 0 / 0.4)`,
                  animation: "orbit 3s linear infinite",
                }}
              />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-3 mb-8">
            <span className="w-8 h-1 bg-gradient-to-r from-[oklch(0.60_0.28_25)] to-transparent rounded-full" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-[oklch(0.85_0.20_80)]">
              Proposal 05
            </span>
            <span className="w-8 h-1 bg-gradient-to-l from-[oklch(0.60_0.28_25)] to-transparent rounded-full" />
          </div>

          {/* Title with metallic chrome effect */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight uppercase mb-6">
            <span
              className="block"
              style={{
                background: `linear-gradient(180deg,
                  oklch(0.95 0.01 280) 0%,
                  oklch(0.65 0.02 280) 35%,
                  oklch(0.90 0.01 280) 50%,
                  oklch(0.55 0.02 280) 65%,
                  oklch(0.85 0.01 280) 100%
                )`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                textShadow: "0 4px 8px oklch(0 0 0 / 0.3)",
              }}
            >
              PINBALL
            </span>
            <span
              className="block"
              style={{
                background: `linear-gradient(180deg,
                  oklch(0.85 0.20 80) 0%,
                  oklch(0.60 0.28 25) 50%,
                  oklch(0.80 0.22 140) 100%
                )`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              WIZARD
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-[oklch(0.72_0.015_280)] font-body max-w-2xl mx-auto mb-12">
            Chrome dreams and steel ball screams.
            The mechanical symphony of the arcade.
          </p>

          {/* Flipper buttons */}
          <div className="flex justify-center gap-8">
            <button
              type="button"
              className="px-8 py-4 font-display font-bold uppercase tracking-wider rounded-full transition-all active:scale-95"
              style={{
                background: `linear-gradient(180deg,
                  oklch(0.60 0.28 25) 0%,
                  oklch(0.45 0.25 25) 100%
                )`,
                boxShadow: `
                  0 6px 0 oklch(0.35 0.22 25),
                  0 8px 20px oklch(0 0 0 / 0.4),
                  inset 0 2px 4px oklch(1 0 0 / 0.3)
                `,
                color: "oklch(0.98 0.005 280)",
              }}
            >
              Left Flipper
            </button>
            <button
              type="button"
              className="px-8 py-4 font-display font-bold uppercase tracking-wider rounded-full transition-all active:scale-95"
              style={{
                background: `linear-gradient(180deg,
                  oklch(0.60 0.28 25) 0%,
                  oklch(0.45 0.25 25) 100%
                )`,
                boxShadow: `
                  0 6px 0 oklch(0.35 0.22 25),
                  0 8px 20px oklch(0 0 0 / 0.4),
                  inset 0 2px 4px oklch(1 0 0 / 0.3)
                `,
                color: "oklch(0.98 0.005 280)",
              }}
            >
              Right Flipper
            </button>
          </div>
        </section>

        {/* Scoreboard */}
        <section className="px-6 md:px-8 py-16 max-w-7xl mx-auto">
          <div
            className="rounded-2xl p-8 md:p-12"
            style={{
              background: `linear-gradient(180deg,
                oklch(0.15 0.02 280) 0%,
                oklch(0.10 0.015 275) 100%
              )`,
              border: `3px solid oklch(0.30 0.03 280)`,
              boxShadow: `
                0 20px 60px oklch(0 0 0 / 0.5),
                inset 0 1px 0 oklch(1 0 0 / 0.1),
                inset 0 -1px 0 oklch(0 0 0 / 0.3)
              `,
            }}
          >
            {/* Segment display header */}
            <div className="flex items-center justify-between mb-8">
              <div className="font-mono text-sm text-[oklch(0.50_0.01_280)]">PLAYER 1</div>
              <div className="flex gap-2">
                {[1, 2, 3].map((ball) => (
                  <div
                    key={ball}
                    className="w-4 h-4 rounded-full"
                    style={{
                      background: ball === 1 
                        ? `radial-gradient(circle at 30% 30%, oklch(0.90 0.01 280), oklch(0.50 0.02 280))`
                        : `oklch(0.20 0.02 280)`,
                      boxShadow: ball === 1 ? `0 0 10px oklch(0.80 0.01 280)` : "none",
                    }}
                  />
                ))}
              </div>
              <div className="font-mono text-sm text-[oklch(0.50_0.01_280)]">BALL 1</div>
            </div>

            {/* LED Score Display */}
            <div className="text-center mb-8">
              <div
                className="inline-block px-8 py-4 rounded-lg"
                style={{
                  background: `oklch(0.05 0.01 280)`,
                  border: `2px solid oklch(0.20 0.02 280)`,
                  boxShadow: `inset 0 2px 8px oklch(0 0 0 / 0.5)`,
                }}
              >
                <span
                  className="font-mono text-5xl md:text-7xl font-bold tracking-wider"
                  style={{
                    color: "oklch(0.85 0.20 80)",
                    textShadow: `
                      0 0 10px oklch(0.85 0.20 80),
                      0 0 20px oklch(0.85 0.20 80 / 0.5),
                      0 0 40px oklch(0.85 0.20 80 / 0.3)
                    `,
                  }}
                >
                  12,847,500
                </span>
              </div>
            </div>

            {/* Multiplier and bonus */}
            <div className="grid grid-cols-3 gap-8 text-center">
              {[
                { label: "MULTIPLIER", value: "5X" },
                { label: "BONUS", value: "250K" },
                { label: "COMBO", value: "12" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div
                    className="text-3xl md:text-4xl font-mono font-bold mb-2"
                    style={{
                      color: "oklch(0.80 0.22 140)",
                      textShadow: `0 0 10px oklch(0.80 0.22 140 / 0.5)`,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs font-mono text-[oklch(0.45_0.01_280)]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Target Features */}
        <section className="px-6 md:px-8 py-16 max-w-7xl mx-auto">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-8 text-center">
            Target Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "DROP TARGETS", value: "5/5", reward: "50,000 PTS", color: "25" },
              { title: "SPINNERS", value: "ACTIVE", reward: "1,000/SPIN", color: "80" },
              { title: "RAMPS", value: "3X", reward: "SUPER JACKPOT", color: "140" },
            ].map((target) => (
              <div
                key={target.title}
                className="group relative rounded-xl p-6 transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(180deg,
                    oklch(0.12 0.02 280) 0%,
                    oklch(0.08 0.015 280) 100%
                  )`,
                  border: `2px solid oklch(0.25 0.03 280)`,
                  boxShadow: `
                    0 10px 30px oklch(0 0 0 / 0.4),
                    inset 0 1px 0 oklch(1 0 0 / 0.1)
                  `,
                }}
              >
                {/* Light indicator */}
                <div
                  className="w-4 h-4 rounded-full mb-4"
                  style={{
                    background: `oklch(0.60 0.28 ${target.color})`,
                    boxShadow: `0 0 15px oklch(0.60 0.28 ${target.color})`,
                    animation: "bulb-flash 1s ease-in-out infinite",
                  }}
                />

                <h3 className="font-display text-lg font-bold tracking-wide mb-2">
                  {target.title}
                </h3>
                <div className="text-2xl font-mono font-bold mb-2"
                  style={{ color: `oklch(0.60 0.28 ${target.color})` }}
                >
                  {target.value}
                </div>
                <div className="text-xs font-mono text-[oklch(0.50_0.01_280)]">
                  {target.reward}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Controls / Form */}
        <section className="px-6 md:px-8 py-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-8 text-center">
            Insert Initials
          </h2>

          <div
            className="rounded-xl p-8"
            style={{
              background: `linear-gradient(180deg,
                oklch(0.10 0.015 280) 0%,
                oklch(0.07 0.01 275) 100%
              )`,
              border: `2px solid oklch(0.25 0.03 280)`,
              boxShadow: `inset 0 0 30px oklch(0 0 0 / 0.3)`,
            }}
          >
            <div className="flex justify-center gap-4 mb-8">
              {["A", "A", "A"].map((letter, i) => (
                <div
                  key={`initial-${i}`}
                  className="w-20 h-24 rounded-lg flex items-center justify-center text-4xl font-display font-black"
                  style={{
                    background: `oklch(0.05 0.01 280)`,
                    border: `2px solid oklch(0.30 0.03 280)`,
                    color: "oklch(0.85 0.20 80)",
                    textShadow: `0 0 10px oklch(0.85 0.20 80 / 0.5)`,
                    boxShadow: `inset 0 2px 8px oklch(0 0 0 / 0.5)`,
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="px-6 py-3 rounded-lg font-mono font-bold uppercase tracking-wider transition-all active:scale-95"
                style={{
                  background: `linear-gradient(180deg, oklch(0.25 0.03 280), oklch(0.18 0.02 280))`,
                  border: `2px solid oklch(0.35 0.03 280)`,
                  boxShadow: `0 4px 0 oklch(0.12 0.02 280)`,
                }}
              >
                Previous
              </button>
              <button
                type="button"
                className="px-6 py-3 rounded-lg font-mono font-bold uppercase tracking-wider transition-all active:scale-95"
                style={{
                  background: `linear-gradient(180deg, oklch(0.80 0.22 140), oklch(0.65 0.20 140))`,
                  color: "oklch(0.06 0.01 280)",
                  boxShadow: `
                    0 4px 0 oklch(0.50 0.18 140),
                    0 0 20px oklch(0.80 0.22 140 / 0.3)
                  `,
                }}
              >
                Confirm
              </button>
              <button
                type="button"
                className="px-6 py-3 rounded-lg font-mono font-bold uppercase tracking-wider transition-all active:scale-95"
                style={{
                  background: `linear-gradient(180deg, oklch(0.25 0.03 280), oklch(0.18 0.02 280))`,
                  border: `2px solid oklch(0.35 0.03 280)`,
                  boxShadow: `0 4px 0 oklch(0.12 0.02 280)`,
                }}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Subtle scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            oklch(0 0 0 / 0.1) 0px,
            oklch(0 0 0 / 0.1) 1px,
            transparent 1px,
            transparent 3px
          )`
        }}
      />

      <style jsx>{`
        @keyframes bulb-flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes orbit {
          from { transform: translateX(-50%) rotate(0deg) translateY(-80px) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg) translateY(-80px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}
