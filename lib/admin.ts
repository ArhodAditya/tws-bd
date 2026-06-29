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
