import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Newspaper } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import {
  MOCK_ARTICLES,
  type ArticleWithAuthor,
  formatArticleDate,
  getExcerpt,
} from "@/lib/articles";
import { AuthorMeta, CategoryBadge } from "@/components/NewsCard";

type ArticleParams = { slug: string };

// Fetch a single article by slug, falling back to sample content. Wrapped in
// React's cache() so generateMetadata and the page share one query per request.
const getArticle = cache(
  async (slug: string): Promise<ArticleWithAuthor | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("articles")
      .select("*, profiles(full_name, avatar_url)")
      .eq("slug", slug)
      .maybeSingle();

    if (data) return data;
    return MOCK_ARTICLES.find((article) => article.slug === slug) ?? null;
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<ArticleParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return { title: "Article Not Found — The Whites Bangladesh" };
  }

  return {
    title: `${article.title} — The Whites Bangladesh`,
    description: getExcerpt(article.content) || undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<ArticleParams>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const paragraphs = (article.content ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <article className="bg-white">
      {/* Header */}
      <header className="relative overflow-hidden bg-midnight-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(212,175,55,0.1),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-gold-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Link>

          <div className="mt-6">
            <CategoryBadge category={article.category} />
          </div>

          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-zinc-400">
            <AuthorMeta author={article.profiles} variant="header" />
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatArticleDate(article.created_at)}
            </span>
          </div>
        </div>
      </header>

      {/* Cover image — floats over the header for a premium magazine feel */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative -mt-8 h-56 overflow-hidden rounded-2xl border border-midnight-900/10 bg-gradient-to-br from-midnight-700 via-midnight-900 to-midnight-950 shadow-xl sm:h-72 md:h-80"
          style={
            article.image_url
              ? {
                  backgroundImage: `url("${article.image_url}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {!article.image_url ? (
            <Newspaper
              aria-hidden
              className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-white/10"
            />
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {paragraphs.length > 0 ? (
          <div className="space-y-5 text-lg leading-relaxed text-midnight-800/80">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={
                  index === 0
                    ? "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-5xl first-letter:font-bold first-letter:leading-[0.8] first-letter:text-gold-600"
                    : undefined
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-midnight-800/60">Full story coming soon.</p>
        )}

        <div className="mt-12 border-t border-midnight-900/10 pt-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-midnight-900 transition-colors hover:text-gold-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all news
          </Link>
        </div>
      </div>
    </article>
  );
}
