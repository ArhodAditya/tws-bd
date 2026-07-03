"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// Premium light/dark switch for the global navigation. The two icons swap
// purely via the `dark:` class (driven by next-themes' `.dark` on <html>), so
// the button renders identically on the server and client — no hydration
// mismatch and no mounted flag.
export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle light and dark mode"
      title="Toggle theme"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-slate-600 transition-all duration-300 ease-out hover:bg-slate-100 hover:text-amber-600 active:scale-[0.98] dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-300 dark:backdrop-blur-md dark:hover:bg-white/10 dark:hover:text-amber-400"
    >
      <Moon className="block h-5 w-5 dark:hidden" />
      <Sun className="hidden h-5 w-5 dark:block" />
    </button>
  );
}
