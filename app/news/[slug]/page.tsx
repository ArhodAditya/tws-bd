import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, EyeOff, Newspaper, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin";
import {
  MOCK_ARTICLES,
  type ArticleWithAuthor,
  formatArticleDate,
  getExcerpt,
} from "@/lib/articles";
import { SITE_LOGO, SITE_NAME, SITE_URL } from "@/lib/site";
import { AuthorMeta, CategoryBadge } from "@/components/NewsCard";
import { FacebookIcon, XIcon } from "@/components/BrandIcons";
import JsonLd from "@/components/JsonLd";

type ArticleParams = { slug: string };

// Sanitize schema for the raw HTML that rehype-raw parses out of admin article
// Markdown. Keeps the default (safe) tag + URL-protocol allowlist — which drops
// <script>, event-handler attributes and javascript: URLs — but re-permits
// `className` and `style` so the intentional inline-styled accent spans still
// render. rehype-sanitize runs AFTER rehype-raw so it scrubs the parsed HTML.
const articleSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "style"],
  },
};

// Is the current viewer an admin? cache()d because both getArticle (to decide
// whether a hidden article is viewable) and the page body (the Edit link) need
// it, and neither should pay twice for the auth + role round-trips.
const getViewerIsAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? isCurrentUserAdmin(supabase) : false;
});

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

    if (data) {
      // The articles SELECT policy already withholds hidden rows from the
      // public, so this guard is belt and braces: it keeps the page correct if
      // the RLS migration hasn't been applied yet, or if that policy is ever
      // loosened. Pre-RLS an admin lands here directly; post-RLS they fall
      // through to the service-role re-read below.
      if (!data.is_published && !(await getViewerIsAdmin())) return null;
      return data;
    }

    // A miss may still be a hidden article, which only an admin may preview at
    // its real URL. Re-read with the service-role client, strictly behind the
    // role check — the public path above never reaches this.
    if (await getViewerIsAdmin()) {
      const { data: hidden } = await createAdminClient()
        .from("articles")
        .select("*, profiles(full_name, avatar_url)")
        .eq("slug", slug)
        .maybeSingle();
      if (hidden) return hidden;
    }

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
    return { title: "Article Not Found — The Whites Stories" };
  }

  const description = getExcerpt(article.content) || undefined;
  const title = article.title ?? SITE_NAME;
  // Articles store a single Cloudinary image_url; fall back to the brand logo.
  const ogImage = article.image_url ?? SITE_LOGO;

  return {
    title: `${title} — The Whites Stories`,
    description,
    alternates: { canonical: `/news/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}/news/${slug}`,
      siteName: SITE_NAME,
      publishedTime: article.created_at,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
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
  const isAdmin = await getViewerIsAdmin();
  const canEdit =
    isAdmin && !MOCK_ARTICLES.some((mock) => mock.id === article.id);
  // Only an admin can reach a hidden article, so flag why it looks live here
  // but is missing from the public news feed.
  const showHiddenNotice = canEdit && !article.is_published;

  const content = (article.content ?? "").trim();

  // NewsArticle structured data — helps the page surface in Google News /
  // Discover. Author is the publication per brand convention.
  const articleUrl = `${SITE_URL}/news/${article.slug}`;
  const newsSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title ?? SITE_NAME,
    description: getExcerpt(article.content) || undefined,
    image: article.image_url ? [article.image_url] : [SITE_LOGO],
    datePublished: article.created_at,
    dateModified: article.created_at,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: SITE_LOGO },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };

  return (
    <article className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <JsonLd data={newsSchema} />
      {/* Header — always-dark cinematic hero (obsidian gradient + gold glow),
          independent of the light/dark toggle */}
      <header className="relative overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(212,175,55,0.1),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
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
            {showHiddenNotice ? (
              <span
                title="Hidden from the public news feed — only admins can see this page."
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-semibold text-zinc-300"
              >
                <EyeOff className="h-3.5 w-3.5" />
                Hidden
              </span>
            ) : null}
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

      {/* Cover image — inset rounded magazine card at every breakpoint, sitting
          clear of the header metadata rather than bleeding up into it.

          Desktop caps the height at 400px so the cover doesn't shove the body
          copy below the fold. That's an explicit height rather than max-height:
          pairing max-height with aspect-video makes the browser shrink the
          *width* to hold 16:9, pulling the card off the text column's right
          edge. Releasing the ratio keeps it full-bleed to the measure, and
          background-size:cover absorbs the wider crop. */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative mt-6 aspect-video overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-midnight-700 via-midnight-900 to-zinc-950 shadow-[0_25px_60px_-25px_rgba(0,0,0,0.9)] dark:border-zinc-800/50 md:mt-8 md:aspect-auto md:h-[400px]"
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

      {/* Body — Markdown set in Times New Roman for an editorial reading feel,
          scaling responsively (base on phones, prose-lg from md:). Light-mode
          defaults with dark:prose-invert preserving the cinematic dark canvas.
          rehype-raw compiles inline HTML snippets (gold/cursive spans etc.);
          those carry inline styles, which override the inherited base font by
          normal CSS precedence.

          Justified measure (broadsheet convention) with hyphens-auto to break
          long words — without it, narrow phone columns open rivers of
          whitespace. Hyphenation keys off <html lang="en"> in the root layout.
          Headings opt back out: justify stretches a heading that wraps, and
          display type shows the gaps far more than body copy does. */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 md:py-12 lg:px-8">
        {content ? (
          <div className="prose max-w-none prose-zinc text-justify hyphens-auto font-['Times_New_Roman',_Times,_serif] md:prose-lg dark:prose-invert prose-headings:text-left prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-zinc-900 dark:prose-headings:text-white prose-p:text-zinc-700 dark:prose-p:text-zinc-400 prose-li:text-zinc-700 dark:prose-li:text-zinc-400 prose-strong:text-zinc-900 dark:prose-strong:text-white prose-a:font-medium prose-a:text-amber-600 hover:prose-a:text-amber-500 dark:prose-a:text-amber-400 dark:hover:prose-a:text-amber-300 prose-blockquote:border-amber-400/40 prose-blockquote:text-zinc-600 dark:prose-blockquote:text-zinc-300 prose-img:my-8 prose-img:w-full prose-img:rounded-xl prose-img:border prose-img:border-zinc-200 dark:prose-img:border-zinc-800/50 prose-img:shadow-2xl">
            {/* remark-breaks turns a single newline (Enter in the editor) into a
                hard <br>, so line breaks the admin types render on the live site
                instead of being collapsed into a space by standard Markdown. */}
            <ReactMarkdown
              remarkPlugins={[remarkBreaks]}
              rehypePlugins={[rehypeRaw, [rehypeSanitize, articleSchema]]}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-zinc-500">Full story coming soon.</p>
        )}

        {/* Share Report — anchors the bottom of the article canvas */}
        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800/50">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Share Report:
          </span>
          <div className="flex items-center gap-2.5">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share this report on Facebook"
              title="Share on Facebook"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100/80 text-zinc-500 backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 hover:border-amber-400/40 hover:text-amber-500 hover:shadow-[0_0_24px_-8px_rgba(251,191,36,0.6)] active:scale-[0.98] dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-amber-400"
            >
              <FacebookIcon className="h-4 w-4" />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title ?? "")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share this report on X (Twitter)"
              title="Share on X"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100/80 text-zinc-500 backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 hover:border-amber-400/40 hover:text-amber-500 hover:shadow-[0_0_24px_-8px_rgba(251,191,36,0.6)] active:scale-[0.98] dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-amber-400"
            >
              <XIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800/50">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 transition-all duration-300 ease-out hover:text-amber-600 dark:text-white dark:hover:text-amber-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all news
          </Link>
        </div>
      </div>
    </article>
  );
}
