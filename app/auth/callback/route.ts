import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// OAuth callback. Supabase (PKCE flow) redirects here with a `?code=...` which
// we exchange for a session, writing the auth cookies before redirecting on.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Where to send the user after a successful sign-in. Only accept internal,
  // non-protocol-relative paths — otherwise `new URL(next, base)` below would
  // honour an absolute value like `https://evil.com`, an open-redirect vector.
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      // No load balancer locally so `origin` is reliable; behind one in prod,
      // trust the forwarded host.
      const base =
        isLocalEnv || !forwardedHost ? origin : `https://${forwardedHost}`;

      // Flag a *fresh* sign-in so the client can fire the welcome toast exactly
      // once. After the OAuth round-trip the browser client only sees
      // INITIAL_SESSION (not SIGNED_IN), so this server-set marker is the
      // reliable signal. The toast strips `welcome` from the URL after greeting,
      // so it never re-fires on reload.
      const destination = new URL(next, base);
      destination.searchParams.set("welcome", "1");
      return NextResponse.redirect(destination);
    }
  }

  // Something went wrong (missing/expired code).
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
