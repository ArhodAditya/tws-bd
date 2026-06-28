import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { FALLBACK_WHATSAPP_NUMBER, type Product } from "@/lib/shop";
import ProductDetail from "@/components/ProductDetail";

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

  // Plain-text meta description: strip Markdown markers and clamp to ~150 chars.
  const summary = (product.description ?? "")
    .replace(/[#>*_`~[\]()!-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);

  return {
    title: `${product.name} — Shop — The Whites Bangladesh`,
    description:
      summary ||
      `Order the ${product.name} from The Whites Bangladesh. ¡Hala Madrid!`,
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

  return <ProductDetail product={product} whatsappNumber={whatsappNumber} />;
}
