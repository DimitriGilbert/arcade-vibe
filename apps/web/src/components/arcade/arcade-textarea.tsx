import type { TextareaHTMLAttributes } from "react";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

interface ArcadeTextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
> {
  label?: string;
  error?: string;
  className?: string;
}

export const ArcadeTextarea = forwardRef<
  HTMLTextAreaElement,
  ArcadeTextareaProps
>(({ label, error, className, placeholder, id, ...props }, ref) => {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-[var(--foreground)]"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        placeholder={placeholder}
        className={cn(
          "w-full min-h-[100px] px-4 py-3 rounded-[var(--radius)]",
          "bg-[var(--input)] border-2 border-[var(--border)]",
          "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
          "transition-all duration-200",
          "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20",
          "hover:border-[var(--primary)]/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "resize-y",
          error &&
            "border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive)]/20",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  );
});

ArcadeTextarea.displayName = "ArcadeTextarea";
