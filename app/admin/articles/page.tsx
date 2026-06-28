import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, FileText, Newspaper, Pencil } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { CategoryBadge } from "@/components/NewsCard";
import DeleteArticleButton from "@/components/DeleteArticleButton";
import { formatArticleDate, type ArticleWithAuthor } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Manage News — Admin — The Whites Bangladesh",
};

export default async function AdminArticlesPage() {
  const supabase = await createClient();

  // Auth gate: getUser() validates the token with Supabase (not just the cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Strict role gate: only admins may manage articles.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  // Real DB articles only — the sample/mock fallbacks aren't stored and so can't
  // be edited or deleted.
  const { data } = await supabase
    .from("articles")
    .select("*, profiles(full_name, avatar_url)")
    .order("created_at", { ascending: false });

  const articles: ArticleWithAuthor[] = data ?? [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-midnight-950">
      {/* Header */}
      <header className="relative overflow-hidden bg-midnight-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(212,175,55,0.1),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-gold-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="mt-6 flex items-center gap-2 text-gold-300">
            <Newspaper className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">
              Manage News
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Published Articles
            </h1>
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-5 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.03]"
            >
              <FileText className="h-4 w-4" />
              Write New Article
            </Link>
          </div>
          <p className="mt-3 max-w-xl text-zinc-300">
            Edit any story or remove it from the site. Deletes are permanent and
            clear the news index, homepage, and this list immediately.
          </p>
        </div>
      </header>

      {/* List */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-6">
          <p className="mb-3 text-sm font-medium text-slate-500 dark:text-gray-400">
            {articles.length} article{articles.length === 1 ? "" : "s"}
          </p>

          {articles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-midnight-900/15 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/40">
              <Newspaper className="mx-auto h-10 w-10 text-midnight-900/20 dark:text-white/20" />
              <p className="mt-4 text-sm text-slate-600 dark:text-gray-300">
                No articles published yet. Write your first story to see it here.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {articles.map((article) => (
                <li
                  key={article.id}
                  className="flex flex-col gap-4 rounded-2xl border border-midnight-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge category={article.category} />
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatArticleDate(article.created_at)}
                      </span>
                    </div>
                    <Link
                      href={`/news/${article.slug}`}
                      className="mt-2 block truncate font-display text-lg font-bold text-slate-900 transition-colors hover:text-gold-600 dark:text-white dark:hover:text-gold-300"
                    >
                      {article.title ?? "Untitled"}
                    </Link>
                  </div>

                  <div className="flex shrink-0 items-start gap-2">
                    <Link
                      href={`/admin/articles/edit/${article.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-midnight-900/15 bg-white px-3 py-1.5 text-sm font-semibold text-midnight-900 transition-colors hover:border-gold-500 hover:text-gold-700 dark:border-white/15 dark:bg-transparent dark:text-white dark:hover:text-gold-300"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <DeleteArticleButton
                      id={article.id}
                      title={article.title ?? "Untitled"}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
