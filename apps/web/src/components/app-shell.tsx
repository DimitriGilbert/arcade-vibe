"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/header";
import { MobileHeader } from "@/components/mobile-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { Footer } from "@/components/footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-rows-[auto_minmax(0,1fr)_auto] min-h-svh">
      <Header />
      <MobileHeader />
      <main id="main-content" className="min-h-0 overflow-hidden">
        {children}
      </main>
      <div className="pb-14 lg:pb-0">
        <Footer />
      </div>
      <MobileBottomNav />
    </div>
  );
}
