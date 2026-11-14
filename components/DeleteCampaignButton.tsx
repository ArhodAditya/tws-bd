"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteUclCampaign } from "@/app/admin/actions/ucl-campaigns";

// Delete trigger for one UCL campaign row. Same shape as DeleteArticleButton:
// a native confirm() stands between a misclick and a lost history, then the
// Server Action runs and the list refreshes.
export default function DeleteCampaignButton({
  id,
  year,
  title,
}: {
  id: string;
  year: number;
  title: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (
      !window.confirm(
        `Delete the ${year} campaign (${title})? Its history and photo link go with it, and it disappears from the Fans Zone globe. This cannot be undone.`
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteUclCampaign(id);
      if (!result.success) {
        setError(result.message ?? "The campaign could not be deleted.");
        return;
      }
      // The action revalidates the affected paths; refresh so this list
      // reflects the removal without a full reload.
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label={`Delete the ${year} campaign: ${title}`}
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
        <p className="text-xs text-red-400" role="status" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
