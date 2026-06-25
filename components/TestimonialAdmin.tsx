"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  MessageSquareQuote,
  Plus,
  Quote,
  Star,
  Trash2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  MAX_RATING,
  clampRating,
  formatHandle,
  type Testimonial,
} from "@/lib/testimonials";

export default function TestimonialAdmin({
  testimonials: initial,
}: {
  testimonials: Testimonial[];
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initial);

  // Add-form state.
  const [userName, setUserName] = useState("");
  const [handle, setHandle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Per-row delete state + a shared list-level error.
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [listError, setListError] = useState<string | null>(null);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const name = userName.trim();
    const text = content.trim();
    const cleanHandle = handle.trim().replace(/^@+/, "");

    if (!name) {
      setFormError("Please enter a name.");
      return;
    }
    if (!text) {
      setFormError("Please enter the testimonial content.");
      return;
    }

    setAdding(true);
    const { data, error } = await supabase
      .from("site_testimonials")
      .insert({
        user_name: name,
        handle: cleanHandle || null,
        content: text,
        rating: clampRating(rating) || 1,
      })
      .select()
      .single();

    if (error) {
      setFormError(error.message);
      setAdding(false);
      return;
    }

    // Prepend the new row so the list refreshes instantly (newest first, the
    // same order the page fetches in).
    if (data) {
      setTestimonials((list) => [data, ...list]);
    }
    setUserName("");
    setHandle("");
    setContent("");
    setRating(5);
    setAdding(false);
    router.refresh();
  };

  const handleDelete = async (testimonial: Testimonial) => {
    if (
      !window.confirm(
        `Delete the testimonial from ${testimonial.user_name ?? "this fan"}? This can't be undone.`
      )
    ) {
      return;
    }

    setListError(null);
    setPending((p) => ({ ...p, [testimonial.id]: true }));

    const { error } = await supabase
      .from("site_testimonials")
      .delete()
      .eq("id", testimonial.id);

    if (error) {
      setListError(error.message);
      setPending((p) => ({ ...p, [testimonial.id]: false }));
      return;
    }

    setTestimonials((list) => list.filter((t) => t.id !== testimonial.id));
    router.refresh();
  };

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 dark:border-white/10 dark:bg-slate-900/40 dark:text-white dark:placeholder:text-gray-500";
  const labelClass =
    "block text-sm font-semibold text-slate-900 dark:text-white";

  return (
    <div className="space-y-8">
      {/* ===== Add New Testimonial ===== */}
      <form
        onSubmit={handleAdd}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-slate-900/40 sm:p-8"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-400">
            <Plus className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Add New Testimonial
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="user_name" className={labelClass}>
              Name
            </label>
            <input
              id="user_name"
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Karim Benzema"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="handle" className={labelClass}>
              Handle{" "}
              <span className="font-normal text-slate-400 dark:text-gray-500">
                (without @)
              </span>
            </label>
            <input
              id="handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="madridista_bd"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className={labelClass}>
            Content
          </label>
          <textarea
            id="content"
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="The Whites Bangladesh is the only place I trust for Madrid news…"
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </div>

        {/* Star rating picker */}
        <div className="space-y-2">
          <span className={labelClass}>Rating</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: MAX_RATING }, (_, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  aria-pressed={rating === value}
                  className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/40"
                >
                  <Star
                    className={`h-6 w-6 ${
                      value <= rating
                        ? "fill-gold-500 text-gold-500"
                        : "fill-transparent text-gray-300 dark:text-white/20"
                    }`}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-sm font-medium text-slate-500 dark:text-gray-400">
              {rating} / {MAX_RATING}
            </span>
          </div>
        </div>

        {formError ? (
          <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </p>
        ) : null}

        <div className="flex justify-end border-t border-gray-200 pt-6 dark:border-white/10">
          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
          >
            {adding ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Testimonial
              </>
            )}
          </button>
        </div>
      </form>

      {/* ===== Existing testimonials ===== */}
      <div>
        <p className="mb-3 text-sm font-medium text-slate-500 dark:text-gray-400">
          {testimonials.length} testimonial
          {testimonials.length === 1 ? "" : "s"}
        </p>

        {listError ? (
          <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {listError}
          </p>
        ) : null}

        {testimonials.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/40">
            <MessageSquareQuote className="mx-auto h-10 w-10 text-slate-300 dark:text-white/20" />
            <p className="mt-4 text-slate-500 dark:text-gray-400">
              No testimonials yet. Add the first voice above.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {testimonials.map((testimonial) => {
              const busy = pending[testimonial.id];
              const stars = clampRating(testimonial.rating);
              const displayHandle = formatHandle(testimonial.handle);
              return (
                <li
                  key={testimonial.id}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/40 sm:flex-row sm:items-start sm:gap-5"
                >
                  <Quote
                    className="hidden h-7 w-7 shrink-0 text-gold-500 sm:block"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {testimonial.user_name}
                      </span>
                      {displayHandle ? (
                        <span className="text-sm text-gold-600 dark:text-gold-400">
                          {displayHandle}
                        </span>
                      ) : null}
                      <span
                        className="flex items-center gap-0.5"
                        aria-label={`${stars} out of ${MAX_RATING} stars`}
                      >
                        {Array.from({ length: MAX_RATING }, (_, i) => (
                          <Star
                            key={i}
                            aria-hidden
                            className={`h-3.5 w-3.5 ${
                              i < stars
                                ? "fill-gold-500 text-gold-500"
                                : "fill-transparent text-gray-300 dark:text-white/20"
                            }`}
                          />
                        ))}
                      </span>
                    </div>
                    <p className="mt-2 leading-relaxed text-slate-600 dark:text-gray-300">
                      {testimonial.content}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(testimonial)}
                    disabled={busy}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                  >
                    {busy ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
