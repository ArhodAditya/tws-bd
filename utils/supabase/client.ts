import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Browser Supabase client. Uses cookie storage (via @supabase/ssr) so the
// session stays in sync with the server (proxy + Server Components).
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
