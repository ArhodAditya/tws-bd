import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/supabase/database.types";
import { SITE_URL } from "@/lib/site";

// Refresh hourly. We use a plain anon Supabase client (no cookies/session)
// below, so this route stays statically cacheable and is rebuilt on a schedule
// rather than querying the database on every crawler hit.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Top-level public sections. These always exist, so they anchor the sitemap
  // even if the database is unreachable.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${SITE_URL}/news`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/fans-zone`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/events`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return staticRoutes;

  // Keyless anon client: we only read publicly-visible rows here, and skipping
  // cookies() keeps this route cacheable (see `revalidate` above).
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  // Articles: every published article with a slug. Products: only active ones
  // (matches the storefront's is_active filter). A failed query yields null and
  // degrades gracefully to the static routes.
  const [{ data: articles }, { data: products }] = await Promise.all([
    supabase
      .from("articles")
      .select("slug, created_at")
      .not("slug", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const articleRoutes: MetadataRoute.Sitemap = (articles ?? []).map(
    (article) => ({
      url: `${SITE_URL}/news/${article.slug}`,
      lastModified: new Date(article.created_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map(
    (product) => ({
      url: `${SITE_URL}/shop/${product.id}`,
      lastModified: new Date(product.created_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  return [...staticRoutes, ...articleRoutes, ...productRoutes];
}
