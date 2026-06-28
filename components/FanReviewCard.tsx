import Image from "next/image";
import { Quote } from "lucide-react";
import {
  formatFanReviewDate,
  getReviewerName,
  type FanReviewWithAuthor,
} from "@/lib/fan-reviews";

// A single approved fan review on the public "Voices of the Madridistas" wall.
// Presentational + server-rendered; the scroll-reveal motion is applied by the
// <Reveal> wrapper around it on the Fans Zone page.
export default function FanReviewCard({
  review,
}: {
  review: FanReviewWithAuthor;
}) {
  const name = getReviewerName(review);
  const avatar = review.profiles?.avatar_url ?? null;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-xl dark:border-white/10 dark:bg-slate-900/40">
      <Quote className="h-7 w-7 text-gold-500" strokeWidth={1.5} aria-hidden />

      <p className="mt-4 flex-1 whitespace-pre-line leading-relaxed text-slate-600 dark:text-gray-300">
        {review.review_text}
      </p>

      <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
        {avatar ? (
          <Image
            src={avatar}
            alt={name}
            width={40}
            height={40}
            referrerPolicy="no-referrer"
            className="h-10 w-10 rounded-full object-cover ring-1 ring-gold-500/30"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-600 text-sm font-bold text-midnight-950 ring-1 ring-gold-500/30">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900 dark:text-white">
            {name}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-500">
            {formatFanReviewDate(review.created_at)}
          </p>
        </div>
      </div>
    </article>
  );
}
