import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/ThemeProvider";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import CartToast from "@/components/CartToast";
import WelcomeToast from "@/components/WelcomeToast";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "The Whites Bangladesh — Pasión Blanca, Desde Bangladesh",
  description:
    "The Whites Bangladesh — the ultimate community hub for Real Madrid fans in Bangladesh. News, Fans Zone, and the official shop. ¡Hala Madrid!",
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
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      {/* Base surface is themed with `dark:` utilities (not CSS vars) so it
          flips instantly on a live theme toggle. */}
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 dark:bg-midnight-950 dark:text-slate-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <CartToast />
          <WelcomeToast />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
