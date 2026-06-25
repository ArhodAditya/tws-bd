import type { Metadata } from "next";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import ShopBrowser from "@/components/ShopBrowser";
import { FALLBACK_WHATSAPP_NUMBER, type Product } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Shop — The Whites Bangladesh",
  description:
    "Official jerseys, turf trainers and footballs for the Madridista faithful — order directly via WhatsApp. ¡Hala Madrid!",
};

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
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? FALLBACK_WHATSAPP_NUMBER;

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
          <ShopBrowser products={products} whatsappNumber={whatsappNumber} />
        </div>
      </div>
    </div>
    </>
  );
}
