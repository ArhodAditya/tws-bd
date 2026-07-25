"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Droplets,
  Info,
  Megaphone,
  RotateCcw,
  Ruler,
  ShoppingCart,
  Trophy,
  Truck,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {
  CUSTOM_FONT_ADVANCE,
  CUSTOM_FONT_FEE,
  NO_FONT,
  UCL_PATCH_FEE,
  categoryLabel,
  fontFee,
  formatPrice,
  normalizeFontSelection,
  parseCustomSizeChart,
  parsePlayerNames,
  resolveSizePattern,
  whatsappOrderUrl,
  type FontType,
  type Product,
} from "@/lib/shop";
import { useCart } from "@/context/CartContext";
import { WhatsAppIcon } from "@/components/BrandIcons";
import {
  CATEGORY_ICON,
  CATEGORY_ICON_FALLBACK,
} from "@/components/shop/categoryIcon";
import ProductReviews from "@/components/ProductReviews";
import SizeGuideModal from "@/components/SizeGuideModal";

// --- Image gallery --------------------------------------------------------
// Edge-to-edge, full-bleed square on mobile; rounded card on desktop. Multiple
// images crossfade and get a thumbnail strip.
function Gallery({ product }: { product: Product }) {
  const images = (product.images ?? []).filter(Boolean);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const Icon = CATEGORY_ICON[product.category] ?? CATEGORY_ICON_FALLBACK;
  const category = categoryLabel(product.category);
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
            // Every frame stacks in the viewport for the crossfade, so `lazy`
            // alone wouldn't defer them. Instead the first frame — the LCP
            // element on this page — takes high priority and the rest drop to
            // low so they can't compete with it for bandwidth.
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "low"}
            decoding="async"
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
                  loading="lazy"
                  decoding="async"
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
  // "kits" is the rebranded jersey category — it still drives the jersey size
  // guide and the custom name/number font upsell.
  const isJersey = product.category === "kits";
  // Which size chart this product renders: jersey (standard kit), fashion
  // (winter-drop hoodie) or custom (admin-typed rows). The jersey chart only
  // makes sense on actual jerseys — turf/football rows keep the default
  // pattern but shouldn't show a shirt chart.
  const sizePattern = resolveSizePattern(product);
  const customSizeRows =
    sizePattern === "custom"
      ? parseCustomSizeChart(product.custom_size_chart)
      : [];
  const showSizeGuide =
    sizePattern === "fashion" ||
    (sizePattern === "custom" && customSizeRows.length > 0) ||
    (sizePattern === "jersey" && isJersey);
  // Roster the admin curated for this kit; empty means the "Player Name" option
  // simply isn't offered.
  const playerNames = useMemo(
    () => parsePlayerNames(product.available_player_names),
    [product.available_player_names]
  );
  const [size, setSize] = useState<string | null>(
    hasSizes ? product.sizes[0] : null
  );
  // Font upsell: none, a squad player off the roster, or the buyer's own
  // name + number.
  const [fontType, setFontType] = useState<FontType>("none");
  const [playerName, setPlayerName] = useState(playerNames[0] ?? "");
  const [customText, setCustomText] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  // Optional +200 BDT Champions League patch, offered only when the admin has
  // flagged the product with has_ucl_patch.
  const [uclPatch, setUclPatch] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  // Playful post-tap feedback: the button briefly flips to "In the Bag!" with
  // a springy label swap before returning to its resting state.
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<number | null>(null);
  const { addItem } = useCart();

  // The buyer's font choice in canonical form. normalizeFontSelection collapses
  // a half-filled form back to "none", so the +250 can't be charged for a print
  // with nothing on it.
  const fontSelection = useMemo(() => {
    if (!isJersey || fontType === "none") return NO_FONT;
    return normalizeFontSelection(
      fontType === "player"
        ? { type: "player", text: playerName }
        : { type: "custom", text: customText, number: customNumber }
    );
  }, [isJersey, fontType, playerName, customText, customNumber]);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      // Base price only — the font fee and patch fee are not folded in here.
      // They ride on the line and are applied by cartLineTotal, so the cart
      // subtotal and the receipt account for them per unit.
      price: product.price ?? 0,
      size,
      image: product.images?.[0] ?? null,
      fontSelection,
      uclPatch,
    });
    setJustAdded(true);
    if (addedTimer.current) window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setJustAdded(false), 1400);
  };

  // Shared springy label swap for both Add-to-Cart buttons.
  const addLabel = (label: ReactNode) => (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={justAdded ? "added" : "add"}
        initial={{ y: 10, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -10, opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className="inline-flex items-center gap-2"
      >
        {justAdded ? (
          <>
            <Check className="h-5 w-5" />
            In the Bag! 👑
          </>
        ) : (
          label
        )}
      </motion.span>
    </AnimatePresence>
  );

  const orderUrl = whatsappOrderUrl(
    product,
    size,
    whatsappNumber,
    fontSelection,
    uclPatch
  );
  const basePrice = product.price ?? 0;
  const displayTotal =
    basePrice + fontFee(fontSelection) + (uclPatch ? UCL_PATCH_FEE : 0);

  const announcement = product.special_announcement?.trim();

  // Radio options for the font selector. "Player Name" only appears once the
  // admin has actually listed a roster on this product.
  const fontOptions: { value: FontType; label: string; hint: string }[] = [
    { value: "none", label: "No Font", hint: "Plain kit" },
    ...(playerNames.length > 0
      ? [
          {
            value: "player" as const,
            label: "Player Name",
            hint: `+${formatPrice(CUSTOM_FONT_FEE)}`,
          },
        ]
      : []),
    {
      value: "custom",
      label: "Custom Name",
      hint: `+${formatPrice(CUSTOM_FONT_FEE)}`,
    },
  ];

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
            {displayTotal > basePrice ? (
              <span className="ml-2 align-middle text-sm font-medium text-zinc-400 line-through">
                {formatPrice(product.price)}
              </span>
            ) : null}
          </p>

          {/* Special announcement — an admin-authored line (pre-order window,
              restock date, drop notice) that has to be impossible to miss, so it
              sits directly under the price as a highlighted banner. */}
          {announcement ? (
            <div
              role="status"
              className="mt-4 flex items-start gap-3 rounded-xl border border-gold-500/40 bg-gradient-to-r from-gold-500/15 to-gold-500/[0.04] px-4 py-3 shadow-[0_0_26px_-14px_rgba(212,175,55,0.9)]"
            >
              <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
              <p className="text-sm font-semibold leading-relaxed text-gold-100">
                {announcement}
              </p>
            </div>
          ) : null}

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
                {showSizeGuide ? (
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
                      className={`flex h-12 min-w-12 items-center justify-center rounded-xl border px-4 text-sm font-bold tracking-widest transition-all duration-300 ease-out active:scale-[0.98] ${
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

          {/* Font upsell — jerseys only. Three mutually exclusive choices, so a
              radio group rather than a checkbox: plain, a squad player off the
              admin's roster, or the buyer's own name and number. */}
          {isJersey ? (
            <div className="mt-7">
              <span className="text-sm font-bold uppercase tracking-wide text-white">
                Add Fonts{" "}
                <span className="font-medium normal-case text-zinc-400">
                  (optional)
                </span>
              </span>

              <div
                role="radiogroup"
                aria-label="Name and number printing"
                className="mt-3 grid gap-2.5 sm:grid-cols-3"
              >
                {fontOptions.map((option) => {
                  const active = fontType === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 transition-all duration-300 ease-out active:scale-[0.99] ${
                        active
                          ? "border-gold-500 bg-gold-500/15"
                          : "border-white/15 bg-white/5 hover:border-gold-500/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="font-type"
                        value={option.value}
                        checked={active}
                        onChange={() => setFontType(option.value)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          active ? "border-gold-500" : "border-white/30"
                        }`}
                      >
                        {active ? (
                          <span className="h-2 w-2 rounded-full bg-gold-400" />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-sm font-bold ${
                            active ? "text-gold-200" : "text-zinc-200"
                          }`}
                        >
                          {option.label}
                        </span>
                        <span className="block truncate text-xs text-zinc-400">
                          {option.hint}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Squad roster — the admin's list, offered verbatim */}
              {fontType === "player" ? (
                <div className="mt-3">
                  <label
                    htmlFor="player-name"
                    className="text-xs font-semibold text-zinc-300"
                  >
                    Choose a player
                  </label>
                  <div className="relative mt-1.5">
                    <select
                      id="player-name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                    >
                      {playerNames.map((option) => (
                        <option
                          key={option}
                          value={option}
                          className="bg-midnight-900"
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  </div>
                </div>
              ) : null}

              {/* Buyer's own name + number */}
              {fontType === "custom" ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <label
                      htmlFor="custom-font-name"
                      className="text-xs font-semibold text-zinc-300"
                    >
                      Name
                    </label>
                    <input
                      id="custom-font-name"
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      maxLength={24}
                      placeholder="E.g., ADITYA"
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm uppercase tracking-wide text-white outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                    />
                  </div>
                  <div className="sm:w-28">
                    <label
                      htmlFor="custom-font-number"
                      className="text-xs font-semibold text-zinc-300"
                    >
                      Number
                    </label>
                    <input
                      id="custom-font-number"
                      type="text"
                      inputMode="numeric"
                      value={customNumber}
                      onChange={(e) =>
                        // Shirt numbers only — strip anything else as it's typed.
                        setCustomNumber(e.target.value.replace(/\D/g, ""))
                      }
                      maxLength={2}
                      placeholder="10"
                      className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
                    />
                  </div>
                </div>
              ) : null}

              <p className="mt-2 text-xs text-zinc-400">
                High-quality official fonts — +{formatPrice(CUSTOM_FONT_FEE)}{" "}
                extra.
                {fontType === "custom" ? (
                  <span className="text-amber-400">
                    {" "}
                    Custom prints are made to order:{" "}
                    {formatPrice(CUSTOM_FONT_ADVANCE)} of this is payable in
                    advance.
                  </span>
                ) : null}
              </p>
            </div>
          ) : null}

          {/* UCL patch upsell — only when the admin enabled it on this product */}
          {product.has_ucl_patch ? (
            <div className="mt-7">
              <span className="text-sm font-bold uppercase tracking-wide text-white">
                Match Detailing
              </span>
              <button
                type="button"
                onClick={() => setUclPatch((v) => !v)}
                aria-pressed={uclPatch}
                className={`mt-2 flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-300 ease-out active:scale-[0.99] ${
                  uclPatch
                    ? "border-gold-500 bg-gold-500/15 shadow-[0_0_26px_-10px_rgba(212,175,55,0.9)]"
                    : "border-white/15 bg-white/5 hover:border-gold-500/50"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      uclPatch
                        ? "border-gold-500 bg-gold-500 text-midnight-950"
                        : "border-white/20 text-gold-300"
                    }`}
                  >
                    <Trophy className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-white">
                      Add UCL Patch
                    </span>
                    <span className="block truncate text-xs text-zinc-400">
                      Official Champions League sleeve badge
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  <span className="text-sm font-bold text-gold-300">
                    +{formatPrice(UCL_PATCH_FEE)}
                  </span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                      uclPatch
                        ? "border-gold-500 bg-gold-500 text-midnight-950"
                        : "border-white/25"
                    }`}
                  >
                    {uclPatch ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                </span>
              </button>
            </div>
          ) : null}

          {/* Desktop actions — on mobile these live in the sticky bottom bar. */}
          <div className="mt-8 hidden gap-3 md:flex md:flex-col">
            {product.in_stock ? (
              <>
                <motion.button
                  type="button"
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 420, damping: 17 }}
                  className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] ${
                    justAdded
                      ? "bg-gradient-to-r from-pitch-300 to-pitch-500"
                      : "bg-gradient-to-r from-gold-300 to-gold-500"
                  }`}
                >
                  {addLabel(
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </motion.button>
                <a
                  href={orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-200 transition-all duration-300 ease-out hover:border-gold-500/50 hover:text-amber-400 active:scale-[0.98]"
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
            <motion.button
              type="button"
              onClick={handleAddToCart}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 420, damping: 17 }}
              className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-midnight-950 shadow-[0_0_22px_-8px_rgba(212,175,55,0.9)] ${
                justAdded
                  ? "bg-gradient-to-r from-pitch-300 to-pitch-500"
                  : "bg-gradient-to-r from-gold-300 to-gold-500"
              }`}
            >
              {addLabel(
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart · {formatPrice(displayTotal)}
                </>
              )}
            </motion.button>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-400">
            Currently Sold Out
          </div>
        )}
      </div>

      {/* Size guide modal — chart rendered per the product's sizing blueprint */}
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        pattern={sizePattern}
        customRows={customSizeRows}
      />
    </div>
  );
}
