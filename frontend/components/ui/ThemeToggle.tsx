"use client";

import { Moon, Sun } from "lucide-react";
import { useDividoTheme } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useDividoTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 transition-all shadow-xs cursor-pointer ${className}`}
    >
      {mounted && theme === "dark" ? (
        <Sun size={17} className="text-amber-400 transition-transform hover:rotate-12" />
      ) : (
        <Moon size={17} className="transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
