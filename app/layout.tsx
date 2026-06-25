import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/ThemeProvider";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import CartToast from "@/components/CartToast";
import SocialLinks from "@/components/SocialLinks";

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
  title: "The Whites Bangladesh — The Ultimate Madridista Hub",
  description:
    "The Whites Bangladesh — the ultimate community hub for Real Madrid fans in Bangladesh. News, Fans Zone, and the official shop. ¡Hala Madrid!",
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
          <footer className="border-t border-gold-500/15 bg-midnight-950 text-zinc-400">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
            <div className="flex items-center gap-2">
              {/* Footer surface is always dark (bg-midnight-950), so the black
                  logo is inverted to white in both light and dark modes. */}
              <Image
                src="/twsbd-logo.png"
                alt="The Whites Bangladesh"
                width={28}
                height={28}
                className="h-7 w-7 object-contain invert"
              />
              <span className="text-sm font-semibold text-white">
                The Whites Bangladesh
              </span>
            </div>
            <p className="text-xs">
              © {new Date().getFullYear()} The Whites Bangladesh · A community for
              Madridistas. Not affiliated with Real Madrid C.F.
            </p>
            <div className="flex flex-col items-center gap-3 sm:items-end">
              <SocialLinks />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
                ¡Hala Madrid!
              </p>
            </div>
          </div>
          </footer>
          <CartDrawer />
          <CartToast />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
