-- Shop: add the "fashion" category (hoodies / winter drops) and per-product
-- sizing blueprints. `size_pattern` picks which size chart the storefront
-- renders ('jersey' | 'fashion' | 'custom'); `custom_size_chart` holds the
-- admin-typed rows for the 'custom' pattern as a jsonb array of
-- [{ "size": "M", "chest": "40\"", "length": "27\"" }, ...].

-- Widen the category check to allow 'fashion'. The original constraint was
-- created inline in create_products, so it carries the default name.
alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
    check (category in ('jersey', 'turf', 'football', 'fashion'));

alter table public.products
  add column if not exists size_pattern text not null default 'jersey'
    check (size_pattern in ('jersey', 'fashion', 'custom'));

alter table public.products
  add column if not exists custom_size_chart jsonb;

-- Any fashion product created before this column existed should follow the
-- fashion chart rather than the jersey default.
update public.products
  set size_pattern = 'fashion'
  where category = 'fashion' and size_pattern = 'jersey';
