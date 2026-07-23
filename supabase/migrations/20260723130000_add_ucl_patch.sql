-- Shop: optional "UCL Patch" upsell for jerseys. When an admin enables
-- `has_ucl_patch` on a product, the storefront offers a +200 BDT Champions
-- League sleeve patch add-on that flows through the cart and the WhatsApp
-- checkout message.
--
-- This project isn't CLI-linked, so run this by hand in the Supabase SQL editor.
-- Idempotent: safe to run multiple times. Existing rows backfill to false.

alter table public.products
  add column if not exists has_ucl_patch boolean not null default false;
