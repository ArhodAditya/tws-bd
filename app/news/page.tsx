import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { MOCK_ARTICLES, type ArticleWithAuthor } from "@/lib/articles";
import { FeaturedNewsCard, NewsCard } from "@/components/NewsCard";

export const metadata: Metadata = {
  title: "News — The Whites Stories",
  description:
    "The latest Real Madrid news, match reports, and tactical analysis for Madridistas in Bangladesh.",
};

export default async function NewsPage() {
  const supabase = await createClient();
  // Public feed: hidden (is_published = false) articles are excluded, so an
  // admin can pull a story without deleting it.
  const { data, error } = await supabase
    .from("articles")
    .select("*, profiles(full_name, avatar_url)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // Fall back to sample content when the table is empty or unreachable, so the
  // portal always looks complete. `data` is strictly typed as Article[] | null.
  const hasRealData = !error && !!data && data.length > 0;
  const articles: ArticleWithAuthor[] =
    data && data.length > 0 ? data : MOCK_ARTICLES;

  const [featured, ...rest] = articles;

  return (
    <>
      {/* Header — obsidian gradient flowing into the article grid below */}
      <section className="relative overflow-hidden bg-gradient-to-b from-midnight-900 to-midnight-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 left-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,rgba(212,175,55,0.12),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h1 className="display-xl font-display max-w-3xl uppercase">
            From the
            <span className="block text-stroke">Bernabéu</span>
          </h1>
          <span aria-hidden className="stripe-gold mt-6 block h-1.5 w-28 opacity-80" />
          <p className="mt-6 max-w-2xl text-base text-zinc-300 sm:text-lg">
            Match reports, breaking transfers, and deep tactical analysis —
            curated for the Madridista faithful of Bangladesh.
          </p>
          {!hasRealData ? (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-400">
              Showing sample articles — publish from the admin panel to see your
              own here.
            </p>
          ) : null}
        </div>
      </section>

      {/* Article grid — deep cinematic canvas */}
      <section className="bg-gradient-to-b from-midnight-950 to-black">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="space-y-8">
            {featured ? <FeaturedNewsCard article={featured} /> : null}
            {rest.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((article) => (
                  <NewsCard
                    key={article.id ?? article.slug}
                    article={article}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
