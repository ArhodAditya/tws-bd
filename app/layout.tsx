import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/ThemeProvider";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import CartToast from "@/components/CartToast";
import WelcomeToast from "@/components/WelcomeToast";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Bold, playful, sporty display face for headings (variable font — all
// weights available; headings use 600–800).
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Resolves relative OpenGraph/canonical URLs against the production origin.
  metadataBase: new URL(SITE_URL),
  title: "The Whites Stories — Pasión Blanca, Desde Bangladesh",
  description:
    "The Whites Stories — the ultimate community hub for Real Madrid fans in Bangladesh. News, Fans Zone, and the official shop. ¡Hala Madrid!",
  // Use the TWS brand logo as the favicon / home-screen icon. The default
  // `app/favicon.ico` was removed so Next.js falls back to these entries.
  icons: {
    icon: "/twsbd-logo.png",
    shortcut: "/twsbd-logo.png",
    apple: "/twsbd-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      {/* Base surface: clean light-mode default with the cinematic dark canvas
          under `dark:`. Class-based utilities (not CSS vars) so the surface
          flips instantly on a live theme toggle. */}
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-midnight-950 dark:text-zinc-100">
        {/* Without JS, framer-motion's SSR'd `initial` styles would leave every
            animated element stuck hidden. `!important` outranks those inline
            styles, so a JS-off render shows all content at rest. */}
        <noscript>
          <style>{`[data-motion]{opacity:1!important;transform:none!important;clip-path:none!important}`}</style>
        </noscript>
        {/* attribute="class" / defaultTheme="system" / enableSystem are baked
            into the ThemeProvider wrapper. */}
        <ThemeProvider disableTransitionOnChange>
          <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          {/* Floating glass bottom nav — mobile only; renders its own in-flow
              spacer so the footer never hides behind it. */}
          <MobileBottomNav />
          <CartDrawer />
          <CartToast />
          {/* Reads a short-lived cookie on mount — no search params, so no
              Suspense boundary needed. */}
          <WelcomeToast />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
