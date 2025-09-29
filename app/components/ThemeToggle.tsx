"use client";

import { useEffect, useState } from "react";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize on mount to avoid SSR/CSR mismatches
    const initial = getInitialTheme();
    setTheme(initial);
    const root = document.documentElement;
    if (initial === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const current: "light" | "dark" = theme ?? (root.classList.contains("dark") ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    window.localStorage.setItem("theme", next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/80 p-2 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-neutral-900 transition"
      aria-label="Toggle theme"
      title="Toggle theme"
   >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        {mounted && (theme ?? "light") === "dark" ? (
          // Moon icon for dark
          <path d="M21.752 15.002A9.718 9.718 0 0112 21.75 9.75 9.75 0 1112 3a.75.75 0 01.694 1.026 8.251 8.251 0 009.058 10.976.75.75 0 010 1.5z" />
        ) : (
          // Sun icon for light / initial
          <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3A.75.75 0 0112 2.25zm0 13.5a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM4.5 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H5.25A.75.75 0 014.5 12zm10.5 0a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H15.75a.75.75 0 01-.75-.75zM7.28 5.47a.75.75 0 011.06 0l1.591 1.591a.75.75 0 11-1.06 1.06L7.28 6.53a.75.75 0 010-1.06zm6.789 10.6a.75.75 0 011.06 0l1.591 1.591a.75.75 0 11-1.06 1.06l-1.591-1.591a.75.75 0 010-1.06zM5.47 16.72a.75.75 0 010-1.06l1.591-1.591a.75.75 0 111.06 1.06L6.53 16.72a.75.75 0 01-1.06 0zm10.6-6.789a.75.75 0 010-1.06l1.591-1.591a.75.75 0 111.06 1.06L16.03 8.87a.75.75 0 01-1.06 0z" clipRule="evenodd" />
        )}
      </svg>
    </button>
  );
}


