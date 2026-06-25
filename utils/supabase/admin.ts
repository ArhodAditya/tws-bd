import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Server-only Supabase admin client.
//
// This uses the SERVICE ROLE key, which bypasses Row Level Security and can
// read/write any row. NEVER import this file into a Client Component or expose
// the returned client to the browser. `SUPABASE_SERVICE_ROLE_KEY` has no
// `NEXT_PUBLIC_` prefix, so Next.js keeps it server-side — this client is meant
// for Route Handlers, Server Actions and cron jobs only.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable."
    );
  }

  // No cookies/session: the admin client authenticates with the service role
  // key alone, so there is no auth state to persist or refresh.
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
