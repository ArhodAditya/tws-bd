"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Droplets,
  Dumbbell,
  Info,
  RotateCcw,
  Ruler,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Volleyball,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {
  CATEGORY_LABEL,
  CUSTOM_FONT_FEE,
  formatPrice,
  whatsappOrderUrl,
  type Product,
  type ShopCategory,
} from "@/lib/shop";
import { useCart } from "@/context/CartContext";
import ProductReviews from "@/components/ProductReviews";
import SizeGuideModal from "@/components/SizeGuideModal";

// Per-category accent icon, reused for the image fallback.
const CATEGORY_ICON: Record<ShopCategory, typeof Shirt> = {
  jersey: Shirt,
  turf: Dumbbell,
  football: Volleyball,
};

// Inline WhatsApp glyph (lucide has no brand icons).
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.728-.979zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

// --- Image gallery --------------------------------------------------------
// Edge-to-edge, full-bleed square on mobile; rounded card on desktop. Multiple
// images crossfade and get a thumbnail strip.
function Gallery({ product }: { product: Product }) {
  const images = (product.images ?? []).filter(Boolean);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const Icon = CATEGORY_ICON[product.category as ShopCategory] ?? ShoppingBag;
  const category =
    CATEGORY_LABEL[product.category as ShopCategory] ?? product.category;
  const showFallback = images.length === 0 || failed[active];

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-midnight-800/60 to-midnight-950 md:rounded-3xl md:border md:border-white/10">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`${product.name} — image ${i + 1}`}
            referrerPolicy="no-referrer"
            onError={() => setFailed((f) => ({ ...f, [i]: true }))}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-in-out ${
              i === active && !failed[i] ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {showFallback ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-1/3 w-1/3 text-gold-500/40" />
          </div>
        ) : null}

        <span className="absolute left-4 top-4 rounded-full border border-gold-500/30 bg-midnight-950/70 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gold-300 backdrop-blur">
          {category}
        </span>
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-2.5 overflow-x-auto px-4 md:px-0">
          {images.map((src, i) => {
            const isActive = i === active;
            return (
              <button
                key={src}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={isActive}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                  isActive
                    ? "scale-105 border-gold-500"
                    : "border-white/10 opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// --- Collapsible accordion ------------------------------------------------
function Accordion({
  icon: Icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: typeof Info;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-4 text-left"
      >
        <span className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wide text-white">
          <Icon className="h-4 w-4 text-gold-400" />
          {title}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div className="animate-in fade-in slide-in-from-top-1 pb-5 text-sm leading-relaxed text-zinc-300 duration-200">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export default function ProductDetail({
  product,
  whatsappNumber,
}: {
  product: Product;
  whatsappNumber: string;
}) {
  const hasSizes = product.sizes && product.sizes.length > 0;
  const isJersey = product.category === "jersey";
  const [size, setSize] = useState<string | null>(
    hasSizes ? product.sizes[0] : null
  );
  const [customName, setCustomName] = useState("");
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price ?? 0,
      size,
      image: product.images?.[0] ?? null,
    });
  };

  const orderUrl = whatsappOrderUrl(
    product,
    size,
    whatsappNumber,
    isJersey ? customName : null
  );
  const hasCustom = isJersey && customName.trim().length > 0;
  const displayTotal = hasCustom
    ? (product.price ?? 0) + CUSTOM_FONT_FEE
    : product.price ?? 0;

  return (
    <div className="bg-zinc-950 text-white">
      {/* Back link */}
      <div className="mx-auto max-w-6xl px-4 pt-5 md:px-6 lg:px-8">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-gold-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>
      </div>

      {/* Two-column on desktop: sticky image left, scrolling details right. */}
      <div className="mx-auto max-w-6xl pb-32 md:grid md:grid-cols-2 md:gap-10 md:px-6 md:pb-12 lg:gap-14 lg:px-8">
        {/* Image — edge-to-edge on mobile, sticky on desktop */}
        <div className="mt-4 md:mt-6 md:sticky md:top-24 md:self-start">
          <Gallery product={product} />
        </div>

        {/* Details */}
        <div className="px-4 pt-6 md:px-0">
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-3 font-display text-3xl font-extrabold text-gold-300">
            {formatPrice(displayTotal)}
            {hasCustom ? (
              <span className="ml-2 align-middle text-sm font-medium text-zinc-400 line-through">
                {formatPrice(product.price)}
              </span>
            ) : null}
          </p>

          {/* Stock status */}
          <div className="mt-4">
            {product.in_stock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <Check className="h-3.5 w-3.5" />
                In stock — ready to ship
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-400">
                Currently sold out
              </span>
            )}
          </div>

          {/* Tap-friendly size pills */}
          {hasSizes ? (
            <div className="mt-7">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold uppercase tracking-wide text-white">
                  Select size
                </p>
                {isJersey ? (
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-500/5 px-3 py-1.5 text-xs font-semibold text-gold-300 transition hover:bg-gold-500/15"
                  >
                    <Ruler className="h-3.5 w-3.5" />
                    Size Guide
                  </button>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {product.sizes.map((option) => {
                  const active = option === size;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSize(option)}
                      aria-pressed={active}
                      className={`flex h-12 min-w-12 items-center justify-center rounded-xl border px-4 text-sm font-bold transition ${
                        active
                          ? "border-gold-500 bg-gold-500/15 text-gold-200"
                          : "border-white/15 bg-white/5 text-zinc-200 hover:border-gold-500/50"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Custom font upsell — jerseys only */}
          {isJersey ? (
            <div className="mt-7">
              <label
                htmlFor="custom-name"
                className="text-sm font-bold uppercase tracking-wide text-white"
              >
                Add Fonts{" "}
                <span className="font-medium normal-case text-zinc-400">
                  (optional)
                </span>
              </label>
              <input
                id="custom-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                maxLength={32}
                placeholder="E.g., VINÍCIUS JR - 7"
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
              />
              <p className="mt-1.5 text-xs text-zinc-400">
                High-quality official fonts — +{formatPrice(CUSTOM_FONT_FEE)}{" "}
                extra.
              </p>
            </div>
          ) : null}

          {/* Desktop actions — on mobile these live in the sticky bottom bar. */}
          <div className="mt-8 hidden gap-3 md:flex md:flex-col">
            {product.in_stock ? (
              <>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-6 py-3.5 text-sm font-bold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform hover:scale-[1.02]"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
                <a
                  href={orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-gold-500/50 hover:text-gold-300"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Order via WhatsApp
                </a>
              </>
            ) : (
              <div className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-400">
                Currently Sold Out
              </div>
            )}
          </div>

          {/* Clean, collapsible detail accordions */}
          <div className="mt-9">
            <Accordion icon={Info} title="Product Details" defaultOpen>
              {product.description ? (
                <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                    {product.description}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>
                  Premium quality, crafted for the Madridista faithful. Message
                  us on WhatsApp for any specifics on fabric, fit, or
                  authenticity.
                </p>
              )}
            </Accordion>
            <Accordion icon={Truck} title="Shipping">
              <p>
                Fast delivery across Bangladesh — typically 2–5 business days
                after your order is confirmed on WhatsApp. Cash on delivery is
                available nationwide. 🤍
              </p>
              <p className="mt-3">
                Please note: It can take up to 7-15 days for products which are
                on pre-order.
              </p>
            </Accordion>
            <Accordion icon={RotateCcw} title="Returns">
              <p>
                Every piece is strictly quality-checked before dispatch. Please
                note that no returns or exchanges are accepted for sizing issues,
                so be sure to review the size guide carefully before placing your
                order. If you receive a defective or incorrect item, return
                requests must be made within 24 hours of delivery. The item must
                remain unused with all original tags intact. Just message us on
                WhatsApp to arrange it.
              </p>
            </Accordion>
            <Accordion icon={Droplets} title="Wash Care Guide (Player Edition)">
              <p>
                A-Grade Player Edition jerseys feature delicate, heat-pressed
                logos and numbers. To ensure longevity:
              </p>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5">
                <li>Always turn the jersey inside out before washing.</li>
                <li>Hand wash or use a gentle, cold machine cycle.</li>
                <li>
                  Do NOT soak in water for long periods or use heavy
                  detergents/fabric softeners, as this will peel the prints.
                </li>
                <li>Air dry only—never tumble dry or iron over the prints.</li>
              </ol>
            </Accordion>
          </div>

          {/* Fan reviews */}
          <ProductReviews productId={product.id} />
        </div>
      </div>

      {/* Mobile sticky Add to Cart bar */}
      <div className="fixed bottom-0 left-0 z-50 w-full border-t border-zinc-800 bg-zinc-950/90 p-4 backdrop-blur-md md:hidden">
        {product.in_stock ? (
          <div className="flex items-center gap-3">
            <a
              href={orderUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Order via WhatsApp"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-200 transition hover:border-gold-500/50 hover:text-gold-300"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={handleAddToCart}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-300 to-gold-500 px-5 py-3.5 text-sm font-bold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] transition-transform active:scale-[0.98]"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart · {formatPrice(displayTotal)}
            </button>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-400">
            Currently Sold Out
          </div>
        )}
      </div>

      {/* Jersey size guide modal */}
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />
    </div>
  );
}
