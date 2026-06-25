"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Moon, ShieldCheck, ShoppingCart, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useCart } from "@/context/CartContext";
import SocialLinks from "@/components/SocialLinks";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/fans-zone", label: "Fans Zone" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [supabase] = useState(() => createClient());
  const pathname = usePathname();

  // Track the auth session and the admin role together. The session read and
  // the role lookup both run inside async callbacks (never synchronously in the
  // effect body), so no `react-hooks/set-state-in-effect` cascade.
  useEffect(() => {
    let active = true;

    const resolveSession = async (sessionUser: User | null) => {
      if (!active) return;
      setUser(sessionUser);

      if (!sessionUser) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionUser.id)
        .single();
      if (active) setIsAdmin(data?.role === "admin");
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveSession(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveSession(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Send the user to our callback route after the Google round-trip so
        // the session cookies get written server-side.
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const avatarUrl: string | null =
    user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const displayName: string =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    "Madridista";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/85">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / logo — whole area lifts on hover with a soft gold bloom. */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-105"
          onClick={() => setOpen(false)}
        >
          <span className="relative inline-flex shrink-0">
            <span
              aria-hidden
              className="absolute inset-0 -z-10 rounded-full bg-gold-500/40 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100"
            />
            <Image
              src="/twsbd-logo.png"
              alt="The Whites Bangladesh"
              width={64}
              height={64}
              priority
              className="h-16 w-16 object-contain transition-[filter] duration-300 group-hover:drop-shadow-[0_0_14px_rgba(212,175,55,0.6)] dark:invert"
            />
          </span>
          <span className="font-display text-lg font-extrabold leading-none tracking-tight">
            <span className="text-slate-900 dark:text-white">The Whites</span>{" "}
            <span className="text-gradient-gold">Bangladesh</span>
          </span>
        </Link>

        {/* Desktop links — animated gold underline grows from the left on hover. */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-3.5 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-gradient-to-r after:from-gold-300 after:to-gold-500 after:transition-transform after:duration-300 after:content-[''] ${
                isActive(link.href)
                  ? "text-gold-600 after:scale-x-100 dark:text-gold-400"
                  : "text-slate-600 after:scale-x-0 hover:text-slate-900 hover:after:scale-x-100 dark:text-zinc-300 dark:hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: socials + theme toggle + cart + auth controls + hamburger */}
        <div className="flex items-center gap-2">
          {/* Social links — desktop only; the mobile menu carries its own set. */}
          <SocialLinks className="hidden md:flex" />
          <ThemeToggle />
          <CartButton />

          {/* Desktop auth */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-500/5 px-4 py-2 text-sm font-semibold text-gold-600 transition-all duration-300 hover:border-gold-500/70 hover:bg-gold-500/20 hover:shadow-[0_0_22px_-8px_rgba(212,175,55,0.8)] dark:text-gold-300"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin Panel
              </Link>
            ) : null}
            {user ? (
              <>
                <Avatar src={avatarUrl} name={displayName} />
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-gold-500/50 hover:text-gold-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:text-gold-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="inline-flex items-center rounded-full border border-gold-500/50 bg-gold-500/5 px-5 py-2 text-sm font-semibold text-gold-600 transition-all duration-300 hover:bg-gold-500/20 hover:shadow-[0_0_22px_-6px_rgba(212,175,55,0.9)] dark:text-gold-300"
              >
                Login
              </button>
            )}
          </div>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-white md:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-gray-200 bg-white/95 backdrop-blur-md transition-[max-height] duration-300 ease-out dark:border-white/10 dark:bg-slate-950/95 md:hidden ${
          open ? "max-h-[32rem]" : "max-h-0"
        }`}
      >
        <div className="space-y-1 px-4 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-gold-500/10 text-gold-600 dark:text-gold-400"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {isAdmin ? (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-base font-semibold text-gold-600 transition-colors hover:bg-gold-500/20 dark:text-gold-300"
            >
              <ShieldCheck className="h-5 w-5" />
              Admin Panel
            </Link>
          ) : null}

          {/* Mobile auth */}
          {user ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={avatarUrl} name={displayName} />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {displayName}
                  </p>
                  {user.email ? (
                    <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                      {user.email}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-gold-500/50 hover:text-gold-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:text-gold-300"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="mt-2 w-full rounded-full border border-gold-500/50 bg-gold-500/5 px-5 py-3 text-base font-semibold text-gold-600 transition-colors hover:bg-gold-500/20 dark:text-gold-300"
            >
              Login
            </button>
          )}

          {/* Follow us — mobile */}
          <div className="mt-3 flex items-center justify-center gap-3 border-t border-gray-200 pt-4 dark:border-white/10">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">
              Follow us
            </span>
            <SocialLinks />
          </div>
        </div>
      </div>
    </header>
  );
}

// Sun/Moon theme switch. The two icons are toggled purely with the `dark:`
// class (driven by next-themes' `.dark` on <html>), so the button renders
// identically on the server and client — no hydration mismatch, no mounted
// flag, and therefore no set-state-in-effect.
function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle light and dark mode"
      title="Toggle theme"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-gold-300"
    >
      <Moon className="block h-5 w-5 dark:hidden" />
      <Sun className="hidden h-5 w-5 dark:block" />
    </button>
  );
}

// Shopping cart trigger with a live item-count badge. Opens the cart drawer
// (mounted in the root layout) via the global cart context.
function CartButton() {
  const { itemCount, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-gold-600 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-gold-300"
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-in items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 px-1 text-[10px] font-bold tabular-nums text-midnight-950 ring-2 ring-white zoom-in duration-200 dark:ring-slate-950">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </button>
  );
}

// Rounded Google avatar with a subtle gold ring; falls back to the user's
// initial when no profile picture is available.
function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={36}
        height={36}
        referrerPolicy="no-referrer"
        className="h-9 w-9 rounded-full object-cover ring-2 ring-gold-500/50"
      />
    );
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-sm font-bold text-midnight-950 ring-2 ring-gold-500/50">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
