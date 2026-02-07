import Link from "next/link";
import type { Route } from "next";

const proposals = [
  {
    id: "neon-noir",
    name: "Neon Noir",
    description: "Cinematic dark aesthetic with deep purples and hot pinks. Blade Runner meets arcade culture in a cyberpunk metropolis.",
    features: ["Neon-drenched streets", "CRT scanlines", "Cinematic atmosphere", "Dark purple-pink palette"],
    gradient: "from-pink-600 via-purple-600 to-blue-600",
    glowColor: "rgba(236, 72, 153, 0.5)",
  },
  {
    id: "miami-vice",
    name: "Miami Vice",
    description: "Pastel neons with pink, cyan, and teal gradients. Summer of 1986 vibes with sunset aesthetics.",
    features: ["Pastel color palette", "Palm tree silhouettes", "Sunset gradients", "Clean modern cards"],
    gradient: "from-pink-400 via-pink-300 to-cyan-400",
    glowColor: "rgba(255, 107, 157, 0.5)",
  },
  {
    id: "cyber-deck",
    name: "Cyber Deck",
    description: "Green terminal aesthetic like a hacker's interface. Pure retro computing with system logs and command lines.",
    features: ["Terminal interface", "Matrix-style rain", "CRT curvature", "Monospace typography"],
    gradient: "from-green-500 to-green-700",
    glowColor: "rgba(0, 255, 65, 0.5)",
  },
  {
    id: "arcade-cabinet",
    name: "Arcade Cabinet",
    description: "Literal arcade booth design with wood textures, CRT screen, joystick, and action buttons.",
    features: ["Physical cabinet design", "CRT screen effect", "Joystick & buttons", "Wood textures"],
    gradient: "from-yellow-500 via-orange-500 to-red-500",
    glowColor: "rgba(255, 152, 0, 0.5)",
  },
  {
    id: "vaporwave-grid",
    name: "Vaporwave Grid",
    description: "Classic vaporwave with grid floor, geometric shapes, Japanese text, and sunset gradients.",
    features: ["Grid floor perspective", "Geometric shapes", "Japanese text", "Pink-purple-blue gradients"],
    gradient: "from-pink-500 via-purple-500 to-blue-500",
    glowColor: "rgba(131, 56, 236, 0.5)",
  },
];

export default function KimiDemoIndex() {
  return (
    <div 
      className="min-h-screen p-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1030 50%, #0f1a30 100%)',
      }}
    >
      {/* Background effects */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(131, 56, 236, 0.1), transparent)',
        }}
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div 
            className="inline-block px-6 py-2 mb-6 rounded-full text-sm font-bold tracking-widest"
            style={{
              background: 'rgba(236, 72, 153, 0.1)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              color: '#ec4899',
            }}
          >
            KIMI&apos;S COLLECTION
          </div>
          <h1 
            className="text-5xl md:text-7xl font-black mb-6"
            style={{
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(236, 72, 153, 0.3))',
            }}
          >
            Arcade Vibe Proposals
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Five distinct interpretations of the 80&apos;s arcade aesthetic. 
            Each capturing a unique facet of retro gaming culture.
          </p>
        </div>

        {/* Proposal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {proposals.map((proposal) => (
            <Link
              key={proposal.id}
              href={`/demo/kimi/${proposal.id}` as Route}
              className="group relative block p-8 rounded-2xl transition-all duration-500 hover:scale-105"
              style={{
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)`,
              }}
            >
              {/* Hover glow effect */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${proposal.glowColor}, transparent 70%)`,
                }}
              />
              
              {/* Top gradient bar */}
              <div 
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${proposal.gradient} rounded-t-2xl`}
              />
              
              <div className="relative z-10">
                {/* Title */}
                <h2 
                  className="text-2xl font-black mb-3 group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300"
                  style={{
                    backgroundImage: `linear-gradient(135deg, white, white)`,
                  }}
                >
                  <span className={`bg-gradient-to-r ${proposal.gradient} bg-clip-text text-transparent`}>
                    {proposal.name}
                  </span>
                </h2>
                
                {/* Description */}
                <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                  {proposal.description}
                </p>
                
                {/* Features */}
                <ul className="space-y-2 mb-8">
                  {proposal.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm text-gray-500">
                      <div 
                        className={`w-2 h-2 rounded-full bg-gradient-to-r ${proposal.gradient} mr-3`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {/* CTA */}
                <div 
                  className="flex items-center text-sm font-bold tracking-wider transition-all duration-300 group-hover:translate-x-2"
                  style={{ color: '#ec4899' }}
                >
                  View Proposal
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <title>Arrow right</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Compare All Button */}
        <div className="text-center mb-16">
          <div 
            className="inline-block p-8 rounded-2xl"
            style={{
              background: 'rgba(20, 20, 30, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <p className="text-gray-400 mb-6">
              Can&apos;t decide? Take a tour through all proposals to compare styles.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {proposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  href={`/demo/kimi/${proposal.id}` as Route}
                  className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 hover:scale-105 bg-gradient-to-r ${proposal.gradient} text-white`}
                >
                  {proposal.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-gray-800">
          <div className="text-gray-500 text-sm">
            5 Design Proposals • 5 Unique Aesthetics
          </div>
          <div className="flex gap-6">
            <Link 
              href="/" 
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <Link 
              href="/demo/glm" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              View GLM Proposals →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
