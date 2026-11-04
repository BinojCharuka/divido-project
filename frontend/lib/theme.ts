"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "divido-theme";
export const THEME_EVENT_NAME = "divido-theme-change";

export function getSystemTheme(): Theme {
  if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY);
    if (val === "dark" || val === "light") return val;
  } catch {
    // storage unavailable
  }
  return null;
}

export function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const stored = getStoredTheme();
  if (stored) return stored;
  if (document.documentElement.classList.contains("dark") || document.documentElement.dataset.theme === "dark") {
    return "dark";
  }
  return getSystemTheme();
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage unavailable
  }

  window.dispatchEvent(new CustomEvent(THEME_EVENT_NAME, { detail: theme }));
}

export function toggleTheme(): Theme {
  const current = getCurrentTheme();
  const next: Theme = current === "light" ? "dark" : "light";
  applyTheme(next);
  return next;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(THEME_EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useDividoTheme(): {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  mounted: boolean;
} {
  const theme = useSyncExternalStore(
    subscribe,
    getCurrentTheme,
    () => "light" as Theme,
  );

  return {
    theme,
    setTheme: applyTheme,
    toggleTheme,
    mounted: true,
  };
}
