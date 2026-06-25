"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import ImageUploader from "@/components/ImageUploader";

const CATEGORIES = ["news", "breaking", "analysis", "report"] as const;

// Turn a title into a URL-safe slug (handles accents like Bernabéu → bernabeu).
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    // NFKD splits accents into "base char + combining mark"; the replace below
    // drops the combining marks along with any other non-URL-safe characters.
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewArticleForm({
  userId,
  authorName,
}: {
  userId: string;
  authorName: string;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [category, setCategory] = useState<string>("news");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the slug in sync with the title until the user edits it themselves.
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  };

  const handleSlugChange = (value: string) => {
    setSlug(slugify(value));
    setSlugEdited(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const finalSlug = slugify(slug) || slugify(title);
    if (!title.trim() || !finalSlug || !content.trim()) {
      setError("Please provide a title, slug, and content.");
      return;
    }

    setLoading(true);
    const { error: insertError } = await supabase.from("articles").insert({
      title: title.trim(),
      slug: finalSlug,
      category,
      image_url: imageUrl.trim() || null,
      content,
      author_id: userId,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Straight to the freshly published article. Keep `loading` true so the
    // button stays disabled while the navigation happens.
    router.push(`/news/${finalSlug}`);
    router.refresh();
  };

  const inputClass =
    "w-full rounded-lg border border-midnight-900/15 bg-white px-4 py-2.5 text-midnight-900 shadow-sm outline-none transition placeholder:text-midnight-900/30 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30";
  const labelClass = "block text-sm font-semibold text-midnight-900";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-midnight-900/10 bg-white p-6 shadow-xl sm:p-8"
    >
      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="Real Madrid Clinch La Liga Title…"
          className={inputClass}
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <label htmlFor="slug" className={labelClass}>
          Slug
        </label>
        <input
          id="slug"
          type="text"
          required
          value={slug}
          onChange={(event) => handleSlugChange(event.target.value)}
          placeholder="real-madrid-clinch-la-liga"
          className={inputClass}
        />
        <p className="text-xs text-midnight-900/50">
          Auto-generated from the title — edit if you like. URL:{" "}
          <span className="font-medium text-gold-600">
            /news/{slug || "your-slug"}
          </span>
        </p>
      </div>

      {/* Category + Image URL */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="category" className={labelClass}>
            Category
          </label>
          <div className="relative">
            <select
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={`${inputClass} appearance-none pr-10 capitalize`}
            >
              {CATEGORIES.map((option) => (
                <option key={option} value={option} className="capitalize">
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-midnight-900/40" />
          </div>
        </div>

        <div className="space-y-2">
          <span className={labelClass}>
            Cover Image{" "}
            <span className="font-normal text-midnight-900/40">(optional)</span>
          </span>
          <ImageUploader
            multiple={false}
            value={imageUrl ? [imageUrl] : []}
            onChange={(action) =>
              setImageUrl((prev) => {
                const next =
                  typeof action === "function"
                    ? action(prev ? [prev] : [])
                    : action;
                return next[0] ?? "";
              })
            }
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label htmlFor="content" className={labelClass}>
          Content
        </label>
        <textarea
          id="content"
          required
          rows={12}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write the story… Separate paragraphs with a blank line."
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      {/* Error */}
      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {/* Actions */}
      <div className="flex flex-col-reverse items-stretch gap-4 border-t border-midnight-900/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-midnight-900/50">
          Publishing as{" "}
          <span className="font-semibold text-midnight-900">{authorName}</span>
        </p>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Publishing…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Publish Article
            </>
          )}
        </button>
      </div>
    </form>
  );
}
