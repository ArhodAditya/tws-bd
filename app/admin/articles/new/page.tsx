import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import NewArticleForm from "@/components/NewArticleForm";

export const metadata: Metadata = {
  title: "New Article — Admin — The Whites Bangladesh",
};

export default async function NewArticlePage() {
  const supabase = await createClient();

  // Auth gate: getUser() validates the token with Supabase (not just the cookie).
  // Role-based ('admin') checks come later — for now any active session is fine.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Strict role gate: only admins may reach the publishing form.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const authorName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "your account";

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="relative overflow-hidden bg-midnight-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(212,175,55,0.1),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-gold-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Link>
          <div className="mt-6 flex items-center gap-2 text-gold-300">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">
              Admin
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Publish a New Article
          </h1>
          <p className="mt-3 max-w-xl text-zinc-300">
            Craft the next headline for the Madridista faithful. It goes live the
            moment you publish.
          </p>
        </div>
      </header>

      {/* Form */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-6">
          <NewArticleForm userId={user.id} authorName={authorName} />
        </div>
      </div>
    </div>
  );
}
