"use client";

import type { Route } from "next";
import type { ReactNode } from "react";

import Link from "next/link";
import {
  Gamepad2,
  Send,
  Trophy,
  Zap,
  Star,
  Users,
  Code2,
  Timer,
  Sparkles,
  ArrowRight,
  Play,
} from "lucide-react";

import {
  ArcadeCard,
  ArcadeButton,
  ArcadeBadge,
  ArcadeStats,
  ArcadeGrid,
} from "@/components/arcade";

// Mock data for the homepage
const HOW_IT_WORKS_STEPS = [
  {
    title: "CRAFT",
    description:
      "Write your single-shot prompt. No context, no history - pure instruction to generate a playable game.",
    icon: Code2,
  },
  {
    title: "SUBMIT",
    description:
      "Choose your model difficulty. From powerhouse AIs to tiny models - higher risk, higher reward.",
    icon: Send,
  },
  {
    title: "COMPETE",
    description:
      "The community plays and rates your game. Climb the leaderboard and earn eternal glory.",
    icon: Trophy,
  },
] as const;

const MODEL_TIERS = [
  {
    name: "Cheater",
    models: "GPT-5.3, Opus-4.6",
    multiplier: "1x",
    description: "Maximum power, minimum glory",
    variant: "default" as const,
  },
  {
    name: "Normal",
    models: "GLM-4.7, Kimi-k2.5",
    multiplier: "1.5x",
    description: "Balanced competition",
    variant: "default" as const,
  },
  {
    name: "Hard",
    models: "Deepseek-3.2, GPT-5.1-mini, Haiku-4.5",
    multiplier: "2x",
    description: "Challenge mode activated",
    variant: "neon" as const,
  },
  {
    name: "Impossible",
    models: "Tiny models",
    multiplier: "3x",
    description: "Ultimate glory awaits",
    variant: "neon" as const,
  },
] as const;

const MOCK_STATS = [
  {
    value: "2,847",
    label: "Games Created",
    icon: <Gamepad2 className="size-4" />,
  },
  {
    value: "1,234",
    label: "Prompt Engineers",
    icon: <Users className="size-4" />,
  },
  { value: "15.2K", label: "Ratings Given", icon: <Star className="size-4" /> },
  { value: "892", label: "Prompts Forked", icon: <Code2 className="size-4" /> },
];

const TOP_PLAYERS = [
  { rank: 1, name: "PromptMaster", score: 2847 },
  { rank: 2, name: "NeonCoder", score: 2651 },
  { rank: 3, name: "PixelAlchemist", score: 2498 },
] as const;

// Animation keyframes as inline styles
const styles = `
  @keyframes title-glow {
    0%, 100% {
      text-shadow: 
        0 0 20px var(--glow-color, oklch(0.68 0.28 345 / 0.5)),
        0 0 40px var(--glow-color, oklch(0.68 0.28 345 / 0.3));
    }
    50% {
      text-shadow: 
        0 0 30px var(--glow-color, oklch(0.68 0.28 345 / 0.7)),
        0 0 60px var(--glow-color, oklch(0.68 0.28 345 / 0.5)),
        0 0 80px var(--glow-color, oklch(0.68 0.28 345 / 0.3));
    }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulse-border {
    0%, 100% { border-color: var(--primary); }
    50% { border-color: var(--accent); }
  }

  .animate-title-glow {
    animation: title-glow 3s ease-in-out infinite;
  }

  .animate-float {
    animation: float 4s ease-in-out infinite;
  }

  .animate-pulse-border {
    animation: pulse-border 2s ease-in-out infinite;
  }
`;

// Section wrapper component
function Section({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative py-16 md:py-24 ${className ?? ""}`}>
      {children}
    </section>
  );
}

// Section title component
function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Hero Section
function HeroSection() {
  return (
    <Section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated grid background */}
      <ArcadeGrid animated perspective className="opacity-30" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Main title */}
        <h1
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight mb-6 animate-title-glow"
          style={{
            background: "var(--gradient-accent-full, var(--gradient-accent))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          ARCADE VIBE
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl lg:text-3xl text-[var(--foreground)] mb-4 font-semibold">
          One prompt. One shot. One month to prove you're the best prompt
          engineer.
        </p>

        <p className="text-base md:text-lg text-[var(--muted-foreground)] mb-10 max-w-2xl mx-auto">
          Competitive prompt engineering disguised as a retro arcade. Craft the
          perfect prompt, generate playable games, and climb the eternal
          leaderboard.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={"/arcade" as Route}>
            <ArcadeButton variant="glow" size="lg">
              <Play className="size-5" />
              Start Playing
            </ArcadeButton>
          </Link>
          <Link href={"/arcade" as Route}>
            <ArcadeButton variant="outline" size="lg">
              <Trophy className="size-5" />
              View Leaderboard
            </ArcadeButton>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 border-2 border-[var(--primary)] rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-[var(--primary)] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </Section>
  );
}

// How It Works Section
function HowItWorksSection() {
  return (
    <Section className="bg-[var(--card)]/30">
      <div className="max-w-6xl mx-auto px-4">
        <SectionTitle
          title="How It Works"
          subtitle="Master the art of single-shot prompt engineering in three steps"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <ArcadeCard
                key={step.title}
                variant="glow"
                className="text-center hover:scale-105 transition-transform duration-300"
              >
                <div className="p-6">
                  {/* Step number */}
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-[var(--primary)]">
                      {index + 1}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                    <Icon className="size-8 text-[var(--primary)]" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-3">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {step.description}
                  </p>
                </div>
              </ArcadeCard>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

// Model Tiers Section
function ModelTiersSection() {
  return (
    <Section>
      <div className="max-w-6xl mx-auto px-4">
        <SectionTitle
          title="Choose Your Weapon"
          subtitle="Select your model difficulty - smaller models mean higher multipliers"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODEL_TIERS.map((tier) => (
            <ArcadeCard
              key={tier.name}
              className="relative overflow-hidden hover:border-[var(--primary)] transition-colors duration-300"
            >
              <div className="p-5">
                {/* Tier badge */}
                <div className="flex items-center justify-between mb-4">
                  <ArcadeBadge
                    text={tier.name}
                    variant={tier.variant}
                    className="text-sm"
                  />
                  <span className="text-lg font-bold text-[var(--accent)]">
                    {tier.multiplier}
                  </span>
                </div>

                {/* Models */}
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                  {tier.models}
                </p>

                {/* Description */}
                <p className="text-xs text-[var(--muted-foreground)]">
                  {tier.description}
                </p>

                {/* Multiplier indicator */}
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-[var(--accent)]" />
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Score Multiplier
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{
                        width:
                          tier.multiplier === "1x"
                            ? "25%"
                            : tier.multiplier === "1.5x"
                              ? "50%"
                              : tier.multiplier === "2x"
                                ? "75%"
                                : "100%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </ArcadeCard>
          ))}
        </div>
      </div>
    </Section>
  );
}

// Monthly Challenge Section
function MonthlyChallengeSection() {
  return (
    <Section className="bg-[var(--card)]/30">
      <div className="max-w-6xl mx-auto px-4">
        <SectionTitle
          title="Monthly Challenge"
          subtitle="A new theme every month. Fresh leaderboards. Eternal glory."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current theme card */}
          <ArcadeCard variant="glow" className="animate-pulse-border border-2">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="size-6 text-[var(--accent)]" />
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Current Theme
                </h3>
              </div>

              <h4 className="text-3xl font-black text-[var(--primary)] mb-4">
                RETRO RACERS
              </h4>

              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Create a racing game with retro aesthetics. Think pixel art,
                chiptune sounds, and fast-paced action.
              </p>

              {/* Countdown placeholder */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--background)]/50">
                <Timer className="size-5 text-[var(--accent)]" />
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Time remaining
                  </p>
                  <p className="text-lg font-bold text-[var(--foreground)]">
                    18 days 14 hours
                  </p>
                </div>
              </div>

              <Link href={"/arcade" as Route} className="block mt-6">
                <ArcadeButton variant="primary" className="w-full">
                  Enter Challenge
                  <ArrowRight className="size-4" />
                </ArcadeButton>
              </Link>
            </div>
          </ArcadeCard>

          {/* Top 3 leaderboard preview */}
          <ArcadeCard>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="size-6 text-[var(--accent)]" />
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Top Players This Month
                </h3>
              </div>

              <div className="space-y-4">
                {TOP_PLAYERS.map((player) => (
                  <div
                    key={player.name}
                    className="flex items-center gap-4 p-3 rounded-lg bg-[var(--background)]/50 hover:bg-[var(--primary)]/10 transition-colors"
                  >
                    {/* Rank */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        player.rank === 1
                          ? "bg-yellow-500/20 text-yellow-500"
                          : player.rank === 2
                            ? "bg-gray-400/20 text-gray-400"
                            : "bg-amber-700/20 text-amber-600"
                      }`}
                    >
                      {player.rank}
                    </div>

                    {/* Player info */}
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--foreground)]">
                        {player.name}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {player.score} points
                      </p>
                    </div>

                    {/* Score badge */}
                    <ArcadeBadge text={`${player.score}`} variant="default" />
                  </div>
                ))}
              </div>

              <Link href={"/arcade" as Route} className="block mt-6">
                <ArcadeButton variant="outline" className="w-full">
                  View Full Leaderboard
                </ArcadeButton>
              </Link>
            </div>
          </ArcadeCard>
        </div>
      </div>
    </Section>
  );
}

// Stats Section
function StatsSection() {
  return (
    <Section>
      <div className="max-w-6xl mx-auto px-4">
        <SectionTitle
          title="The Arena Awaits"
          subtitle="Join thousands of prompt engineers competing for glory"
        />

        <ArcadeStats stats={MOCK_STATS} className="max-w-4xl mx-auto" />
      </div>
    </Section>
  );
}

// CTA Footer Section
function CTASection() {
  return (
    <Section className="relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at center, var(--primary), transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--foreground)] mb-6">
          Ready to Enter the Arena?
        </h2>

        <p className="text-lg text-[var(--muted-foreground)] mb-8">
          The prompt is your weapon. The model is your handicap. The leaderboard
          is immortal.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={"/login" as Route}>
            <ArcadeButton variant="glow" size="lg">
              <Gamepad2 className="size-5" />
              Create Account
            </ArcadeButton>
          </Link>
          <Link href={"/arcade" as Route}>
            <ArcadeButton variant="secondary" size="lg">
              Browse Games
            </ArcadeButton>
          </Link>
        </div>

        {/* Footer tagline */}
        <p className="mt-12 text-sm text-[var(--muted-foreground)]">
          Welcome to{" "}
          <span className="font-bold text-[var(--primary)]">Arcade Vibe</span>.
          May the best prompt win.
        </p>
      </div>
    </Section>
  );
}

// Main Homepage Component
export default function Home() {
  return (
    <>
      {/* Inject animations */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Main content */}
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <HeroSection />
        <HowItWorksSection />
        <ModelTiersSection />
        <MonthlyChallengeSection />
        <StatsSection />
        <CTASection />
      </main>
    </>
  );
}
