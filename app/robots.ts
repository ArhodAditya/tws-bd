import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Generated /robots.txt. Static (no request-time APIs), so Next caches it.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep crawlers out of the gated admin panel and the auth callback route —
      // they're not public and carry no SEO value.
      disallow: ["/admin/", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
