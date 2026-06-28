import type { Metadata } from "next";
import Image from "next/image";
import { Globe, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import ShopBrowser from "@/components/ShopBrowser";
import { type Product } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Shop — The Whites Bangladesh",
  description:
    "Official jerseys, turf trainers and footballs for the Madridista faithful — order directly via WhatsApp. ¡Hala Madrid!",
};

// Clean, on-brand SVG football: white panel with the classic centre pentagon
// and five seams radiating to the rim. Used as both small rolling accents and
// large faint background balls in the trust banner.
function FootballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <circle cx="32" cy="32" r="29" fill="#ffffff" stroke="#0a0f24" strokeWidth="2.5" />
      <polygon points="32,20 43.4,28.3 39,41.7 25,41.7 20.6,28.3" fill="#0a0f24" />
      <path
        d="M32,20 L32,3.5 M43.4,28.3 L60,22.9 M39,41.7 L49.4,56 M25,41.7 L14.6,56 M20.6,28.3 L4,22.9"
        stroke="#0a0f24"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// Social-proof stats for the shop trust banner. Big gold number + label keeps
// each block punchy and scannable; the subtitle carries the human detail.
const TRUST_STATS = [
  {
    icon: Globe,
    hero: "500+",
    label: "Madridistas Worldwide",
    subtitle: "Trusted across Bangladesh, New Zealand, USA & Australia 🌍",
  },
  {
    icon: Star,
    hero: "100%",
    label: "Quality Rating",
    subtitle: "⭐⭐⭐⭐⭐ Pure perfection.",
  },
  {
    icon: ShieldCheck,
    hero: "Zero",
    label: "Negative Reviews",
    subtitle: "Countless kits sold. Flawless quality every time. 🛡️",
  },
];

export default async function ShopPage() {
  const supabase = await createClient();

  // If the `products` table doesn't exist yet (migration not applied) this
  // errors and `data` is null — the storefront then shows a graceful empty
  // state rather than crashing.
  const { data } = await supabase
    .from("products")
    .select("*")
    // Storefront shows only published products; admins still see hidden ones
    // via the admin inventory page (which doesn't apply this filter).
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const products: Product[] = data ?? [];

  return (
    <>
      {/* Fixed, optimized background photo with a dark gradient wash so the
          cards and copy stay readable. next/image (not bg-[url]) serves a
          right-sized, compressed asset instead of the full 6.5 MB original. */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Image
          alt="Background"
          className="object-cover opacity-40 dark:opacity-20"
          fill
          priority
          quality={100}
          sizes="100vw"
          src="/shop-bg.jpeg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/80 to-slate-950 dark:from-midnight-950/60 dark:via-midnight-950/90 dark:to-midnight-950" />
      </div>

      <div className="relative z-10 min-h-screen overflow-hidden text-white">
        {/* Ambient gold glow, matching the brand surfaces */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 right-1/4 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(212,175,55,0.1),transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <header className="mb-8 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
            <ShoppingBag className="h-3.5 w-3.5" />
            Official Shop
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Wear Your <span className="text-gradient-gold">White Pride</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-300">
            Premium jerseys, turf trainers, and match-grade footballs — curated
            for Madridistas in Bangladesh. Order in a tap, straight to our team
            on WhatsApp.
          </p>
        </header>

        {/* Product grid entrance animation */}
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-both">
          <ShopBrowser products={products} />
        </div>

        {/* ===== Social Proof / Trust Banner — sits below the product grid so
            the gear leads and the social proof reinforces it. ===== */}
        <section
          aria-label="Why Madridistas trust The Whites Bangladesh"
          className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both"
        >
          {/* Cinematic glass panel: deep gradient, glowing gold border, heavy blur */}
          <div className="relative overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-zinc-950/80 via-midnight-950/70 to-zinc-950/80 p-6 shadow-[0_0_60px_-15px_rgba(212,175,55,0.4)] backdrop-blur-md sm:p-8 lg:p-10">
            {/* Decorative: faint rolling footballs + an overhead gold glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-30%,rgba(212,175,55,0.18),transparent_60%)]" />
              <FootballIcon className="animate-roll-slow absolute -left-10 -top-10 h-44 w-44 opacity-[0.05]" />
              <FootballIcon className="animate-roll absolute -bottom-12 -right-8 h-40 w-40 opacity-[0.06]" />
            </div>

            {/* Eyebrow flanked by two slowly rolling footballs */}
            <div className="relative flex items-center justify-center gap-3">
              <FootballIcon className="animate-roll h-5 w-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
              <span className="text-center text-[11px] font-bold uppercase tracking-[0.3em] text-gold-300 sm:text-xs">
                Trusted by Madridistas Worldwide
              </span>
              <FootballIcon className="animate-roll h-5 w-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            </div>

            {/* Stat grid — single column on mobile, three across on desktop */}
            <div className="relative mt-7 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
              {TRUST_STATS.map((stat, index) => (
                <div
                  key={stat.label}
                  style={{ animationDelay: `${index * 0.5}s` }}
                  className="animate-float flex flex-col items-center gap-3 rounded-2xl border border-gold-500/30 bg-white/[0.04] p-6 text-center shadow-[0_0_40px_-14px_rgba(212,175,55,0.45)] backdrop-blur-md transition-colors duration-300 hover:border-gold-500/60 hover:bg-white/[0.07] sm:p-7"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10">
                    <stat.icon
                      className="h-7 w-7 text-gold-300 drop-shadow-[0_0_10px_rgba(212,175,55,0.85)]"
                      strokeWidth={1.75}
                    />
                  </span>
                  <p className="text-gradient-gold font-display text-3xl font-extrabold leading-none sm:text-4xl">
                    {stat.hero}
                  </p>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">
                    {stat.label}
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    {stat.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
