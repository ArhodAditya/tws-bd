// Checkout domain logic: the 64 districts of Bangladesh, district-based
// shipping rates, and the WhatsApp order-message builder.

import type { CartItem } from "@/context/CartContext";
import { FALLBACK_WHATSAPP_NUMBER } from "@/lib/shop";

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
  const itemLines = items.map((item) => {
    const sizePart = item.size ? ` (Size ${item.size})` : "";
    return `• ${item.quantity}x ${item.name}${sizePart} — ${
      item.price * item.quantity
    } BDT`;
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
