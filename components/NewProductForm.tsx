"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle, PackagePlus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  SHOP_CATEGORIES,
  CATEGORY_LABEL,
  FASHION_DEFAULT_SIZES,
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

export default function NewProductForm() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ShopCategory>("kits");
  const [sizePattern, setSizePattern] = useState<SizePattern>("jersey");
  const [customRows, setCustomRows] = useState<SizeChartRow[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [sizes, setSizes] = useState("S, M, L, XL, XXL");
  const [badgeText, setBadgeText] = useState("");
  const [inStock, setInStock] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [hasUclPatch, setHasUclPatch] = useState(false);

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
    const { error: insertError } = await supabase.from("products").insert({
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
      has_ucl_patch: hasUclPatch,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Straight to the storefront so the admin sees the new item live.
    router.push("/shop");
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

      {/* Publish to storefront — uncheck to save as a hidden draft. */}
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
            Leave unchecked to create a hidden draft customers can&rsquo;t see.
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

      {/* UCL patch upsell — offers the +৳200 Champions League patch add-on. */}
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={hasUclPatch}
          onChange={(e) => setHasUclPatch(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-zinc-700 text-gold-500 accent-gold-500 focus:ring-gold-500"
        />
        <span className="text-sm font-semibold text-white">
          Enable UCL Patch Option (+৳200)
          <span className="mt-0.5 block text-xs font-normal text-zinc-500">
            Lets customers add the Champions League sleeve patch on the product
            page.
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
              Adding…
            </>
          ) : (
            <>
              <PackagePlus className="h-4 w-4" />
              Add Product
            </>
          )}
        </button>
      </div>
    </form>
  );
}
