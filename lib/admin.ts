import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/supabase/database.types";

// Super-admin identity. This single account is the ONLY one allowed to promote
// other users to admin (see addAdminByEmail in app/admin/actions.ts and the
// /admin/admins page). Every gate — server action, page, and nav link — funnels
// through isSuperAdmin so the rule lives in exactly one place.
export const SUPER_ADMIN_EMAIL = "senguptaaditya47@gmail.com";

// Gmail addresses are case-insensitive, so we normalize before comparing: the
// real owner is never locked out by capitalization, and no other email matches.
export function isSuperAdmin(email?: string | null): boolean {
  return (email ?? "").trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

// Current caller's role, read via the current_user_role() SECURITY DEFINER RPC
// rather than a direct `profiles.role` select. This lets us revoke SELECT on
// profiles.role from anon/authenticated (closing the role-enumeration vector)
// while the app can still check its own role. Fails closed: any error (incl. no
// session, so auth.uid() is null) resolves to null → not an admin.
export async function getCurrentUserRole(
  supabase: SupabaseClient<Database>
): Promise<string | null> {
  const { data, error } = await supabase.rpc("current_user_role");
  if (error) return null;
  return data ?? null;
}

export async function isCurrentUserAdmin(
  supabase: SupabaseClient<Database>
): Promise<boolean> {
  return (await getCurrentUserRole(supabase)) === "admin";
}
