"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { RotateCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  getFallbackHistory,
  type CampaignSource,
  type UclCampaignSummary,
} from "@/lib/ucl-campaigns";

// The long-form story of one campaign. Histories can run to thousands of words
// each, so they are not shipped with the page: the text is fetched the first
// time a campaign is opened, then kept for the rest of the visit.
//
// The Markdown renderer is loaded on demand too — it is only needed once a
// panel is open.

const SafeMarkdown = dynamic(() => import("@/components/SafeMarkdown"), {
  loading: () => <HistorySkeleton />,
});

// Histories already fetched this visit, by campaign id. `null` = nothing
// written yet (a real answer, so it is cached like any other).
const fetched = new Map<string, string | null>();

type Outcome =
  | { status: "loaded"; text: string | null }
  | { status: "failed" };

export default function CampaignHistory({
  campaign,
  source,
}: {
  campaign: UclCampaignSummary;
  source: CampaignSource;
}) {
  const [supabase] = useState(() => createClient());
  // The outcome of the latest request, tagged with the campaign it was for so
  // a slow response for a campaign the reader has left is never shown.
  const [result, setResult] = useState<{ id: string; outcome: Outcome } | null>(
    null
  );
  const [attempt, setAttempt] = useState(0);

  const { id } = campaign;
  const fromDatabase = source === "database";

  useEffect(() => {
    if (!fromDatabase || fetched.has(id)) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("ucl_campaigns")
        .select("detailed_history")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;

      if (error) {
        setResult({ id, outcome: { status: "failed" } });
        return;
      }
      const text = data?.detailed_history?.trim() || null;
      fetched.set(id, text);
      setResult({ id, outcome: { status: "loaded", text } });
    })();

    return () => {
      cancelled = true;
    };
  }, [id, fromDatabase, supabase, attempt]);

  // What to show is derived, not stored: fallback campaigns carry their text
  // locally, a cached history is ready at once, and otherwise it is whatever
  // the latest request for *this* campaign came back with.
  let outcome: Outcome | null;
  if (!fromDatabase) {
    outcome = { status: "loaded", text: getFallbackHistory(id) };
  } else if (fetched.has(id)) {
    outcome = { status: "loaded", text: fetched.get(id) ?? null };
  } else {
    outcome = result && result.id === id ? result.outcome : null;
  }

  if (outcome === null) {
    return <HistorySkeleton />;
  }

  if (outcome.status === "failed") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm leading-relaxed text-zinc-300">
          The story couldn&apos;t be loaded. Check your connection and try
          again.
        </p>
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setAttempt((count) => count + 1);
          }}
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-[#D4AF37]/50 px-4 text-sm font-semibold text-[#F1DD96] outline-none transition-colors hover:bg-[#D4AF37]/10 focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        >
          <RotateCw aria-hidden className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  if (!outcome.text) {
    return (
      <p className="text-sm leading-relaxed text-zinc-500">
        The full story of this campaign hasn&apos;t been written yet.
      </p>
    );
  }

  return (
    // Long-form reading: generous leading, soft body colour, and the serif
    // reserved for the section headings.
    <div className="prose prose-invert max-w-none text-[15px] leading-[1.8] prose-headings:mb-3 prose-headings:mt-8 prose-headings:font-regal prose-headings:font-medium prose-headings:italic prose-headings:text-white prose-h2:text-[1.6rem] prose-h3:text-[1.3rem] prose-p:my-4 prose-p:text-zinc-300 prose-a:font-medium prose-a:text-[#F1DD96] prose-a:decoration-[#D4AF37]/50 prose-a:underline-offset-4 hover:prose-a:text-white prose-blockquote:border-[#D4AF37]/50 prose-blockquote:font-normal prose-blockquote:text-zinc-200 prose-strong:font-semibold prose-strong:text-white prose-li:my-1 prose-li:text-zinc-300 prose-li:marker:text-[#D4AF37]/70 prose-hr:border-white/10 prose-img:my-6 prose-img:w-full prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-headings:first:mt-0">
      <SafeMarkdown externalLinksInNewTab>{outcome.text}</SafeMarkdown>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">Loading the story…</span>
      {["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-2/3"].map(
        (width, index) => (
          <div
            key={index}
            aria-hidden
            className={`h-3.5 rounded-full bg-white/[0.07] motion-safe:animate-pulse ${width}`}
          />
        )
      )}
    </div>
  );
}
