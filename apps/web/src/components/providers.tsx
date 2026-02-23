"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import dynamic from "next/dynamic";

import { queryClient } from "@/utils/trpc";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

const MusicProvider = dynamic(
  () => import("@/contexts/music-context").then((module) => module.MusicProvider),
  { ssr: false }
);

const themes = ["synthwave", "tron", "pixel", "cabinet", "vaporwave"] as const;

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="synthwave"
      themes={[...themes]}
    >
      <MusicProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools />
        </QueryClientProvider>
      </MusicProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
