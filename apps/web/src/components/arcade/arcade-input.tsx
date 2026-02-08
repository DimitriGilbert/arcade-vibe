import type { InputHTMLAttributes } from "react";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

interface ArcadeInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className"
> {
  label?: string;
  error?: string;
  className?: string;
}

export const ArcadeInput = forwardRef<HTMLInputElement, ArcadeInputProps>(
  (
    { label, error, className, type = "text", placeholder, id, ...props },
    ref,
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--foreground)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          className={cn(
            "w-full h-10 px-4 rounded-lg",
            "bg-[var(--input)] border-2 border-[var(--border)]",
            "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
            "transition-all duration-200",
            "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20",
            "hover:border-[var(--primary)]/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error &&
              "border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive)]/20",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
      </div>
    );
  },
);

ArcadeInput.displayName = "ArcadeInput";
