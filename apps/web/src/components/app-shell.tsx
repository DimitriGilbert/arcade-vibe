"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/header";
import { MobileHeader } from "@/components/mobile-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Footer } from "@/components/footer";

/**
 * Immersive routes where global navigation is suppressed
 * to maximise screen real estate (IDE, game player).
 */
const IMMERSIVE_ROUTE_PATTERNS = [
  /^\/creator\/ide/,
  /^\/game\/[^/]+$/,
];

function isImmersiveRoute(pathname: string): boolean {
  return IMMERSIVE_ROUTE_PATTERNS.some((re) => re.test(pathname));
}

/**
 * AppShell wraps the page content with the appropriate
 * header, footer, and bottom nav depending on:
 * - viewport (mobile vs desktop) via CSS `lg:` classes
 * - route (immersive pages suppress all chrome)
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive = isImmersiveRoute(pathname);

  return (
    <div className="grid grid-rows-[auto_minmax(0,1fr)_auto] min-h-svh">
      {/* Desktop header — always visible, hidden on mobile for immersive routes */}
      {immersive ? (
        <div className="hidden lg:block">
          <Header />
        </div>
      ) : (
        <Header />
      )}
      {/* Mobile header — hidden on desktop */}
      {!immersive && <MobileHeader />}

      <main id="main-content" className="min-h-0 overflow-y-auto">
        {children}
      </main>

      {!immersive && (
        <>
          {/* Footer — add bottom padding on mobile to clear bottom nav */}
          <div className="pb-14 lg:pb-0">
            <Footer />
          </div>
          {/* Mobile bottom nav — hidden on desktop */}
          <MobileBottomNav />
        </>
      )}
    </div>
  );
}
