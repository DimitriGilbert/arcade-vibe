import { cn } from "@/lib/utils";

interface ArcadeGridProps {
  animated?: boolean;
  perspective?: boolean;
  className?: string;
}

export function ArcadeGrid({
  animated = true,
  perspective = false,
  className,
}: ArcadeGridProps) {
  return (
    <div
      data-slot="arcade-grid"
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className={cn("absolute inset-0", perspective && "perspective-[500px]")}
      >
        <div
          className={cn(
            "absolute inset-0 origin-center",
            perspective && "rotate-x-60 translate-y-[50%] scale-150",
          )}
        >
          {/* Grid lines */}
          <div
            className={cn(
              "absolute inset-0",
              "bg-[linear-gradient(var(--grid-color,var(--primary)/0.3)_1px,transparent_1px),linear-gradient(90deg,var(--grid-color,var(--primary)/0.3)_1px,transparent_1px)]",
              "bg-[size:40px_40px]",
              animated && "animate-[arcade-grid-move_10s_linear_infinite]",
            )}
          />

          {/* Glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-[var(--background)]" />
        </div>
      </div>
    </div>
  );
}

// Add keyframes for grid animation
const style =
  typeof document !== "undefined" ? document.createElement("style") : null;

if (style) {
  style.textContent = `
    @keyframes arcade-grid-move {
      0% {
        background-position: 0 0;
      }
      100% {
        background-position: 0 40px;
      }
    }
  `;
  document.head.appendChild(style);
}
