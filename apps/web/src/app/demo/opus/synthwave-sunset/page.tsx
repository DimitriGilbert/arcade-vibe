"use client";

import type { Route } from "next";
import Link from "next/link";

export default function SynthwaveSunset() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: `linear-gradient(180deg,
        oklch(0.25 0.08 280) 0%,
        oklch(0.35 0.15 320) 30%,
        oklch(0.55 0.25 25) 60%,
        oklch(0.75 0.22 50) 80%,
        oklch(0.85 0.20 80) 100%
      )`
    }}>
      {/* Sun */}
      <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(180deg,
              oklch(0.90 0.18 80) 0%,
              oklch(0.80 0.22 60) 40%,
              oklch(0.70 0.26 42) 70%,
              oklch(0.65 0.28 345) 100%
            )`,
            maskImage: `repeating-linear-gradient(
              180deg,
              black 0px,
              black 6px,
              transparent 6px,
              transparent 12px
            )`,
          }}
        />
        {/* Sun glow */}
        <div
          className="absolute inset-[-50%] rounded-full opacity-50"
          style={{
            background: `radial-gradient(circle, oklch(0.80 0.22 60 / 0.4) 0%, transparent 50%)`
          }}
        />
      </div>

      {/* Perspective grid floor */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%]" style={{ perspective: "500px" }}>
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(oklch(0.68 0.28 345 / 0.6) 1px, transparent 1px),
              linear-gradient(90deg, oklch(0.68 0.28 345 / 0.6) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            transform: "rotateX(70deg)",
            transformOrigin: "center top",
            animation: "grid-move 10s linear infinite",
          }}
        />
        {/* Horizon line glow */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[oklch(0.68_0.28_345)] to-transparent blur-sm" />
      </div>

      {/* Palm silhouettes */}
      <div className="absolute bottom-[25%] left-[5%] w-32 h-48 md:w-48 md:h-72 opacity-90">
        <svg viewBox="0 0 100 150" className="w-full h-full fill-[oklch(0.08_0.02_280)]">
          <title>Palm tree silhouette left</title>
          <path d="M50 150 L48 80 Q30 70 10 50 Q35 65 48 70 Q35 55 20 35 Q40 55 48 65 Q40 45 30 25 Q48 50 50 60 Q52 50 70 25 Q60 45 52 65 Q60 55 80 35 Q65 55 52 70 Q65 65 90 50 Q70 70 52 80 L50 150 Z" />
        </svg>
      </div>
      <div className="absolute bottom-[20%] right-[8%] w-24 h-36 md:w-40 md:h-60 opacity-80">
        <svg viewBox="0 0 100 150" className="w-full h-full fill-[oklch(0.08_0.02_280)]">
          <title>Palm tree silhouette right</title>
          <path d="M50 150 L48 80 Q30 70 10 50 Q35 65 48 70 Q35 55 20 35 Q40 55 48 65 Q40 45 30 25 Q48 50 50 60 Q52 50 70 25 Q60 45 52 65 Q60 55 80 35 Q65 55 52 70 Q65 65 90 50 Q70 70 52 80 L50 150 Z" />
        </svg>
      </div>

      <div className="relative z-10 text-[oklch(0.98_0.005_280)]">
        {/* Navigation */}
        <nav className="p-6 md:p-8">
          <Link
            href={"/demo/opus" as Route}
            className="inline-flex items-center gap-2 text-[oklch(0.90_0.01_280)] hover:text-[oklch(0.68_0.28_345)] transition-colors font-mono text-sm uppercase tracking-wider group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Selection
          </Link>
        </nav>

        {/* Hero Section */}
        <section className="px-6 md:px-8 py-12 md:py-20 max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 mb-8">
            <span className="w-8 h-px bg-gradient-to-r from-transparent to-[oklch(0.68_0.28_345)]" />
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-[oklch(0.68_0.28_345)]">
              Proposal 03
            </span>
            <span className="w-8 h-px bg-gradient-to-l from-transparent to-[oklch(0.68_0.28_345)]" />
          </div>

          {/* Title with chrome effect */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight uppercase mb-6">
            <span
              className="block"
              style={{
                background: `linear-gradient(180deg,
                  oklch(0.98 0.005 280) 0%,
                  oklch(0.75 0.015 280) 40%,
                  oklch(0.98 0.005 280) 50%,
                  oklch(0.60 0.02 280) 100%
                )`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                textShadow: "0 4px 8px oklch(0 0 0 / 0.3)",
              }}
            >
              SYNTHWAVE
            </span>
            <span
              className="block"
              style={{
                background: `linear-gradient(180deg,
                  oklch(0.68 0.28 345) 0%,
                  oklch(0.74 0.26 42) 50%,
                  oklch(0.85 0.20 80) 100%
                )`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              SUNSET
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-[oklch(0.98_0.005_280/0.9)] font-body max-w-2xl mx-auto mb-12 drop-shadow-lg">
            Where the sun never sets and 1985 lasts forever.
            Chrome dreams and neon schemes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              className="px-8 py-4 font-display font-bold uppercase tracking-wider rounded-full transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, oklch(0.68 0.28 345), oklch(0.74 0.26 42))`,
                boxShadow: `
                  0 0 30px oklch(0.68 0.28 345 / 0.5),
                  0 4px 15px oklch(0 0 0 / 0.3),
                  inset 0 1px 0 oklch(1 0 0 / 0.3)
                `,
                color: "oklch(0.98 0.005 280)",
              }}
            >
              Start Cruising
            </button>
            <button
              type="button"
              className="px-8 py-4 font-display font-bold uppercase tracking-wider rounded-full border-2 border-[oklch(0.78_0.20_195)] text-[oklch(0.78_0.20_195)] transition-all hover:bg-[oklch(0.78_0.20_195/0.2)]"
              style={{
                boxShadow: `0 0 20px oklch(0.78 0.20 195 / 0.3)`
              }}
            >
              View Gallery
            </button>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="px-6 md:px-8 py-16 max-w-7xl mx-auto">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-8 text-center text-[oklch(0.98_0.005_280)]">
            Featured Experiences
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "NIGHT DRIVE", subtitle: "Endless Highway", icon: "M" },
              { title: "NEON CITY", subtitle: "Downtown Lights", icon: "N" },
              { title: "BEACH RUN", subtitle: "Ocean Breeze", icon: "B" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl p-8 backdrop-blur-md transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, oklch(0.25 0.08 280 / 0.6), oklch(0.35 0.15 320 / 0.4))`,
                  border: `1px solid oklch(0.68 0.28 345 / 0.3)`,
                  boxShadow: `0 10px 40px oklch(0 0 0 / 0.3)`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-full mb-6 flex items-center justify-center text-2xl font-display font-black"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.68 0.28 345), oklch(0.74 0.26 42))`,
                    boxShadow: `0 0 20px oklch(0.68 0.28 345 / 0.5)`,
                  }}
                >
                  {feature.icon}
                </div>

                <h3 className="font-display text-xl font-bold tracking-wide mb-2 group-hover:text-[oklch(0.68_0.28_345)] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm font-mono text-[oklch(0.80_0.01_280)]">
                  {feature.subtitle}
                </p>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gradient-to-r from-[oklch(0.68_0.28_345)] via-[oklch(0.74_0.26_42)] to-[oklch(0.85_0.20_80)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-6 md:px-8 py-16 max-w-7xl mx-auto">
          <div
            className="rounded-3xl p-8 md:p-12 backdrop-blur-md"
            style={{
              background: `linear-gradient(135deg, oklch(0.15 0.05 280 / 0.8), oklch(0.25 0.08 300 / 0.6))`,
              border: `1px solid oklch(0.68 0.28 345 / 0.3)`,
              boxShadow: `
                0 20px 60px oklch(0 0 0 / 0.4),
                inset 0 1px 0 oklch(1 0 0 / 0.1)
              `,
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "1985", label: "ETERNAL YEAR" },
                { value: "∞", label: "SUNSETS" },
                { value: "88", label: "MPH REQUIRED" },
                { value: "24/7", label: "NEON GLOW" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    className="text-4xl md:text-5xl font-display font-black mb-2"
                    style={{
                      background: `linear-gradient(180deg, oklch(0.85 0.20 80), oklch(0.68 0.28 345))`,
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[oklch(0.70_0.01_280)]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="px-6 md:px-8 py-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider mb-8 text-center">
            Join the Cruise
          </h2>

          <div
            className="rounded-2xl p-8 backdrop-blur-md"
            style={{
              background: `linear-gradient(135deg, oklch(0.20 0.06 280 / 0.7), oklch(0.30 0.10 300 / 0.5))`,
              border: `1px solid oklch(0.68 0.28 345 / 0.3)`,
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="driver-name" className="block text-sm font-mono uppercase tracking-wider text-[oklch(0.70_0.01_280)]">
                  Driver Name
                </label>
                <input
                  id="driver-name"
                  type="text"
                  placeholder="YOUR NAME"
                  className="w-full px-4 py-3 rounded-full font-mono text-lg tracking-wider placeholder:text-[oklch(0.40_0.01_280)] focus:outline-none transition-all"
                  style={{
                    background: `oklch(0.10 0.02 280 / 0.8)`,
                    border: `2px solid oklch(0.68 0.28 345 / 0.4)`,
                    color: `oklch(0.98 0.005 280)`,
                  }}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="car-select" className="block text-sm font-mono uppercase tracking-wider text-[oklch(0.70_0.01_280)]">
                  Choose Your Ride
                </label>
                <select
                  id="car-select"
                  className="w-full px-4 py-3 rounded-full font-mono text-lg tracking-wider focus:outline-none transition-all appearance-none cursor-pointer"
                  style={{
                    background: `oklch(0.10 0.02 280 / 0.8)`,
                    border: `2px solid oklch(0.68 0.28 345 / 0.4)`,
                    color: `oklch(0.98 0.005 280)`,
                  }}
                >
                  <option>TESTAROSSA</option>
                  <option>COUNTACH</option>
                  <option>DELOREAN</option>
                </select>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Scan lines */}
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
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
      `}</style>
    </div>
  );
}
