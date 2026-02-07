import Link from "next/link";

const stalls = [
  { title: "Sticker Stack", detail: "Layered badges and decals" },
  { title: "Glow Market", detail: "Warm neon clashes" },
  { title: "Prize Alley", detail: "Arcade loot display" },
];

export default function NeonBazaarPage() {
  return (
    <div className="min-h-screen bg-[#120610] text-white relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(249,115,22,0.25),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.25),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_80%,rgba(168,85,247,0.2),transparent_55%)]" />

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between text-sm text-white/70 mb-10">
          <Link href="/demo/codex" className="hover:text-white transition-colors">
            ← Back to Codex
          </Link>
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="lg:w-1/2">
            <p className="text-xs uppercase tracking-[0.5em] text-orange-300/80">Neon Bazaar</p>
            <h1 className="mt-4 text-5xl md:text-6xl font-black tracking-tight">
              Arcade street market chaos — vivid, layered, and loud.
            </h1>
            <p className="mt-6 text-lg text-white/70">
              This direction leans into the clutter of prizes, flyers, and ticket counters. It feels playful, warm, and full of
              tactile posters.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Sticker-led CTAs", "Warm neon mix", "Layered shadows"].map((chip) => (
                <span key={chip} className="px-4 py-2 rounded-full bg-white/10 text-sm text-white/80 border border-white/20">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 space-y-5">
            {stalls.map((stall, index) => (
              <div
                key={stall.title}
                className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-[0_0_30px_rgba(249,115,22,0.15)]"
                style={{ transform: `rotate(${index % 2 === 0 ? -1.5 : 1.5}deg)` }}
              >
                <div className="text-xs uppercase tracking-[0.4em] text-orange-200/80">{stall.title}</div>
                <div className="mt-3 text-white/80">{stall.detail}</div>
                <div className="mt-4 flex gap-2">
                  {["#ff7a00", "#ff3aa7", "#a855f7"].map((color) => (
                    <span key={`${stall.title}-${color}`} className="h-6 w-6 rounded-full border border-white/30" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.35em] text-orange-300/80">Prize Counter</div>
                <div className="mt-3 text-3xl font-black">Ticket Exchange</div>
              </div>
              <span className="px-4 py-2 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-200 text-xs uppercase tracking-[0.3em]">
                Live
              </span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                { title: "Holo Stickers", price: "120 TIX" },
                { title: "Glow Bands", price: "250 TIX" },
                { title: "Mega Plush", price: "980 TIX" },
                { title: "Arcade Pass", price: "420 TIX" },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="mt-1 text-xs text-white/60">{item.price}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-orange-400/40 bg-[#f8f3f7] text-[#3b1b2d] p-8">
            <div className="text-xs uppercase tracking-[0.3em] text-orange-500">Light Theme Preview</div>
            <h2 className="mt-4 text-2xl font-bold">Soft Bazaar</h2>
            <p className="mt-2 text-sm text-[#5b3a4b]">
              Creamy lilac surfaces with warm neon signage, keeping the ambiance playful but gentle.
            </p>
            <div className="mt-5 rounded-2xl bg-white p-4 border border-[#f0d8e7]">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Neon Vendor</span>
                <span className="text-orange-500">Open</span>
              </div>
              <button type="button" className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 font-semibold">
                Grab Tokens
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
