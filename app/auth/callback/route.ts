import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

      // Signal a *fresh* sign-in to the client via a short-lived cookie, which
      // the welcome toast reads through document.cookie. We use a cookie (not a
      // ?welcome query param) because Vercel's static route caching was
      // swallowing the query string across the OAuth redirect.
      //
      // - httpOnly MUST be false so document.cookie can read it client-side.
      // - cookies() is async in this Next version, so it must be awaited;
      //   `cookies().set(...)` would throw.
      const cookieStore = await cookies();
      cookieStore.set("tws_vip_welcome", "true", {
        maxAge: 15,
        path: "/",
        httpOnly: false,
        sameSite: "lax",
      });

      // Clean redirect to the (validated, internal) next path — no query string.
      return NextResponse.redirect(new URL(next, base));
    }
  }

  // Something went wrong (missing/expired code).
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
