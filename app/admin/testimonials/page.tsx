import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquareQuote } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import TestimonialAdmin from "@/components/TestimonialAdmin";
import type { Testimonial } from "@/lib/testimonials";

export const metadata: Metadata = {
  title: "Testimonials — Admin — The Whites Bangladesh",
};

export default async function AdminTestimonialsPage() {
  const supabase = await createClient();

  // Auth gate: getUser() validates the token with Supabase (not just the cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Strict role gate: only admins may manage testimonials.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  // If the table doesn't exist yet this errors and `data` is null — the manager
  // then shows a graceful empty state.
  const { data } = await supabase
    .from("site_testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  const testimonials: Testimonial[] = data ?? [];

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
            <MessageSquareQuote className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">
              Fan Voices
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Manage Testimonials
          </h1>
          <p className="mt-3 max-w-xl text-zinc-300">
            Add and remove the fan reviews shown in the “Voices of the
            Madridistas” section on the About page.
          </p>
        </div>
      </header>

      {/* Manager */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-6">
          <TestimonialAdmin testimonials={testimonials} />
        </div>
      </div>
    </div>
  );
}
