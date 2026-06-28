-- Three small schema additions to drive sales and flesh out the review system:
--
--   1. products.badge_text — optional promo tag rendered on the storefront card
--      (e.g. "15% OFF", "HOT"). Nullable: most products won't have one.
--
--   2. fan_reviews.display_name — optional custom name a fan can attach to a
--      review; the wall falls back to their profile name when it's blank.
--
--   3. fan_reviews.user_id is made nullable so an admin can post a manual review
--      "on behalf of" a customer who has no registered account (user_id = null).
--      The existing FK to public.profiles still applies to non-null values.
--
-- Idempotent: safe to run multiple times.

alter table public.products
  add column if not exists badge_text text;

alter table public.fan_reviews
  add column if not exists display_name text;

-- Allow admin-authored reviews that aren't tied to a registered user account.
alter table public.fan_reviews
  alter column user_id drop not null;
