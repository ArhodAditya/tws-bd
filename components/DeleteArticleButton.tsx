"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteArticle } from "@/app/admin/actions";

// Delete trigger for a single article row. Guards the destructive action behind
// a native confirm() so a misclick can't wipe a post, then calls the
// deleteArticle Server Action and refreshes the list.
export default function DeleteArticleButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this article? This cannot be undone."
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteArticle(id);
      if (!result.success) {
        setError(result.message ?? "Failed to delete the article.");
        return;
      }
      // The action revalidates the affected paths; refresh so this list reflects
      // the removal without a full reload.
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label={`Delete article: ${title}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Delete
      </button>
      {error ? (
        <p className="text-xs text-red-600" role="status" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
