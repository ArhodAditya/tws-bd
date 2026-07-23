// Checkout domain logic: the 64 districts of Bangladesh, district-based
// shipping rates, and the WhatsApp order-message builder.

import type { CartItem } from "@/context/CartContext";
import { FALLBACK_WHATSAPP_NUMBER, UCL_PATCH_FEE, formatPrice } from "@/lib/shop";

// A cart line's money total: the per-unit price (which already folds in the
// custom-font fee when set) plus the UCL patch fee, times quantity. Single
// source of truth so the cart subtotal, the drawer line, and the WhatsApp
// receipt can never drift apart.
export function cartLineTotal(item: CartItem): number {
  const unitPrice = item.price + (item.uclPatch ? UCL_PATCH_FEE : 0);
  return unitPrice * item.quantity;
}

// All 64 districts of Bangladesh, alphabetical. "Chattogram" must be spelled
// exactly like this for the shipping rule below to match.
export const BD_DISTRICTS: string[] = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura",
  "Brahmanbaria", "Chandpur", "Chapainawabganj", "Chattogram", "Chuadanga",
  "Cox's Bazar", "Cumilla", "Dhaka", "Dinajpur", "Faridpur", "Feni",
  "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore",
  "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachhari", "Khulna",
  "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat",
  "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj",
  "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore",
  "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali",
  "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira",
  "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail",
  "Thakurgaon",
];

// Inside-Chattogram delivery is cheaper; everywhere else is the flat rate.
export const SHIPPING_CHATTOGRAM = 70;
export const SHIPPING_DEFAULT = 130;

// bKash number buyers send their advance to (single source for the checkout
// notice and the WhatsApp receipt).
export const BKASH_NUMBER = "01851613274 (Send Money Only)";

// Delivery charge for a district. Returns 0 when no district is selected yet so
// the grand total simply equals the subtotal until the buyer picks one.
export function getShipping(district: string): number {
  if (!district) return 0;
  return district === "Chattogram" ? SHIPPING_CHATTOGRAM : SHIPPING_DEFAULT;
}

export type PaymentMethod = "full" | "partial";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  full: "Full Advance",
  partial: "Partial Advance",
};

export type CheckoutDetails = {
  name: string;
  phone: string;
  district: string;
  address: string;
  payment: PaymentMethod;
};

// Heavy box-drawing rule used to frame the receipt.
const DIVIDER = "━━━━━━━━━━━━━━━━━━━";

// Build the plain-text order message (real newlines), formatted like a premium
// automated receipt. The caller wraps it in encodeURIComponent for the wa.me
// deep link, which turns each newline into %0A.
export function buildOrderMessage(
  details: CheckoutDetails,
  items: CartItem[],
  subtotal: number,
  shipping: number
): string {
  const itemLines = items.flatMap((item) => {
    const sizePart = item.size ? ` (Size ${item.size})` : "";
    const lines = [
      `• ${item.quantity}x ${item.name}${sizePart} — ${cartLineTotal(item)} BDT`,
    ];
    // Append an indented note beneath the item for each selected add-on so the
    // seller sees exactly what to print/attach. The whole message is later run
    // through encodeURIComponent in buildWhatsappOrderLink, which turns these
    // newlines into %0A and preserves the indent, so the wa.me deep link stays
    // intact on mobile.
    const customName = item.customName?.trim();
    if (customName) {
      lines.push(`    ↳ Custom Fonts: ${customName}`);
    }
    if (item.uclPatch) {
      lines.push(`    ↳ Add-ons: UCL Patch (+${formatPrice(UCL_PATCH_FEE)})`);
    }
    return lines;
  });

  const total = subtotal + shipping;

  return [
    "👑 THE WHITES BANGLADESH 👑",
    DIVIDER,
    "ORDER CONFIRMATION",
    "",
    "👤 Customer Details:",
    `• Name: ${details.name}`,
    `• Phone: ${details.phone}`,
    `• District: ${details.district}`,
    `• Address: ${details.address}`,
    "",
    "🛍️ Order Summary:",
    ...itemLines,
    "",
    "💳 Payment Breakdown:",
    `• Subtotal: ${subtotal} BDT`,
    `• Delivery Charge: ${shipping} BDT`,
    `• Grand Total: ${total} BDT`,
    "",
    `🏦 Payment Method: ${PAYMENT_LABEL[details.payment]}`,
    `📱 bKash Number: ${BKASH_NUMBER}`,
    "",
    DIVIDER,
    "¡Hala Madrid y nada más! 🤍",
  ].join("\n");
}

// Full wa.me deep link with the order pre-filled. Strips non-digits from the
// number (wa.me wants an international number with no +, spaces or dashes).
export function buildWhatsappOrderLink(
  details: CheckoutDetails,
  items: CartItem[],
  subtotal: number,
  shipping: number
): string {
  const number = (
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? FALLBACK_WHATSAPP_NUMBER
  ).replace(/\D/g, "");
  const message = buildOrderMessage(details, items, subtotal, shipping);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
