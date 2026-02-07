import type { Route } from "next";
import Link from "next/link";

const demos = [
  {
    id: "midnight-arcade",
    title: "MIDNIGHT ARCADE",
    subtitle: "Tokyo After Dark",
    description:
      "Ultra-dark Tokyo alley vibes. Deep purple-black voids, hot pink neon signs reflecting on wet pavement, the hum of arcade cabinets in the distance.",
    href: "/demo/opus/midnight-arcade" as Route,
    gradient: "from-[oklch(0.68_0.28_345)] via-[oklch(0.62_0.30_320)] to-[oklch(0.65_0.25_295)]",
    accentColor: "neon-hot-pink",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12" aria-labelledby="midnight-icon">
        <title id="midnight-icon">Midnight Arcade</title>
        <path
          d="M12 2L2 7v10l10 5 10-5V7L12 2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M12 22V12M2 7l10 5 10-5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="8" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "tron-legacy",
    title: "TRON LEGACY",
    subtitle: "Digital Frontier",
    description:
      "Geometric wireframe perfection. Electric blue circuits on absolute black, precision lines, the digital grid stretching to infinity.",
    href: "/demo/opus/tron-legacy" as Route,
    gradient: "from-[oklch(0.72_0.24_248)] via-[oklch(0.78_0.20_195)] to-[oklch(0.65_0.25_295)]",
    accentColor: "neon-electric-blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12" aria-labelledby="tron-icon">
        <title id="tron-icon">Tron Legacy</title>
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="15" cy="15" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "synthwave-sunset",
    title: "SYNTHWAVE SUNSET",
    subtitle: "Miami Vice",
    description:
      "Retro-futuristic paradise. Palm silhouettes against gradient skies, chrome reflections, the eternal 1985 sunset that never ends.",
    href: "/demo/opus/synthwave-sunset" as Route,
    gradient: "from-[oklch(0.85_0.20_80)] via-[oklch(0.74_0.26_42)] to-[oklch(0.68_0.28_345)]",
    accentColor: "neon-amber-gold",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12" aria-labelledby="synthwave-icon">
        <title id="synthwave-icon">Synthwave Sunset</title>
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "glitch-palace",
    title: "GLITCH PALACE",
    subtitle: "VHS Memories",
    description:
      "Corrupted nostalgia. VHS tracking errors, RGB splits, scan lines and static. The beautiful chaos of degraded signals.",
    href: "/demo/opus/glitch-palace" as Route,
    gradient: "from-[oklch(0.78_0.20_195)] via-[oklch(0.80_0.22_140)] to-[oklch(0.72_0.24_248)]",
    accentColor: "neon-cyan-ice",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12" aria-labelledby="glitch-icon">
        <title id="glitch-icon">Glitch Palace</title>
        <rect
          x="2"
          y="6"
          width="20"
          height="12"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 12h6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 9h2M20 9h2M2 15h2M20 15h2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "pinball-wizard",
    title: "PINBALL WIZARD",
    subtitle: "Chrome Machine",
    description:
      "Metallic playfield energy. Gleaming chrome bumpers, incandescent bulb arrays, the mechanical ballet of steel balls.",
    href: "/demo/opus/pinball-wizard" as Route,
    gradient: "from-[oklch(0.80_0.22_140)] via-[oklch(0.85_0.20_80)] to-[oklch(0.74_0.26_42)]",
    accentColor: "neon-laser-green",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12" aria-labelledby="pinball-icon">
        <title id="pinball-icon">Pinball Wizard</title>
        <ellipse cx="12" cy="14" rx="8" ry="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="12" r="1.5" fill="currentColor" />
        <circle cx="16" cy="12" r="1.5" fill="currentColor" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
        <path d="M4 8l3 3M20 8l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export default function OpusDemoIndex() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Deep ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(var(--neon-royal-purple)/0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,oklch(var(--neon-electric-blue)/0.08),transparent_50%)]" />
      <div className="absolute inset-0 pattern-grid opacity-30" />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-[oklch(var(--neon-hot-pink)/0.05)] blur-3xl animate-float" />
      <div className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-[oklch(var(--neon-electric-blue)/0.05)] blur-3xl animate-float" style={{ animationDelay: "-2s" }} />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <header className="text-center mb-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[oklch(var(--neon-electric-blue)/0.4)] bg-[oklch(var(--neon-electric-blue)/0.1)] mb-8">
            <span className="w-2 h-2 rounded-full bg-[oklch(var(--neon-cyan-ice))] animate-neon-pulse" />
            <span className="text-sm font-mono tracking-widest text-[oklch(var(--neon-cyan-ice))] uppercase">
              Opus Design Proposals
            </span>
          </div>
          
          {/* Title */}
          <h1
            className="text-6xl md:text-8xl lg:text-9xl font-display font-black tracking-tighter uppercase mb-6 glitch-text"
            data-text="ARCADE VIBE"
          >
            <span className="bg-gradient-to-r from-[oklch(var(--neon-hot-pink))] via-[oklch(var(--neon-electric-blue))] to-[oklch(var(--neon-cyan-ice))] bg-clip-text text-transparent">
              ARCADE VIBE
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground font-body max-w-2xl mx-auto mb-8">
            Five distinct visual directions. Each one a different dimension of the 80s arcade experience.
          </p>
          
          {/* Back link */}
          <Link
            href={"/" as Route}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-[oklch(var(--neon-cyan-ice))] transition-colors font-mono text-sm uppercase tracking-wider group"
          >
            <svg
              className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Return to Main Menu
          </Link>
        </header>
        
        {/* Demo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {demos.map((demo, index) => (
            <Link
              key={demo.id}
              href={demo.href}
              className="group relative block"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="card-cabinet h-full p-6 md:p-8 transition-all duration-300 group-hover:scale-[1.02] group-hover:border-[oklch(var(--neon-electric-blue)/0.6)]">
                {/* Icon */}
                <div className={`text-[oklch(var(--${demo.accentColor}))] mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                  {demo.icon}
                </div>
                
                {/* Title */}
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-wide mb-2 group-hover:neon-text-cyan transition-all">
                  {demo.title}
                </h2>
                
                {/* Subtitle */}
                <p className="text-sm font-mono uppercase tracking-widest text-[oklch(var(--neon-royal-purple))] mb-4">
                  {demo.subtitle}
                </p>
                
                {/* Description */}
                <p className="text-muted-foreground font-body text-base leading-relaxed mb-6">
                  {demo.description}
                </p>
                
                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground group-hover:text-[oklch(var(--neon-cyan-ice))] transition-colors">
                  <span>Insert Coin</span>
                  <span className="animate-blink">_</span>
                  <svg
                    className="w-4 h-4 ml-auto transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                {/* Gradient accent line on hover */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${demo.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl`} />
              </div>
            </Link>
          ))}
        </div>
        
        {/* Footer */}
        <footer className="mt-20 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="coin-slot" />
            <span className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
              25¢ per play
            </span>
            <div className="coin-slot" />
          </div>
        </footer>
      </div>
      
      {/* Scanlines overlay */}
      <div className="crt-scanlines opacity-[0.03]" />
    </div>
  );
}
