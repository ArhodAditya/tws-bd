import { createClient } from "@/utils/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

// Server-only: pulls in the cookie-bound Supabase client, so never import this
// from a Client Component (use isCurrentUserAdmin from lib/admin there instead).

export type AdminGateResult = {
  success: boolean;
  message?: string;
  // The verified caller's id, so actions can attribute writes to the session
  // rather than trusting a client-supplied value.
  userId?: string;
};

// The single Server Action admin gate. Server Actions are reachable via direct
// POST, so every privileged action re-verifies here — a page gate is never
// enough. Role comes from the current_user_role() RPC and fails closed.
export async function requireAdmin(): Promise<AdminGateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "You must be signed in." };

  if (!(await isCurrentUserAdmin(supabase))) {
    return { success: false, message: "Admins only." };
  }
  return { success: true, userId: user.id };
}
