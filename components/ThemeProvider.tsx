"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// Client wrapper around next-themes so the provider can live in the (server)
// root layout. The theme engine defaults are baked in here — `class` attribute
// on <html> (matching Tailwind's `@custom-variant dark` in globals.css) and
// system-preference detection — while still allowing per-usage overrides.
export default function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
