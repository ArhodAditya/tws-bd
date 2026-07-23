"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle, Save } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  SHOP_CATEGORIES,
  CATEGORY_LABEL,
  FASHION_DEFAULT_SIZES,
  parseCustomSizeChart,
  resolveSizePattern,
  type Product,
  type ShopCategory,
  type SizeChartRow,
  type SizePattern,
} from "@/lib/shop";
import ImageUploader from "@/components/ImageUploader";
import SizingBlueprintSelector from "@/components/SizingBlueprintSelector";

// Split a comma / newline separated string into a clean string[].
function toList(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  // Pre-fill every field from the existing product.
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(String(product.price));
  const [category, setCategory] = useState<ShopCategory>(
    product.category as ShopCategory
  );
  const [sizePattern, setSizePattern] = useState<SizePattern>(() =>
    resolveSizePattern(product)
  );
  const [customRows, setCustomRows] = useState<SizeChartRow[]>(() =>
    parseCustomSizeChart(product.custom_size_chart)
  );
  const [images, setImages] = useState<string[]>(product.images ?? []);
  const [sizes, setSizes] = useState((product.sizes ?? []).join(", "));
  const [badgeText, setBadgeText] = useState(product.badge_text ?? "");
  const [inStock, setInStock] = useState(product.in_stock);
  const [isActive, setIsActive] = useState(product.is_active);
  const [isFeatured, setIsFeatured] = useState(product.is_featured);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Picking the fashion blueprint pre-fills the matching M/L/XL sizes; the
  // custom blueprint opens with one blank row ready to type into.
  const handlePatternChange = (next: SizePattern) => {
    if (next === sizePattern) return;
    setSizePattern(next);
    if (next === "fashion") setSizes(FASHION_DEFAULT_SIZES.join(", "));
    if (next === "custom" && customRows.length === 0) {
      setCustomRows([{ size: "", chest: "", length: "" }]);
    }
  };

  // Tagging a product as Streetwear implies the winter-drop (fashion) chart.
  const handleCategoryChange = (next: ShopCategory) => {
    setCategory(next);
    if (next === "streetwear") handlePatternChange("fashion");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const priceValue = Number(price);
    if (!trimmedName) {
      setError("Please give the product a name.");
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Please enter a valid price.");
      return;
    }

    // Custom blueprint: keep only rows with a size label; require at least one.
    const cleanedRows = customRows
      .map((row) => ({
        size: row.size.trim(),
        chest: row.chest.trim(),
        length: row.length.trim(),
      }))
      .filter((row) => row.size);
    if (sizePattern === "custom" && cleanedRows.length === 0) {
      setError("Add at least one row to the custom size chart.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase
      .from("products")
      .update({
        name: trimmedName,
        description: description.trim() || null,
        price: priceValue,
        category,
        size_pattern: sizePattern,
        custom_size_chart: sizePattern === "custom" ? cleanedRows : null,
        images,
        sizes: toList(sizes),
        badge_text: badgeText.trim() || null,
        in_stock: inStock,
        is_active: isActive,
        is_featured: isFeatured,
      })
      .eq("id", product.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Back to the inventory list so the admin sees the saved change.
    router.push("/admin/shop");
    router.refresh();
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-4 py-2.5 text-white shadow-sm outline-none transition placeholder:text-zinc-600 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30";
  const labelClass = "block text-sm font-semibold text-white";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6 shadow-2xl backdrop-blur-md sm:p-8"
    >
      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="name" className={labelClass}>
          Product Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Real Madrid 2025/26 Home Jersey"
          className={inputClass}
        />
      </div>

      {/* Price + Category */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="price" className={labelClass}>
            Price (৳)
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="1"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="4500"
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className={labelClass}>
            Category
          </label>
          <div className="relative">
            <select
              id="category"
              value={category}
              onChange={(e) =>
                handleCategoryChange(e.target.value as ShopCategory)
              }
              className={`${inputClass} appearance-none pr-10`}
            >
              {SHOP_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABEL[value]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Sizing blueprint — which size chart the product page renders */}
      <SizingBlueprintSelector
        pattern={sizePattern}
        onPatternChange={handlePatternChange}
        customRows={customRows}
        onCustomRowsChange={setCustomRows}
      />

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Premium match-grade fabric, embroidered crest…"
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      {/* Images */}
      <div className="space-y-2">
        <span className={labelClass}>
          Product Images{" "}
          <span className="font-normal text-zinc-500">
            (upload to Cloudinary)
          </span>
        </span>
        <ImageUploader value={images} onChange={setImages} />
      </div>

      {/* Sizes */}
      <div className="space-y-2">
        <label htmlFor="sizes" className={labelClass}>
          Sizes{" "}
          <span className="font-normal text-zinc-500">
            (comma-separated — leave blank for footballs)
          </span>
        </label>
        <input
          id="sizes"
          type="text"
          value={sizes}
          onChange={(e) => setSizes(e.target.value)}
          placeholder="S, M, L, XL"
          className={inputClass}
        />
      </div>

      {/* Promo Badge / Tag */}
      <div className="space-y-2">
        <label htmlFor="badge_text" className={labelClass}>
          Promo Badge / Tag{" "}
          <span className="font-normal text-zinc-500">
            (optional — shown on the product card)
          </span>
        </label>
        <input
          id="badge_text"
          type="text"
          value={badgeText}
          maxLength={24}
          onChange={(e) => setBadgeText(e.target.value)}
          placeholder="15% OFF, HOT, NEW DROP…"
          className={inputClass}
        />
      </div>

      {/* In stock */}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-700 text-gold-500 accent-gold-500 focus:ring-gold-500"
        />
        <span className="text-sm font-semibold text-white">
          In stock
        </span>
      </label>

      {/* Publish to storefront — uncheck to hide this product from customers. */}
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-zinc-700 text-gold-500 accent-gold-500 focus:ring-gold-500"
        />
        <span className="text-sm font-semibold text-white">
          Publish to Storefront (Active)
          <span className="mt-0.5 block text-xs font-normal text-zinc-500">
            Uncheck to hide this product from the public storefront.
          </span>
        </span>
      </label>

      {/* Feature on homepage — surfaces this product in the Featured section. */}
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-zinc-700 text-gold-500 accent-gold-500 focus:ring-gold-500"
        />
        <span className="text-sm font-semibold text-white">
          Feature on Homepage
          <span className="mt-0.5 block text-xs font-normal text-zinc-500">
            Highlights this product in the Featured section on the home page.
          </span>
        </span>
      </label>

      {/* Error */}
      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {/* Actions */}
      <div className="flex justify-end border-t border-zinc-800/50 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-2.5 text-sm font-semibold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
