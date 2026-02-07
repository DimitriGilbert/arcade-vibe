import type { Route } from "next";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Arcade Vibe
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Experience the 80s arcade aesthetic with 5 distinct design proposals
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 flex-wrap">
          <Link
            href={"/demo/3.0-pro" as Route}
            className="w-full md:w-auto inline-flex items-center px-12 py-6 bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue text-white text-xl font-black rounded-2xl hover:scale-110 hover:shadow-[0_0_40px_rgba(255,0,255,0.4)] transition-all duration-500 animate-pulse border-2 border-white/20"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            ENTER THE 3.0 PRO ARCADE
            <svg className="w-8 h-8 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </Link>
          <Link
            href={"/demo/opus" as Route}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-fuchsia-500 via-purple-600 to-blue-600 text-white text-lg font-bold rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-fuchsia-500/30 transition-all duration-300"
          >
            View Opus Proposals
            <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href={"/demo/glm" as Route}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-bold rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300"
          >
            View GLM Proposals
            <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Arrow right">
              <title>View GLM proposals</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href={"/demo/codex" as Route}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500 text-white text-lg font-bold rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/30 transition-all duration-300"
          >
            View codex&apos;s Proposals
            <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Arrow right">
              <title>View Kimi proposals</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href={"/demo/kimi" as Route}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500 text-white text-lg font-bold rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/30 transition-all duration-300"
          >
            View Kimi&apos;s Proposals
            <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Arrow right">
              <title>View Kimi proposals</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href={"/demo/gemini" as Route}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white text-lg font-bold rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30 transition-all duration-300"
          >
            View Gemini&apos;s Proposals
            <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Arrow right">
              <title>View Gemini proposals</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href={"/demo/gpt-5.2" as Route}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-500 text-white text-lg font-bold rounded-2xl hover:scale-105 hover:shadow-2xl hover:shadow-amber-400/30 transition-all duration-300"
          >
            View GPT-5.2 Proposals
            <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Arrow right">
              <title>View GPT-5.2 proposals</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
