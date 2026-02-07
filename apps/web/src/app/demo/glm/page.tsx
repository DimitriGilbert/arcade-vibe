import Link from "next/link";
import type { Route } from "next";

const proposals = [
  {
    id: "cyberpunk",
    name: "Cyberpunk Arcade",
    description: "Neon synthwave aesthetic with electric blue, pink, and purple gradients",
    features: ["Glowing neon borders", "Geometric patterns", "CRT scan lines", "Futuristic typography"],
    color: "from-blue-500 via-purple-500 to-pink-500",
  },
  {
    id: "retro-pixel",
    name: "Retro Pixel Arcade",
    description: "8-bit nostalgia with pixel art, blocky fonts, and game boy inspired colors",
    features: ["Pixel fonts", "Blocky UI elements", "Retro color palette", "Sprite animations"],
    color: "from-green-500 via-yellow-500 to-red-500",
  },
  {
    id: "glitchwave",
    name: "Glitchwave Arcade",
    description: "Modern glitch aesthetic with chromatic aberration and digital distortion",
    features: ["Glitch animations", "Chromatic effects", "Digital noise", "Split screen layouts"],
    color: "from-cyan-500 via-pink-500 to-purple-500",
  },
  {
    id: "neon-minimal",
    name: "Neon Minimalist Arcade",
    description: "Clean neon with bold lines, ample whitespace, and refined typography",
    features: ["Clean lines", "Minimal icons", "Refined spacing", "Bold typography"],
    color: "from-indigo-500 via-blue-500 to-cyan-500",
  },
  {
    id: "vhs",
    name: "VHS Arcade",
    description: "Analog retro with tape distortion, warm colors, and 80s video aesthetics",
    features: ["VHS tracking lines", "Warm color grading", "Analog noise", "Rounded corners"],
    color: "from-orange-500 via-red-500 to-pink-500",
  },
];

export default function DemoIndex() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Arcade Vibe Design Proposals
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore 5 distinct interpretations of the arcade theme, each capturing a unique facet of 80s nostalgia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {proposals.map((proposal) => (
            <Link
              key={proposal.id}
              href={`/demo/glm/${proposal.id}` as Route}
              className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${proposal.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <div className="relative p-8">
                <div className={`h-2 w-20 mb-6 rounded-full bg-gradient-to-r ${proposal.color} group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-300`} />
                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-pink-400 transition-all duration-300">
                  {proposal.name}
                </h2>
                <p className="text-gray-400 mb-6 leading-relaxed">{proposal.description}</p>
                <ul className="space-y-2">
                  {proposal.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm text-gray-300">
                      <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${proposal.color} mr-2`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex items-center text-purple-400 font-semibold group-hover:text-pink-400 transition-colors">
                  View Proposal
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Arrow right">
                    <title>View proposal</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-8 py-4 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-700 hover:border-purple-500 transition-all duration-300 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Arrow left">
              <title>Back to home</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
