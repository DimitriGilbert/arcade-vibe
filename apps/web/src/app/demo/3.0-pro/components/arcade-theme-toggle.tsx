"use client";

import { useState, useEffect } from "react";

export function ArcadeThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (document.documentElement.classList.contains("light")) {
      setIsLight(true);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("light")) {
      root.classList.remove("light");
      root.classList.add("dark"); // Assuming dark is default or explicit
      setIsLight(false);
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      setIsLight(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="group relative inline-flex items-center justify-center px-4 py-2 font-display text-sm font-bold text-neon-yellow transition-all duration-200 hover:text-black z-50"
    >
      <span className="absolute inset-0 border-2 border-neon-yellow opacity-80 skew-x-[-12deg] transition-all duration-200 group-hover:bg-neon-yellow group-hover:shadow-[0_0_20px_var(--color-neon-yellow)]"></span>
      <span className="relative z-10">
        {isLight ? "LIGHTS: ON" : "LIGHTS: OFF"}
      </span>
    </button>
  );
}
