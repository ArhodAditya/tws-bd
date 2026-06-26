// Image proxy for Sofascore team crests.
//
// Sofascore doesn't return logo URLs, so we build them from the team id —
// but loading the CDN directly from the browser can hit hotlink/CORS blocks,
// and using next/image would need a remotePatterns entry. Proxying through our
// own origin sidesteps both. Crests are effectively static, so we cache hard.
// On any failure we return a 4xx/5xx and let the client <img> onError fall back
// to a lettered chip.

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Only numeric team ids — avoids being used as an open proxy.
  if (!/^\d+$/.test(id)) {
    return new Response("Invalid team id", { status: 400 });
  }

  const upstream = `https://api.sofascore.app/api/v1/team/${id}/image`;

  try {
    const res = await fetch(upstream, {
      headers: {
        // A browser-like UA helps avoid bot blocks on the public CDN.
        "User-Agent":
          "Mozilla/5.0 (compatible; TheWhitesBangladesh/1.0; +https://thewhitesbd.com)",
      },
      // Let our own Cache-Control below govern caching, not the fetch cache.
      cache: "no-store",
    });

    if (!res.ok || !res.body) {
      return new Response("Crest not found", { status: 404 });
    }

    const contentType = res.headers.get("content-type") ?? "image/png";
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache at the browser (1d) and the edge (7d) — crests rarely change.
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch {
    return new Response("Upstream error", { status: 502 });
  }
}
