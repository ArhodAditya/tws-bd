import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { createAdminClient } from "@/utils/supabase/admin";
import ProductReviewModerationList from "@/components/ProductReviewModerationList";
import type { ReviewWithContext } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Product Reviews — Admin — The Whites Stories",
};

export default async function AdminProductReviewsPage() {
  const supabase = await createClient();

  // Auth gate: getUser() validates the token with Supabase (not just the cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Strict role gate: only admins may moderate reviews.
  if (!(await isCurrentUserAdmin(supabase))) {
    redirect("/");
  }

  // Service-role client so the queue is unaffected by product_reviews RLS —
  // the page itself is gated above. Reviews from every product, newest first.
  // If the table doesn't exist yet this errors and `data` is null, and the list
  // falls back to its empty state.
  const admin = createAdminClient();
  const { data } = await admin
    .from("product_reviews")
    .select("*, profiles(full_name, avatar_url), products(name)")
    .order("created_at", { ascending: false });

  const reviews: ReviewWithContext[] =
    (data as ReviewWithContext[] | null) ?? [];

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(212,175,55,0.1),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-gold-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="mt-6 flex items-center gap-2 text-gold-300">
            <Star className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">
              Shop Feedback
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Product Reviews
          </h1>
          <p className="mt-3 max-w-xl text-zinc-300">
            Every star rating fans have left on shop items, newest first. These
            publish the moment they&apos;re submitted, so deleting is the only
            moderation lever here — and it can&apos;t be undone.
          </p>
        </div>
      </header>

      {/* Moderation queue */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-6">
          <ProductReviewModerationList reviews={reviews} />
        </div>
      </div>
    </div>
  );
}
