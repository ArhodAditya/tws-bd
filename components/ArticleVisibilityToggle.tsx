"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { setArticlePublished } from "@/app/admin/actions";

// Hide/Show switch for a single article row — the soft delete. State is read
// from the server-rendered prop rather than held locally: the action
// revalidates the affected paths and router.refresh() re-renders this list, so
// the button can never drift out of sync with the database.
export default function ArticleVisibilityToggle({
  id,
  title,
  isPublished,
}: {
  id: string;
  title: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    const next = !isPublished;
    setError(null);
    startTransition(async () => {
      const result = await setArticlePublished(id, next);
      if (!result.success) {
        setError(
          result.message ??
            `Could not ${next ? "publish" : "hide"} the article.`
        );
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={isPublished}
        aria-label={`${isPublished ? "Hide" : "Show"} article: ${title}`}
        title={
          isPublished
            ? "Live on the site — click to hide it"
            : "Hidden from the site — click to publish it"
        }
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-all duration-300 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
          isPublished
            ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-500/25"
            : "border-white/15 bg-white/5 text-zinc-400 hover:border-white/30 hover:text-white"
        }`}
      >
        {isPending ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : isPublished ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
        {isPublished ? "Visible" : "Hidden"}
      </button>
      {error ? (
        <p className="text-xs text-red-400" role="status" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
