"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Newspaper, ShoppingBag, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

// Floating, glassmorphic bottom navigation — mobile only. Replaces the
// top-heavy mobile menu for the four core destinations; the hamburger keeps
// only secondary links (Fans Zone, About, auth). Every target is ≥ h-12.
const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/news", label: "News", icon: Newspaper },
] as const;

// Bouncy-but-settled spring shared by the active pill and tap feedback.
const SPRING = { type: "spring", stiffness: 420, damping: 30 } as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount, openCart } = useCart();

  // Product detail pages ship their own sticky Add-to-Cart bar, and the admin
  // area has its own chrome — hide the floating nav there.
  const isProductDetail = /^\/shop\/[^/]+/.test(pathname);
  if (pathname.startsWith("/admin") || isProductDetail) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* In-flow spacer so page content scrolls clear of the floating bar. */}
      <div aria-hidden className="h-24 md:hidden" />

      <nav
        aria-label="Primary"
        className="fixed inset-x-4 bottom-4 z-50 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around rounded-3xl border border-white/50 bg-white/75 p-1.5 shadow-[0_12px_40px_-12px_rgba(6,11,34,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-midnight-900/70 dark:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.8)]">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <motion.div
                key={tab.href}
                whileTap={{ scale: 0.88 }}
                transition={SPRING}
                className="relative flex-1"
              >
                {active ? (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    transition={SPRING}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-b from-gold-300/25 to-gold-500/25 ring-1 ring-gold-500/40"
                  />
                ) : null}
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-bold uppercase tracking-wide transition-colors ${
                    active
                      ? "text-gold-700 dark:text-gold-300"
                      : "text-slate-500 dark:text-zinc-400"
                  }`}
                >
                  <tab.icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                  {tab.label}
                </Link>
              </motion.div>
            );
          })}

          {/* Cart — opens the drawer; stadium-green badge carries the count. */}
          <motion.div
            whileTap={{ scale: 0.88 }}
            transition={SPRING}
            className="relative flex-1"
          >
            <button
              type="button"
              onClick={openCart}
              aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
              className="relative flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-bold uppercase tracking-wide text-slate-500 transition-colors dark:text-zinc-400"
            >
              <span className="relative">
                <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                {itemCount > 0 ? (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-pitch-500 px-1 text-[9px] font-black tabular-nums text-midnight-950 ring-2 ring-white dark:ring-midnight-900"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </motion.span>
                ) : null}
              </span>
              Cart
            </button>
          </motion.div>
        </div>
      </nav>
    </>
  );
}
