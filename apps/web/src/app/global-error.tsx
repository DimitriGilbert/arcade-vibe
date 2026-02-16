"use client";

import { useEffect } from "react";
import { ArcadeButton } from "@/components/arcade";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-[var(--destructive)]" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold">Something went wrong</h1>
              <p className="text-[var(--muted-foreground)]">
                {error.message || "An unexpected error occurred. Please try again."}
              </p>
              {error.digest && (
                <p className="text-xs text-[var(--muted-foreground)] font-mono">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <ArcadeButton variant="primary" onClick={reset}>
                <RefreshCw className="h-4 w-4" />
                Try again
              </ArcadeButton>
              <Link href="/">
                <ArcadeButton variant="outline">
                  <Home className="h-4 w-4" />
                  Go home
                </ArcadeButton>
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
