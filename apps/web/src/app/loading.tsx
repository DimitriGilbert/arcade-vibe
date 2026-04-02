export default function HomeLoading() {
  return (
    <main className="home-shell bg-[var(--background)] text-[var(--foreground)]">
      <div className="home-backdrop">
        <div className="home-sky" />
        <div className="home-sun" />
        <div className="home-grid" />
        <div className="home-horizon" />
        <div className="home-decor-1" />
        <div className="home-decor-2" />
        <div className="home-decor-3" />
        <div className="home-scanlines" />
        <div className="home-vignette" />
      </div>
      <div className="home-content">
        <SkeletonMasthead />
        <SkeletonQuickStats />
        <SkeletonFeaturedArticle />
        <SkeletonFeatureSplit />
        <SkeletonLearnBento />
        <SkeletonOutro />
      </div>
    </main>
  );
}

function SkeletonMasthead() {
  return (
    <header className="home-hero relative py-12 md:py-20">
      <div className="home-hero-grid">
        <div className="home-hero-grid-lines" />
        <div className="home-hero-horizon" />
      </div>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <div className="h-4 w-48 bg-[var(--muted)]/30 rounded animate-pulse mb-4" />
            <div className="h-16 sm:h-24 md:h-32 w-3/4 bg-[var(--muted)]/30 rounded animate-pulse mb-2" />
            <div className="h-16 sm:h-24 md:h-32 w-1/2 bg-[var(--muted)]/30 rounded animate-pulse" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-5 w-full bg-[var(--muted)]/30 rounded animate-pulse mb-2" />
            <div className="h-5 w-5/6 bg-[var(--muted)]/30 rounded animate-pulse mb-2" />
            <div className="h-5 w-4/6 bg-[var(--muted)]/30 rounded animate-pulse mb-4" />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="h-12 w-36 bg-[var(--muted)]/30 rounded animate-pulse" />
              <div className="h-12 w-36 bg-[var(--muted)]/30 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function SkeletonQuickStats() {
  return (
    <div className="py-8 border-y border-[var(--border)] bg-[var(--card)]/20">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-12 md:gap-24">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-12 md:h-14 w-20 bg-[var(--muted)]/30 rounded animate-pulse mx-auto" />
              <div className="h-3 w-16 bg-[var(--muted)]/30 rounded animate-pulse mt-1 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonFeaturedArticle() {
  return (
    <article className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-6 w-24 bg-[var(--muted)]/30 rounded animate-pulse" />
          <div className="h-4 w-56 bg-[var(--muted)]/30 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="h-full min-h-[320px] bg-[var(--muted)]/30 rounded-lg animate-pulse p-8">
              <div className="h-10 w-3/4 bg-[var(--muted)] rounded animate-pulse mb-6" />
              <div className="h-5 w-full bg-[var(--muted)] rounded animate-pulse mb-2" />
              <div className="h-5 w-5/6 bg-[var(--muted)] rounded animate-pulse mb-8" />
              <div className="flex items-center gap-8 mb-8">
                <div>
                  <div className="h-3 w-16 bg-[var(--muted)] rounded animate-pulse mb-1" />
                  <div className="h-8 w-20 bg-[var(--muted)] rounded animate-pulse" />
                </div>
                <div>
                  <div className="h-3 w-16 bg-[var(--muted)] rounded animate-pulse mb-1" />
                  <div className="h-8 w-12 bg-[var(--muted)] rounded animate-pulse" />
                </div>
              </div>
              <div className="h-10 w-36 bg-[var(--muted)] rounded animate-pulse" />
            </div>
          </div>
          <aside className="lg:col-span-5">
            <div className="h-full min-h-[320px] bg-[var(--muted)]/30 rounded-lg animate-pulse">
              <div className="h-10 bg-[var(--muted)] rounded-t-lg animate-pulse" />
              <div className="divide-y divide-[var(--border)]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--muted)] animate-pulse shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-[var(--muted)] rounded animate-pulse mb-1" />
                      <div className="h-3 w-1/2 bg-[var(--muted)] rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-12 bg-[var(--muted)] rounded animate-pulse shrink-0" />
                  </div>
                ))}
              </div>
              <div className="h-10 bg-[var(--muted)] rounded-b-lg animate-pulse" />
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}

function SkeletonFeatureSplit() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="h-full min-h-[400px] bg-[var(--muted)]/30 rounded-lg animate-pulse p-8 md:p-10">
            <div className="h-4 w-24 bg-[var(--muted)] rounded animate-pulse" />
            <div className="h-10 w-3/4 bg-[var(--muted)] rounded animate-pulse mt-4 mb-6" />
            <div className="h-5 w-full bg-[var(--muted)] rounded animate-pulse mb-2" />
            <div className="h-5 w-5/6 bg-[var(--muted)] rounded animate-pulse mb-8" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--muted)] animate-pulse shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-16 bg-[var(--muted)] rounded animate-pulse mb-1" />
                    <div className="h-3 w-full bg-[var(--muted)] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-[var(--muted)]/30 rounded-lg animate-pulse p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 w-16 bg-[var(--muted)] rounded animate-pulse" />
                  <div className="h-5 w-10 bg-[var(--muted)] rounded animate-pulse" />
                </div>
                <div className="h-3 w-3/4 bg-[var(--muted)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SkeletonLearnBento() {
  return (
    <section className="py-6 bg-[var(--card)]/10">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <div className="h-4 w-36 bg-[var(--muted)]/30 rounded animate-pulse" />
          <div className="h-10 w-72 bg-[var(--muted)]/30 rounded animate-pulse mt-4" />
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-4 md:gap-5 auto-rows-[minmax(100px,auto)]">
          <div className="col-span-6 md:col-span-6 row-span-2 bg-[var(--muted)]/30 rounded-lg animate-pulse p-6 flex flex-col">
            <div className="w-14 h-14 rounded-xl bg-[var(--muted)] animate-pulse mb-4" />
            <div className="h-7 w-3/4 bg-[var(--muted)] rounded animate-pulse mb-4" />
            <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse mb-2" />
            <div className="h-4 w-5/6 bg-[var(--muted)] rounded animate-pulse mb-6" />
            <div className="h-4 w-4/6 bg-[var(--muted)] rounded animate-pulse" />
            <div className="mt-auto pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-6">
                <div className="h-8 w-16 bg-[var(--muted)] rounded animate-pulse" />
                <div className="w-px h-10 bg-[var(--border)]" />
                <div className="h-8 w-16 bg-[var(--muted)] rounded animate-pulse" />
              </div>
            </div>
          </div>

          <div className="col-span-6 sm:col-span-6 md:col-span-6 bg-[var(--muted)]/30 rounded-lg animate-pulse p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--muted)] animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-5 w-3/4 bg-[var(--muted)] rounded animate-pulse mb-2" />
                <div className="h-3 w-full bg-[var(--muted)] rounded animate-pulse" />
              </div>
            </div>
          </div>

          <div className="col-span-3 sm:col-span-3 md:col-span-3 bg-[var(--muted)]/30 rounded-lg animate-pulse p-4 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-lg bg-[var(--muted)] animate-pulse mb-4" />
            <div>
              <div className="h-4 w-3/4 bg-[var(--muted)] rounded animate-pulse mb-1" />
              <div className="h-3 w-full bg-[var(--muted)] rounded animate-pulse" />
            </div>
          </div>

          <div className="col-span-3 sm:col-span-3 md:col-span-3 row-span-3 bg-[var(--muted)]/30 rounded-lg animate-pulse p-5 flex flex-col justify-center">
            <div className="text-center">
              <div className="h-16 w-16 bg-[var(--muted)] rounded animate-pulse mx-auto mb-2" />
              <div className="h-4 w-16 bg-[var(--muted)] rounded animate-pulse mx-auto" />
            </div>
          </div>

          <div className="col-span-6 sm:col-span-7 md:col-span-7 bg-[var(--muted)]/30 rounded-lg animate-pulse p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--muted)] animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-5 w-3/4 bg-[var(--muted)] rounded animate-pulse mb-1" />
                <div className="h-3 w-full bg-[var(--muted)] rounded animate-pulse" />
              </div>
            </div>
          </div>

          <div className="col-span-6 sm:col-span-2 md:col-span-2 bg-[var(--muted)]/30 rounded-lg animate-pulse p-4 flex items-center justify-center">
            <div className="h-10 w-10 bg-[var(--muted)] rounded animate-pulse" />
          </div>

          <div className="col-span-6 sm:col-span-9 md:col-span-9 bg-[var(--muted)]/30 rounded-lg animate-pulse p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--muted)] animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-5 w-3/4 bg-[var(--muted)] rounded animate-pulse mb-1" />
                <div className="h-3 w-full bg-[var(--muted)] rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SkeletonOutro() {
  return (
    <footer className="py-16 relative synthwave-dark-text">
      <div className="absolute inset-0 opacity-20 home-cta-glow" />
      <div className="max-w-3xl mx-auto px-4 text-center relative">
        <div className="h-10 w-48 bg-[var(--muted)]/30 rounded animate-pulse mx-auto mb-6" />
        <div className="h-5 w-72 bg-[var(--muted)]/30 rounded animate-pulse mx-auto mb-8" />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="h-12 w-32 bg-[var(--muted)]/30 rounded animate-pulse" />
          <div className="h-12 w-40 bg-[var(--muted)]/30 rounded animate-pulse" />
        </div>
      </div>
    </footer>
  );
}
