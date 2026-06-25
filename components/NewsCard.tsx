import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Calendar, Newspaper } from "lucide-react";
import {
  type ArticleWithAuthor,
  type ArticleAuthor,
  formatArticleDate,
  getAuthorName,
  getCategoryStyle,
  getExcerpt,
} from "@/lib/articles";

// Category pill, tuned for dark surfaces (the card cover and article header).
export function CategoryBadge({ category }: { category?: string | null }) {
  const { label, badge, dot } = getCategoryStyle(category);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur ${badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// Small circular avatar. Uses next/image when the profile has a picture,
// otherwise falls back to a gold initial chip.
function AuthorAvatar({
  src,
  name,
  px,
  className,
}: {
  src: string | null;
  name: string;
  px: number;
  className: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        referrerPolicy="no-referrer"
        className={`${className} rounded-full object-cover ring-1 ring-gold-500/40`}
      />
    );
  }
  return (
    <span
      className={`${className} flex items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 font-bold text-midnight-950 ring-1 ring-gold-500/40`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

// Author byline: avatar + name, with a graceful fallback name.
export function AuthorMeta({
  author,
  variant = "card",
}: {
  author: ArticleAuthor | null;
  variant?: "card" | "header";
}) {
  const name = getAuthorName(author);
  const isHeader = variant === "header";

  return (
    <span className="inline-flex items-center gap-2">
      <AuthorAvatar
        src={author?.avatar_url ?? null}
        name={name}
        px={isHeader ? 40 : 24}
        className={isHeader ? "h-10 w-10 text-sm" : "h-6 w-6 text-[10px]"}
      />
      <span
        className={
          isHeader
            ? "text-sm font-semibold text-white"
            : "text-xs font-medium text-midnight-800/70"
        }
      >
        {name}
      </span>
    </span>
  );
}

// The "image" area for a card. Uses the article image as a background when
// present, otherwise falls back to an on-brand midnight gradient placeholder.
function ArticleCover({
  article,
  className,
}: {
  article: ArticleWithAuthor;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-midnight-700 via-midnight-900 to-midnight-950 ${
        className ?? ""
      }`}
      style={
        article.image_url
          ? {
              backgroundImage: `linear-gradient(to top, rgba(5,8,20,0.85), rgba(5,8,20,0.2)), url("${article.image_url}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <Newspaper
        aria-hidden
        className="absolute -right-5 -top-5 h-28 w-28 text-white/5"
      />
      <div className="absolute left-4 top-4">
        <CategoryBadge category={article.category} />
      </div>
    </div>
  );
}

// Standard news card for the grid.
export function NewsCard({ article }: { article: ArticleWithAuthor }) {
  const excerpt = getExcerpt(article.content);

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-midnight-900/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-xl"
    >
      <ArticleCover article={article} className="h-44" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-midnight-800/60">
          <Calendar className="h-3.5 w-3.5" />
          {formatArticleDate(article.created_at)}
        </div>
        <h3 className="mt-2 line-clamp-2 font-display text-lg font-bold leading-snug text-midnight-900 transition-colors group-hover:text-gold-600">
          {article.title}
        </h3>
        {excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-midnight-800/70">
            {excerpt}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <AuthorMeta author={article.profiles} />
          <ArrowUpRight className="h-4 w-4 shrink-0 text-midnight-900 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold-600" />
        </div>
      </div>
    </Link>
  );
}

// Larger, horizontal hero card for the most recent article.
export function FeaturedNewsCard({ article }: { article: ArticleWithAuthor }) {
  const excerpt = getExcerpt(article.content);

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group grid overflow-hidden rounded-3xl border border-midnight-900/10 bg-white shadow-sm transition-all hover:border-gold-500/40 hover:shadow-2xl md:grid-cols-2"
    >
      <ArticleCover article={article} className="min-h-56 md:min-h-full" />
      <div className="flex flex-col justify-center p-7 sm:p-9">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <AuthorMeta author={article.profiles} />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-midnight-800/60">
            <Calendar className="h-3.5 w-3.5" />
            {formatArticleDate(article.created_at)}
          </span>
        </div>
        <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight text-midnight-900 transition-colors group-hover:text-gold-600 sm:text-3xl">
          {article.title}
        </h2>
        {excerpt ? (
          <p className="mt-3 line-clamp-3 text-midnight-800/70">{excerpt}</p>
        ) : null}
        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-midnight-900 transition-colors group-hover:text-gold-600">
          Read full story
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
