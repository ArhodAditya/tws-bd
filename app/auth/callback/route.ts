import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// OAuth callback. Supabase (PKCE flow) redirects here with a `?code=...` which
// we exchange for a session, writing the auth cookies before redirecting on.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Where to send the user after a successful sign-in.
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // No load balancer in front locally — origin is reliable.
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Something went wrong (missing/expired code).
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
