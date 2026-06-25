import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Newspaper, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
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

  // Admin convenience: show an "Edit" link, but only for real DB-backed
  // articles (the sample/mock fallbacks aren't editable).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }
  const canEdit =
    isAdmin && !MOCK_ARTICLES.some((mock) => mock.id === article.id);

  const content = (article.content ?? "").trim();

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
            {canEdit ? (
              <Link
                href={`/admin/articles/edit/${article.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 font-semibold text-gold-300 transition-colors hover:bg-gold-500/20"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            ) : null}
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

      {/* Body — Markdown so admins can place inline images anywhere. Rendered
          on a light surface, so we use `prose` (not prose-invert) and size
          images responsively. */}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {content ? (
          <div className="prose prose-lg max-w-none text-midnight-800/80 prose-headings:font-display prose-headings:text-midnight-900 prose-p:text-midnight-800/80 prose-strong:text-midnight-900 prose-a:font-medium prose-a:text-gold-700 hover:prose-a:text-gold-600 prose-img:my-8 prose-img:w-full prose-img:rounded-xl prose-img:shadow-md">
            <ReactMarkdown>{content}</ReactMarkdown>
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
