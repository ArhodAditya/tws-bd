import { NextResponse } from "next/server";

// Google Search Console HTML-file verification. The folder name intentionally
// includes the `.html` extension so this serves at exactly
// /googlea2e18268e74ca7a0.html — the URL Google fetches to verify the domain.
export async function GET() {
  const content = "google-site-verification: googlea2e18268e74ca7a0.html";
  return new NextResponse(content, {
    headers: { "Content-Type": "text/html" },
  });
}
