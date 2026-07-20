import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Newspaper } from "lucide-react";
import {
  type ArticleWithAuthor,
  type ArticleAuthor,
  formatArticleDate,
  getAuthorName,
  getCategoryStyle,
  getExcerpt,
} from "@/lib/articles";

// Rounded category pill. Kept deliberately conventional: it is also used by the
// admin article list and the article header, so it must stay legible outside
// the brutalist editorial context.
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

// Hard-edged matchday tag — square corners, gold block. Editorial cards only.
function HardTag({ category }: { category?: string | null }) {
  const { label } = getCategoryStyle(category);
  return (
    <span className="bg-gold-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-midnight-950">
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
      className={`${className} flex items-center justify-center rounded-full bg-gold-500 font-bold text-midnight-950 ring-1 ring-gold-500/40`}
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
            : "text-xs font-medium text-zinc-400"
        }
      >
        {name}
      </span>
    </span>
  );
}

// Cover art. Falls back to an on-brand midnight gradient when the article has
// no image, so a card is never a blank rectangle.
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
              backgroundImage: `linear-gradient(to top, rgba(6,11,34,0.9), rgba(6,11,34,0.15)), url("${article.image_url}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {!article.image_url ? (
        <Newspaper
          aria-hidden
          className="absolute -right-4 -top-4 h-24 w-24 text-white/5"
        />
      ) : null}
    </div>
  );
}

// Editorial news card. The cover is cut on a hard diagonal and the headline
// panel rides up over it — overlap, not a stacked box.
export function NewsCard({ article }: { article: ArticleWithAuthor }) {
  const excerpt = getExcerpt(article.content);

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group relative flex flex-col overflow-hidden border border-white/10 bg-midnight-900/50 backdrop-blur-md transition-all duration-300 ease-out hover:border-gold-500/50 hover:shadow-[0_20px_60px_-28px_rgba(220,174,43,0.5)] active:scale-[0.99]"
    >
      <ArticleCover
        article={article}
        className="clip-diagonal h-44 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />

      {/* Headline panel overlaps the diagonal cut */}
      <div className="relative -mt-8 flex flex-1 flex-col px-5 pb-5">
        <div className="mb-3 flex items-center gap-3">
          <HardTag category={article.category} />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
            {formatArticleDate(article.created_at)}
          </span>
        </div>

        <h3 className="font-display text-xl font-extrabold uppercase leading-[0.98] tracking-tight text-white transition-colors duration-300 group-hover:text-gold-300">
          {article.title}
        </h3>

        {excerpt ? (
          <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-zinc-400">
            {excerpt}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <AuthorMeta author={article.profiles} />
          <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold-300" />
        </div>
      </div>
    </Link>
  );
}

// Front-page splash. Oversized headline breaks out over the artwork, with a
// hazard rule marking the fold — the matchday back-page treatment.
export function FeaturedNewsCard({ article }: { article: ArticleWithAuthor }) {
  const excerpt = getExcerpt(article.content);

  return (
    <Link
      href={`/news/${article.slug}`}
      className="group relative block overflow-hidden border border-white/10 bg-midnight-900/50 backdrop-blur-md transition-colors duration-300 hover:border-gold-500/50"
    >
      <div className="md:grid md:grid-cols-[1.1fr_1fr] md:items-stretch">
        <ArticleCover
          article={article}
          className="clip-diagonal h-64 transition-transform duration-700 ease-out group-hover:scale-[1.03] sm:h-80 md:h-full md:min-h-[26rem] md:[clip-path:polygon(0_0,100%_0,calc(100%-3.5rem)_100%,0_100%)]"
        />

        {/* Overlaps the cover: up on mobile, left on desktop */}
        <div className="relative -mt-12 flex flex-col justify-center px-5 pb-8 md:-ml-14 md:mt-0 md:px-0 md:pb-0 md:pr-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <HardTag category={article.category} />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">
              {formatArticleDate(article.created_at)}
            </span>
          </div>

          <h2 className="display-lg font-display uppercase text-white transition-colors duration-300 group-hover:text-gold-300">
            {article.title}
          </h2>

          {/* Hazard rule under the headline */}
          <span
            aria-hidden
            className="stripe-gold mt-5 block h-1 w-24 opacity-80"
          />

          {excerpt ? (
            <p className="mt-5 line-clamp-3 max-w-prose text-sm leading-relaxed text-zinc-300 sm:text-base">
              {excerpt}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <AuthorMeta author={article.profiles} />
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-gold-300">
              Read full story
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
