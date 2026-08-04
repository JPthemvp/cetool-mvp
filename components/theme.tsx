"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "cyber-essentials-tool.theme";

/**
 * Applied before first paint, inlined in <head>.
 *
 * Without this the page renders in the default theme and then corrects itself
 * once React hydrates, which is a visible white flash for anyone on dark — the
 * exact users most bothered by it. Reading localStorage synchronously here costs
 * a millisecond and removes the flash entirely.
 */
export const themeScript = `(function(){try{
var t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
if(!t){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}
document.documentElement.setAttribute("data-theme",t);
}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(readTheme());
    setMounted(true);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode. The theme still applies for this session.
    }
  };

  return { theme, setTheme, mounted };
}

/**
 * The toggle.
 *
 * Renders nothing until mounted, because the server does not know which theme
 * the browser will choose and a mismatched icon on first paint is worse than a
 * momentary gap.
 */
export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();
  if (!mounted) return <span className="h-7 w-7" aria-hidden />;

  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      onClick={() => setTheme(next)}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
      className="grid h-7 w-7 place-items-center rounded-lg border border-ink-600/80 text-brand-200 transition hover:border-brand-400 hover:text-brand-50"
    >
      {theme === "dark" ? (
        // Sun — clicking moves you to light.
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // Moon — clicking moves you to dark.
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
