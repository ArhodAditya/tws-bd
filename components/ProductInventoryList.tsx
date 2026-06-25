"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  PackageX,
  SquarePen,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { CATEGORY_LABEL, formatPrice, type Product } from "@/lib/shop";

export default function ProductInventoryList({
  products: initial,
}: {
  products: Product[];
}) {
  const [supabase] = useState(() => createClient());
  const [products, setProducts] = useState<Product[]>(initial);
  // Per-row in-flight + error state, keyed by product id.
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const toggleStock = async (product: Product) => {
    const next = !product.in_stock;
    const key = `${product.id}:stock`;
    setError(null);
    setPending((p) => ({ ...p, [key]: true }));
    // Optimistic flip so the toggle feels instant.
    setProducts((list) =>
      list.map((p) => (p.id === product.id ? { ...p, in_stock: next } : p))
    );

    const { error: updateError } = await supabase
      .from("products")
      .update({ in_stock: next })
      .eq("id", product.id);

    if (updateError) {
      // Revert on failure and surface the error.
      setProducts((list) =>
        list.map((p) =>
          p.id === product.id ? { ...p, in_stock: product.in_stock } : p
        )
      );
      setError(updateError.message);
    }
    setPending((p) => ({ ...p, [key]: false }));
  };

  // Visibility toggle — flips is_active so admins can hide/show a product on
  // the public storefront. Same optimistic-with-revert pattern as the stock
  // toggle, keyed separately so only this button spins.
  const toggleActive = async (product: Product) => {
    const next = !product.is_active;
    const key = `${product.id}:active`;
    setError(null);
    setPending((p) => ({ ...p, [key]: true }));
    setProducts((list) =>
      list.map((p) => (p.id === product.id ? { ...p, is_active: next } : p))
    );

    const { error: updateError } = await supabase
      .from("products")
      .update({ is_active: next })
      .eq("id", product.id);

    if (updateError) {
      setProducts((list) =>
        list.map((p) =>
          p.id === product.id ? { ...p, is_active: product.is_active } : p
        )
      );
      setError(updateError.message);
    }
    setPending((p) => ({ ...p, [key]: false }));
  };

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-midnight-900/10 bg-white px-6 py-16 text-center shadow-xl">
        <PackageX className="mx-auto h-10 w-10 text-midnight-900/20" />
        <p className="mt-4 text-midnight-900/60">
          No products yet. Add your first item to stock the storefront.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-midnight-900/10 bg-white shadow-xl">
      {error ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-midnight-900/10">
        {products.map((product) => {
          const stockBusy = pending[`${product.id}:stock`];
          const activeBusy = pending[`${product.id}:active`];
          return (
            <li
              key={product.id}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
            >
              {/* Thumbnail */}
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-midnight-900/10 bg-midnight-950">
                {product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              {/* Name + meta */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-midnight-900">
                  {product.name}
                </p>
                <p className="mt-0.5 text-sm text-midnight-900/50">
                  {CATEGORY_LABEL[
                    product.category as keyof typeof CATEGORY_LABEL
                  ] ?? product.category}{" "}
                  · {formatPrice(product.price)}
                </p>
              </div>

              {/* Visibility toggle */}
              <button
                type="button"
                onClick={() => toggleActive(product)}
                disabled={activeBusy}
                aria-pressed={product.is_active}
                title={
                  product.is_active
                    ? "Visible on the storefront — click to hide"
                    : "Hidden from the storefront — click to publish"
                }
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  product.is_active
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-slate-600 text-gray-300 hover:bg-slate-500"
                }`}
              >
                {activeBusy ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : product.is_active ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                {product.is_active ? "Active (Live)" : "Hidden"}
              </button>

              {/* Stock toggle */}
              <button
                type="button"
                onClick={() => toggleStock(product)}
                disabled={stockBusy}
                aria-pressed={product.in_stock}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  product.in_stock
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border-midnight-900/15 bg-zinc-100 text-midnight-900/60 hover:bg-zinc-200"
                }`}
              >
                {stockBusy ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : product.in_stock ? (
                  <ToggleRight className="h-4 w-4" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
                {product.in_stock ? "In Stock" : "Out of Stock"}
              </button>

              {/* Edit */}
              <Link
                href={`/admin/shop/edit/${product.id}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-midnight-900/15 bg-white px-4 py-1.5 text-sm font-semibold text-midnight-900 transition hover:border-gold-500 hover:text-gold-700"
              >
                <SquarePen className="h-4 w-4" />
                Edit
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
