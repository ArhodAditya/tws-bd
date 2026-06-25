"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// Thin client wrapper around next-themes so the provider can live in the
// (server) root layout. Props are forwarded verbatim (attribute, defaultTheme,
// enableSystem, …).
export default function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
