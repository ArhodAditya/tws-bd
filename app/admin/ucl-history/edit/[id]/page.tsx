import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin";
import UclCampaignForm from "@/components/UclCampaignForm";

export const metadata: Metadata = {
  title: "Edit Campaign — Admin — The Whites Stories",
};

export default async function EditUclCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth gate: getUser() validates the token with Supabase (not just the cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Strict role gate: only admins may edit campaigns.
  if (!(await isCurrentUserAdmin(supabase))) {
    redirect("/");
  }

  // A malformed id makes Postgres reject the uuid comparison; either way there
  // is no such campaign, so both cases fall through to the 404.
  const { data: campaign } = await createAdminClient()
    .from("ucl_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(212,175,55,0.1),transparent_55%)]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <Link
            href="/admin/ucl-history"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-gold-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to UCL History
          </Link>
          <div className="mt-6 flex items-center gap-2 text-gold-300">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">
              Admin
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {campaign.year} · {campaign.title}
          </h1>
          <p className="mt-3 max-w-xl text-zinc-300">
            Write the full story of the campaign, add the photo of the final,
            or correct a detail. Changes reach the Fans Zone the moment you
            save.
          </p>
        </div>
      </header>

      {/* Form */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="-mt-6">
          <UclCampaignForm campaign={campaign} />
        </div>
      </div>
    </div>
  );
}
