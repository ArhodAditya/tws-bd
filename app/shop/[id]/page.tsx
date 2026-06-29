import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  FALLBACK_WHATSAPP_NUMBER,
  getProductDescription,
  type Product,
} from "@/lib/shop";
import { SITE_LOGO, SITE_NAME, SITE_URL } from "@/lib/site";
import ProductDetail from "@/components/ProductDetail";
import JsonLd from "@/components/JsonLd";

type ProductParams = { id: string };

// Fetch a single product by id. Wrapped in React's cache() so generateMetadata
// and the page itself share one query per request. Returns null on a missing
// row or an invalid uuid (PostgREST errors → data is null).
const getProduct = cache(async (id: string): Promise<Product | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Product | null) ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<ProductParams>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Product Not Found — The Whites Bangladesh" };
  }

  const description = getProductDescription(product);
  // Products store an `images` array; use the primary shot, else the brand logo.
  const ogImage = product.images?.[0] ?? SITE_LOGO;

  return {
    title: `${product.name} — Shop — The Whites Bangladesh`,
    description,
    alternates: { canonical: `/shop/${id}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: `${SITE_URL}/shop/${id}`,
      siteName: SITE_NAME,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<ProductParams>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? FALLBACK_WHATSAPP_NUMBER;

  // Product structured data so the listing is eligible for rich results, with an
  // Offer carrying the BDT price and in-stock availability.
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: getProductDescription(product, 5000),
    image: product.images?.length ? product.images : [SITE_LOGO],
    category: product.category,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "BDT",
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/shop/${id}`,
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <ProductDetail product={product} whatsappNumber={whatsappNumber} />
    </>
  );
}
