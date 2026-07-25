-- Shop: per-product squad roster for the kit font upsell, plus an optional
-- one-line announcement rendered next to the price on the product page.
--
-- `available_player_names` holds the roster entries exactly as the admin types
-- them (e.g. 'Bellingham - 5'), so the storefront can offer them verbatim in a
-- dropdown and echo the pick straight into the WhatsApp receipt.
--
-- This project isn't CLI-linked, so run this by hand in the Supabase SQL editor.
-- Idempotent: safe to run multiple times. Both columns are nullable — the
-- storefront parses `available_player_names` defensively (null → no roster), so
-- a row that predates this migration simply shows no player dropdown.

alter table public.products
  add column if not exists available_player_names text[];

alter table public.products
  add column if not exists special_announcement text;
