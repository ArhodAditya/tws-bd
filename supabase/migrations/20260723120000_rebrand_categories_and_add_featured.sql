-- Shop overhaul: rebrand the product taxonomy to Kits / Streetwear / Accessories
-- and add an admin-controlled `is_featured` flag that drives the new homepage
-- Featured section.
--
-- Category remap (old -> new):
--   jersey   -> kits
--   fashion  -> streetwear
--   turf     -> accessories
--   football -> accessories
--
-- NOTE: `size_pattern` is a SEPARATE column (jersey | fashion | custom) that
-- picks which size chart renders. It is intentionally left UNTOUCHED — its
-- values are internal chart keys, not user-facing categories, so renaming them
-- would break the size-guide logic for no benefit.
--
-- This project isn't CLI-linked, so run this by hand in the Supabase SQL editor.
-- Idempotent: safe to run multiple times.

-- 1. Drop the old category CHECK first so the remap can't be rejected mid-flight.
alter table public.products
  drop constraint if exists products_category_check;

-- 2. Remap existing rows to the new taxonomy (no-ops once already migrated).
update public.products set category = 'kits'        where category = 'jersey';
update public.products set category = 'streetwear'  where category = 'fashion';
update public.products set category = 'accessories' where category in ('turf', 'football');

-- 3. Re-point the column default and re-assert the CHECK for the new taxonomy.
alter table public.products
  alter column category set default 'kits';

alter table public.products
  add constraint products_category_check
    check (category in ('kits', 'streetwear', 'accessories'));

-- 4. Homepage feature flag. Existing rows backfill to false (not featured).
alter table public.products
  add column if not exists is_featured boolean not null default false;
