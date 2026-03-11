import { headers } from "next/headers";
import Link from "next/link";

export async function Footer() {
  const headersList = await headers();
  const pathname = headersList.get("x-matched-path") ?? "";

  if (/^\/games\/[^/]+$/.test(pathname)) {
    return null;
  }

  return (
    <footer className="border-t border-[var(--border)]/50 py-4 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[var(--muted-foreground)]/60">
        <span className="opacity-50">© {new Date().getFullYear()} dbuild.dev</span>
        <span className="opacity-30">·</span>
        <Link href="/privacy" className="hover:text-[var(--muted-foreground)] transition-colors">
          Privacy
        </Link>
        <span className="opacity-30">·</span>
        <Link href="/terms" className="hover:text-[var(--muted-foreground)] transition-colors">
          Terms
        </Link>
        <span className="opacity-30">·</span>
        <a
          href="https://x.com/DimitriGilbert"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--muted-foreground)] transition-colors"
        >
          X
        </a>
        <span className="opacity-30">·</span>
        <a
          href="https://github.com/DimitriGilbert"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--muted-foreground)] transition-colors"
        >
          GitHub
        </a>
        <span className="opacity-30">·</span>
        <a
          href="https://dbuild.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--muted-foreground)] transition-colors"
        >
          dbuild.dev
        </a>
      </div>
    </footer>
  );
}
