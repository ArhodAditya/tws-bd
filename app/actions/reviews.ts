"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { MAX_DISPLAY_NAME_LENGTH, MAX_REVIEW_LENGTH } from "@/lib/fan-reviews";

export type ActionResult = {
  success: boolean;
  message?: string;
};

// Submit a fan review for the current authenticated user. The row is created
// UNAPPROVED (is_approved defaults to false) and stays hidden from the public
// "Voices of the Madridistas" wall until an admin approves it. RLS additionally
// guarantees a fan can only insert a row under their own id.
export async function submitFanReview(
  reviewText: string,
  displayName?: string
): Promise<ActionResult> {
  const text = reviewText.trim();
  if (!text) {
    return { success: false, message: "Write something first, blud." };
  }
  if (text.length > MAX_REVIEW_LENGTH) {
    return {
      success: false,
      message: `Keep it under ${MAX_REVIEW_LENGTH} characters.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Log in to drop a review." };
  }

  // Optional custom name; blank falls back to the fan's profile name on display.
  const name = displayName?.trim();

  const { error } = await supabase.from("fan_reviews").insert({
    user_id: user.id,
    review_text: text,
    display_name: name ? name.slice(0, MAX_DISPLAY_NAME_LENGTH) : null,
  });

  if (error) return { success: false, message: error.message };

  // The new review is pending, so the public wall doesn't change yet — but
  // refresh the moderation queue so an admin sees it straight away.
  revalidatePath("/admin/reviews");
  return { success: true };
}

// Re-verify the caller is an admin. Server Actions are reachable via direct
// POST, so the page gate alone is never enough. (Mirrors app/admin/actions.ts.)
async function requireAdmin(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { success: false, message: "Admins only." };
  }
  return { success: true };
}

// Approve / unapprove a fan review (flip is_approved). Uses the service-role
// client so an admin can update a row they don't own (fan_reviews RLS restricts
// updates to admins, but the service role also sidesteps any per-row checks);
// admin status is re-verified above. Approving a review reveals it on the wall.
export async function toggleReviewApproval(
  reviewId: string,
  isApproved: boolean
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.success) return gate;

  const admin = createAdminClient();
  const { error } = await admin
    .from("fan_reviews")
    .update({ is_approved: isApproved })
    .eq("id", reviewId);

  if (error) return { success: false, message: error.message };

  // Reflect the change on both the public wall and the moderation queue.
  revalidatePath("/fans-zone");
  revalidatePath("/admin/reviews");
  return { success: true };
}

// Add a review "on behalf of" a customer — for testimonials collected offline
// (DMs, WhatsApp, in person). The row carries no user_id, uses the typed
// display_name, and is published immediately (is_approved = true). Admin-only;
// runs through the service-role client so the null user_id and auto-approve
// sidestep the public RLS policies.
export async function addAdminManualReview(
  displayName: string,
  reviewText: string
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.success) return gate;

  const name = displayName.trim();
  const text = reviewText.trim();
  if (!name) return { success: false, message: "Enter a display name." };
  if (!text) return { success: false, message: "Enter the review text." };
  if (text.length > MAX_REVIEW_LENGTH) {
    return {
      success: false,
      message: `Keep it under ${MAX_REVIEW_LENGTH} characters.`,
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("fan_reviews").insert({
    user_id: null,
    display_name: name.slice(0, MAX_DISPLAY_NAME_LENGTH),
    review_text: text,
    is_approved: true,
  });

  if (error) return { success: false, message: error.message };

  // Live immediately — refresh the public wall and the moderation queue.
  revalidatePath("/fans-zone");
  revalidatePath("/admin/reviews");
  return { success: true };
}
