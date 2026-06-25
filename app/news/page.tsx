import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { MOCK_ARTICLES, type ArticleWithAuthor } from "@/lib/articles";
import { FeaturedNewsCard, NewsCard } from "@/components/NewsCard";

export const metadata: Metadata = {
  title: "News — The Whites Bangladesh",
  description:
    "The latest Real Madrid news, match reports, and tactical analysis for Madridistas in Bangladesh.",
};

export default async function NewsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, profiles(full_name, avatar_url)")
    .order("created_at", { ascending: false });

  // Fall back to sample content when the table is empty or unreachable, so the
  // portal always looks complete. `data` is strictly typed as Article[] | null.
  const hasRealData = !error && !!data && data.length > 0;
  const articles: ArticleWithAuthor[] =
    data && data.length > 0 ? data : MOCK_ARTICLES;

  const [featured, ...rest] = articles;

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden bg-midnight-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 left-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_-10%,rgba(212,175,55,0.12),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
            Newsroom
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            The Latest from the <span className="text-gradient-gold">Bernabéu</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-300">
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

      {/* Article grid */}
      <section className="bg-zinc-50">
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
